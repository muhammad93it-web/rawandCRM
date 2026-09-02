import { Router, type IRouter } from "express";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  db,
  stockMovementsTable,
  stockTransferLinesTable,
  stockTransfersTable,
  warehouseStockTable,
} from "@workspace/db";
import {
  CancelStockTransferParams,
  CreateStockMovementBody,
  CreateStockMovementResponse,
  CreateStockTransferBody,
  CreateStockTransferResponse,
  GetStockTransferParams,
  GetStockTransferResponse,
  ListStockMovementsQueryParams,
  ListStockMovementsResponse,
  ListStockTransfersQueryParams,
  ListStockTransfersResponse,
  UpdateStockTransferBody,
  UpdateStockTransferParams,
  UpdateStockTransferResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
type Response = Parameters<Parameters<IRouter["get"]>[1]>[1];

const invalid = (res: Response, message: string) => res.status(400).json({ error: message });

const persistenceError = (res: Response, error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  res.status(code === "23503" ? 400 : code === "23505" ? 409 : 500).json({
    error: code === "23503"
      ? "A referenced record does not exist"
      : code === "23505"
        ? "A record with the same unique value already exists"
        : "Could not persist stock record",
  });
};

const dbDate = (value: Date) => value.toISOString().slice(0, 10);

async function transferWithLines(id: number) {
  const [transfer] = await db.select().from(stockTransfersTable)
    .where(eq(stockTransfersTable.id, id));
  if (!transfer) return undefined;
  const lines = await db.select({
    id: stockTransferLinesTable.id,
    itemId: stockTransferLinesTable.itemId,
    quantity: stockTransferLinesTable.quantity,
  }).from(stockTransferLinesTable)
    .where(eq(stockTransferLinesTable.transferId, id));
  return { ...transfer, lines };
}

async function transferListWithLines(transfers: Array<typeof stockTransfersTable.$inferSelect>) {
  if (transfers.length === 0) return [];
  const lines = await db.select({
    id: stockTransferLinesTable.id,
    transferId: stockTransferLinesTable.transferId,
    itemId: stockTransferLinesTable.itemId,
    quantity: stockTransferLinesTable.quantity,
  }).from(stockTransferLinesTable)
    .where(inArray(stockTransferLinesTable.transferId, transfers.map((transfer) => transfer.id)));
  const linesByTransfer = new Map<number, typeof lines>();
  for (const line of lines) {
    const current = linesByTransfer.get(line.transferId) ?? [];
    current.push(line);
    linesByTransfer.set(line.transferId, current);
  }
  return transfers.map((transfer) => ({
    ...transfer,
    lines: (linesByTransfer.get(transfer.id) ?? []).map(({ id, itemId, quantity }) => ({ id, itemId, quantity })),
  }));
}

async function completeTransfer(id: number) {
  return db.transaction(async (tx) => {
    const [transfer] = await tx.select().from(stockTransfersTable)
      .where(eq(stockTransfersTable.id, id));
    if (!transfer) throw new Error("NOT_FOUND");
    if (transfer.status === "completed") return transfer;
    if (transfer.status === "cancelled") throw new Error("CANCELLED");

    const lines = await tx.select().from(stockTransferLinesTable)
      .where(eq(stockTransferLinesTable.transferId, id));
    if (lines.length === 0) throw new Error("EMPTY_TRANSFER");

    const totals = new Map<number, number>();
    for (const line of lines) totals.set(line.itemId, (totals.get(line.itemId) ?? 0) + line.quantity);
    for (const [itemId, quantity] of totals) {
      const [stock] = await tx.select().from(warehouseStockTable).where(and(
        eq(warehouseStockTable.warehouseId, transfer.fromWarehouseId),
        eq(warehouseStockTable.itemId, itemId),
      ));
      if (!stock || stock.quantity < quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${itemId}`);
      }
    }

    for (const [itemId, quantity] of totals) {
      await tx.update(warehouseStockTable)
        .set({ quantity: sql`${warehouseStockTable.quantity} - ${quantity}` })
        .where(and(
          eq(warehouseStockTable.warehouseId, transfer.fromWarehouseId),
          eq(warehouseStockTable.itemId, itemId),
        ));
      await tx.insert(warehouseStockTable).values({
        warehouseId: transfer.toWarehouseId,
        itemId,
        quantity,
        reorderLevel: 0,
      }).onConflictDoUpdate({
        target: [warehouseStockTable.warehouseId, warehouseStockTable.itemId],
        set: { quantity: sql`${warehouseStockTable.quantity} + ${quantity}` },
      });
      await tx.insert(stockMovementsTable).values([
        {
          warehouseId: transfer.fromWarehouseId,
          itemId,
          movementDate: transfer.transferDate,
          type: "transfer_out",
          quantity: -quantity,
          referenceType: "stock_transfer",
          referenceId: id,
          note: transfer.note,
        },
        {
          warehouseId: transfer.toWarehouseId,
          itemId,
          movementDate: transfer.transferDate,
          type: "transfer_in",
          quantity,
          referenceType: "stock_transfer",
          referenceId: id,
          note: transfer.note,
        },
      ]);
    }
    const [completed] = await tx.update(stockTransfersTable)
      .set({ status: "completed" })
      .where(eq(stockTransfersTable.id, id))
      .returning();
    return completed;
  });
}

router.get("/stock-transfers", async (req, res): Promise<void> => {
  const query = ListStockTransfersQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [];
  if (query.data.status) filters.push(eq(stockTransfersTable.status, query.data.status));
  if (query.data.fromWarehouseId) filters.push(eq(stockTransfersTable.fromWarehouseId, query.data.fromWarehouseId));
  if (query.data.toWarehouseId) filters.push(eq(stockTransfersTable.toWarehouseId, query.data.toWarehouseId));
  const transfers = await db.select().from(stockTransfersTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(stockTransfersTable.transferDate), desc(stockTransfersTable.id));
  res.json(ListStockTransfersResponse.parse(await transferListWithLines(transfers)));
});

router.post("/stock-transfers", async (req, res): Promise<void> => {
  const body = CreateStockTransferBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  if (body.data.fromWarehouseId === body.data.toWarehouseId) {
    invalid(res, "Source and destination warehouses must be different");
    return;
  }
  try {
    const [transfer] = await db.insert(stockTransfersTable).values({
      fromWarehouseId: body.data.fromWarehouseId,
      toWarehouseId: body.data.toWarehouseId,
      transferDate: dbDate(body.data.transferDate),
      note: body.data.note ?? "",
      status: "draft",
    }).returning();
    if (body.data.lines?.length) {
      await db.insert(stockTransferLinesTable).values(
        body.data.lines.map((line) => ({ transferId: transfer.id, ...line })),
      );
    }
    res.status(201).json(CreateStockTransferResponse.parse(await transferWithLines(transfer.id)));
  } catch (error) { persistenceError(res, error); }
});

router.get("/stock-transfers/:id", async (req, res): Promise<void> => {
  const params = GetStockTransferParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const transfer = await transferWithLines(params.data.id);
  if (!transfer) { res.status(404).json({ error: "Stock transfer not found" }); return; }
  res.json(GetStockTransferResponse.parse(transfer));
});

router.patch("/stock-transfers/:id", async (req, res): Promise<void> => {
  const params = UpdateStockTransferParams.safeParse(req.params);
  const body = UpdateStockTransferBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    if (body.data.status === "completed") {
      const completed = await completeTransfer(params.data.id);
      res.json(UpdateStockTransferResponse.parse(await transferWithLines(completed.id)));
      return;
    }
    const current = await transferWithLines(params.data.id);
    if (!current) { res.status(404).json({ error: "Stock transfer not found" }); return; }
    if (current.status !== "draft") {
      res.status(409).json({ error: "Only draft transfers can be edited" });
      return;
    }
    if (body.data.fromWarehouseId && body.data.toWarehouseId
      && body.data.fromWarehouseId === body.data.toWarehouseId) {
      invalid(res, "Source and destination warehouses must be different");
      return;
    }
    const { lines, transferDate, ...header } = body.data;
    const normalizedHeader = {
      ...header,
      ...(transferDate ? { transferDate: dbDate(transferDate) } : {}),
    };
    await db.transaction(async (tx) => {
      if (Object.keys(normalizedHeader).length) await tx.update(stockTransfersTable).set(normalizedHeader)
        .where(eq(stockTransfersTable.id, params.data.id));
      if (lines) {
        await tx.delete(stockTransferLinesTable)
          .where(eq(stockTransferLinesTable.transferId, params.data.id));
        if (lines.length) await tx.insert(stockTransferLinesTable).values(
          lines.map((line) => ({ transferId: params.data.id, ...line })),
        );
      }
    });
    res.json(UpdateStockTransferResponse.parse(await transferWithLines(params.data.id)));
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") { res.status(404).json({ error: "Stock transfer not found" }); return; }
    if (error instanceof Error && error.message === "CANCELLED") { res.status(409).json({ error: "Cancelled transfers cannot be completed" }); return; }
    if (error instanceof Error && error.message === "EMPTY_TRANSFER") { invalid(res, "At least one transfer line is required"); return; }
    if (error instanceof Error && error.message.startsWith("INSUFFICIENT_STOCK:")) {
      res.status(409).json({ error: "Insufficient stock for one or more transfer lines" });
      return;
    }
    persistenceError(res, error);
  }
});

router.delete("/stock-transfers/:id", async (req, res): Promise<void> => {
  const params = CancelStockTransferParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [cancelled] = await db.update(stockTransfersTable)
    .set({ status: "cancelled" })
    .where(and(eq(stockTransfersTable.id, params.data.id), eq(stockTransfersTable.status, "draft")))
    .returning({ id: stockTransfersTable.id });
  if (!cancelled) { res.status(404).json({ error: "Draft stock transfer not found" }); return; }
  res.sendStatus(204);
});

router.get("/stock-movements", async (req, res): Promise<void> => {
  const query = ListStockMovementsQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [];
  if (query.data.warehouseId) filters.push(eq(stockMovementsTable.warehouseId, query.data.warehouseId));
  if (query.data.itemId) filters.push(eq(stockMovementsTable.itemId, query.data.itemId));
  const rows = await db.select().from(stockMovementsTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(stockMovementsTable.movementDate), desc(stockMovementsTable.id));
  res.json(ListStockMovementsResponse.parse(rows));
});

router.post("/stock-movements", async (req, res): Promise<void> => {
  const body = CreateStockMovementBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.transaction(async (tx) => {
      const [movement] = await tx.insert(stockMovementsTable).values({
        ...body.data,
        movementDate: dbDate(body.data.movementDate),
      }).returning();
      await tx.insert(warehouseStockTable).values({
        warehouseId: movement.warehouseId,
        itemId: movement.itemId,
        quantity: movement.quantity,
        reorderLevel: 0,
      }).onConflictDoUpdate({
        target: [warehouseStockTable.warehouseId, warehouseStockTable.itemId],
        set: { quantity: sql`${warehouseStockTable.quantity} + ${movement.quantity}` },
      });
      return [movement] as const;
    });
    res.status(201).json(CreateStockMovementResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

export default router;