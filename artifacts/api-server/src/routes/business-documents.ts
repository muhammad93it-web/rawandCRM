import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  accountsTable,
  db,
  documentLinesTable,
  documentsTable,
  itemsTable,
  paymentsTable,
  warehouseStockTable,
} from "@workspace/db";
import {
  CreateBusinessDocumentBody,
  CreateBusinessDocumentResponse,
  DeleteBusinessDocumentParams,
  GetBusinessDocumentParams,
  GetBusinessDocumentResponse,
  ListBusinessDocumentsQueryParams,
  ListBusinessDocumentsResponse,
  UpdateBusinessDocumentBody,
  UpdateBusinessDocumentParams,
  UpdateBusinessDocumentResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
type Response = Parameters<Parameters<IRouter["get"]>[1]>[1];
const invalid = (res: Response, message: string) => res.status(400).json({ error: message });

const serializeDocument = async (document: typeof documentsTable.$inferSelect) => {
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, document.accountId));
  const lines = await db.select().from(documentLinesTable)
    .where(eq(documentLinesTable.documentId, document.id))
    .orderBy(asc(documentLinesTable.id));
  return {
    id: document.id,
    workplaceId: document.workplaceId,
    warehouseId: document.warehouseId,
    accountId: document.accountId,
    accountName: account?.name ?? "—",
    kind: document.kind,
    number: document.number,
    documentDate: document.documentDate,
    validUntil: document.validUntil,
    currency: document.currency,
    paymentType: document.paymentType,
    status: document.status,
    discount: document.discount,
    tax: document.tax,
    total: document.total,
    paidAmount: document.paidAmount,
    notes: document.notes,
    lines: lines.map((line) => ({
      id: line.id,
      itemId: line.itemId,
      warehouseId: line.warehouseId,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discount: line.discount,
      tax: line.tax,
      lineTotal: line.lineTotal,
    })),
    createdAt: document.createdAt,
  };
};

const serializeDocuments = async (documents: typeof documentsTable.$inferSelect[]) =>
  Promise.all(documents.map(serializeDocument));

router.get("/business-documents", async (req, res): Promise<void> => {
  const query = ListBusinessDocumentsQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(documentsTable.deletedAt)];
  if (query.data.kind) filters.push(eq(documentsTable.kind, query.data.kind));
  if (query.data.status) filters.push(eq(documentsTable.status, query.data.status));
  const documents = await db.select().from(documentsTable)
    .where(and(...filters))
    .orderBy(desc(documentsTable.documentDate), desc(documentsTable.id));
  res.json(ListBusinessDocumentsResponse.parse(await serializeDocuments(documents)));
});

router.post("/business-documents", async (req, res): Promise<void> => {
  const body = CreateBusinessDocumentBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  const input = body.data;
  if (["sale_return", "sale_talaf"].includes(input.kind) && input.lines.some((line) => !line.itemId)) {
    invalid(res, "A stock item is required for this document type");
    return;
  }

  try {
    const created = await db.transaction(async (tx) => {
      const [account] = await tx.select().from(accountsTable).where(eq(accountsTable.id, input.accountId));
      if (!account) throw new Error("ACCOUNT_NOT_FOUND");
      const itemIds = [...new Set(input.lines.flatMap((line) => line.itemId ? [line.itemId] : []))];
      const items = itemIds.length ? await tx.select().from(itemsTable).where(inArray(itemsTable.id, itemIds)) : [];
      if (items.length !== itemIds.length) throw new Error("ITEM_NOT_FOUND");
      const taxTotal = input.lines.reduce((sum, line) => sum + line.tax, 0);
      const lineTotal = input.lines.reduce((sum, line) => sum + Math.max(0, line.quantity * line.unitPrice - line.discount + line.tax), 0);
      const total = Math.max(0, lineTotal - input.discount + input.tax);
      if (input.paidAmount > total) throw new Error("PAID_AMOUNT_EXCEEDS_TOTAL");
      const number = `${input.kind.toUpperCase()}-${Date.now().toString().slice(-7)}-${randomUUID().slice(0, 4).toUpperCase()}`;
      const [document] = await tx.insert(documentsTable).values({
        number,
        kind: input.kind,
        workplaceId: input.workplaceId ?? null,
        warehouseId: input.warehouseId ?? null,
        accountId: input.accountId,
        documentDate: input.documentDate.toISOString().slice(0, 10),
        validUntil: input.validUntil ? input.validUntil.toISOString().slice(0, 10) : null,
        currency: input.currency,
        paymentType: input.paymentType ?? null,
        status: input.status ?? "draft",
        discount: input.discount,
        tax: input.tax + taxTotal,
        total,
        paidAmount: input.paidAmount,
        notes: input.notes,
      }).returning();
      await tx.insert(documentLinesTable).values(input.lines.map((line) => ({
        documentId: document.id,
        itemId: line.itemId ?? null,
        warehouseId: line.warehouseId ?? input.warehouseId ?? null,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        tax: line.tax,
        lineTotal: Math.max(0, line.quantity * line.unitPrice - line.discount + line.tax),
      })));

      const shouldApplyStock = document.status === "completed" && ["sale_return", "sale_talaf"].includes(document.kind);
      if (shouldApplyStock) {
        for (const line of input.lines) {
          if (!line.itemId) continue;
          const sign = document.kind === "sale_return" ? 1 : -1;
          await tx.update(itemsTable).set({
            quantity: sql`${itemsTable.quantity} + ${sign * line.quantity}`,
          }).where(eq(itemsTable.id, line.itemId));
          const warehouseId = line.warehouseId ?? input.warehouseId;
          if (warehouseId) {
            await tx.insert(warehouseStockTable).values({
              warehouseId,
              itemId: line.itemId,
              quantity: sign * line.quantity,
            }).onConflictDoUpdate({
              target: [warehouseStockTable.warehouseId, warehouseStockTable.itemId],
              set: { quantity: sql`${warehouseStockTable.quantity} + ${sign * line.quantity}` },
            });
          }
        }
      }
      if (document.status === "completed" && input.paidAmount > 0 && ["purchase_payment", "sale_collection"].includes(document.kind)) {
        await tx.insert(paymentsTable).values({
          workplaceId: input.workplaceId ?? null,
          accountId: input.accountId,
          cashBoxId: null,
          direction: document.kind === "sale_collection" ? "received" : "paid",
          paymentDate: input.documentDate.toISOString().slice(0, 10),
          amount: input.paidAmount,
          currency: input.currency,
          paymentMethod: input.paymentType ?? "",
          referenceType: "business_document",
          referenceId: document.id,
          note: input.notes,
          status: "posted",
        });
        await tx.update(accountsTable).set({
          balance: document.kind === "sale_collection"
            ? sql`${accountsTable.balance} - ${input.paidAmount}`
            : sql`${accountsTable.balance} + ${input.paidAmount}`,
        }).where(eq(accountsTable.id, input.accountId));
      }
      return document;
    });
    res.status(201).json(CreateBusinessDocumentResponse.parse(await serializeDocument(created)));
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    res.status(code ? 400 : 500).json({
      error: code === "ACCOUNT_NOT_FOUND" ? "Account not found" : code === "ITEM_NOT_FOUND" ? "Item not found" : code === "PAID_AMOUNT_EXCEEDS_TOTAL" ? "Paid amount cannot exceed the document total" : "Could not create document",
    });
  }
});

router.get("/business-documents/:id", async (req, res): Promise<void> => {
  const params = GetBusinessDocumentParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [document] = await db.select().from(documentsTable).where(and(
    eq(documentsTable.id, params.data.id),
    isNull(documentsTable.deletedAt),
  ));
  if (!document) { res.status(404).json({ error: "Document not found" }); return; }
  res.json(GetBusinessDocumentResponse.parse(await serializeDocument(document)));
});

router.patch("/business-documents/:id", async (req, res): Promise<void> => {
  const params = UpdateBusinessDocumentParams.safeParse(req.params);
  const body = UpdateBusinessDocumentBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  const update = {
    ...(body.data.status !== undefined ? { status: body.data.status } : {}),
    ...(body.data.validUntil !== undefined ? { validUntil: body.data.validUntil ? body.data.validUntil.toISOString().slice(0, 10) : null } : {}),
    ...(body.data.notes !== undefined ? { notes: body.data.notes } : {}),
  };
  try {
    const updated = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(documentsTable).where(and(
        eq(documentsTable.id, params.data.id),
        isNull(documentsTable.deletedAt),
      ));
      if (!current) return null;
      const [next] = await tx.update(documentsTable).set(update)
        .where(eq(documentsTable.id, params.data.id))
        .returning();
      if (current.status !== "completed" && next.status === "completed") {
        const lines = await tx.select().from(documentLinesTable).where(eq(documentLinesTable.documentId, next.id));
        if (["sale_return", "sale_talaf"].includes(next.kind)) {
          const sign = next.kind === "sale_return" ? 1 : -1;
          for (const line of lines) {
            if (!line.itemId) continue;
            await tx.update(itemsTable).set({ quantity: sql`${itemsTable.quantity} + ${sign * line.quantity}` })
              .where(eq(itemsTable.id, line.itemId));
            if (line.warehouseId ?? next.warehouseId) {
              const warehouseId = line.warehouseId ?? next.warehouseId!;
              await tx.insert(warehouseStockTable).values({ warehouseId, itemId: line.itemId, quantity: sign * line.quantity })
                .onConflictDoUpdate({
                  target: [warehouseStockTable.warehouseId, warehouseStockTable.itemId],
                  set: { quantity: sql`${warehouseStockTable.quantity} + ${sign * line.quantity}` },
                });
            }
          }
        }
        if (next.paidAmount > 0 && ["purchase_payment", "sale_collection"].includes(next.kind)) {
          await tx.insert(paymentsTable).values({
            workplaceId: next.workplaceId,
            accountId: next.accountId,
            cashBoxId: null,
            direction: next.kind === "sale_collection" ? "received" : "paid",
            paymentDate: next.documentDate,
            amount: next.paidAmount,
            currency: next.currency,
            paymentMethod: next.paymentType ?? "",
            referenceType: "business_document",
            referenceId: next.id,
            note: next.notes,
            status: "posted",
          });
          await tx.update(accountsTable).set({
            balance: next.kind === "sale_collection"
              ? sql`${accountsTable.balance} - ${next.paidAmount}`
              : sql`${accountsTable.balance} + ${next.paidAmount}`,
          }).where(eq(accountsTable.id, next.accountId));
        }
      }
      return next;
    });
    if (!updated) { res.status(404).json({ error: "Document not found" }); return; }
    res.json(UpdateBusinessDocumentResponse.parse(await serializeDocument(updated)));
  } catch {
    res.status(500).json({ error: "Could not update document" });
  }
});

router.delete("/business-documents/:id", async (req, res): Promise<void> => {
  const params = DeleteBusinessDocumentParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(documentsTable)
    .set({ deletedAt: new Date(), status: "cancelled" })
    .where(and(eq(documentsTable.id, params.data.id), isNull(documentsTable.deletedAt)))
    .returning({ id: documentsTable.id });
  if (!deleted) { res.status(404).json({ error: "Document not found" }); return; }
  res.sendStatus(204);
});

export default router;