import { Router, type IRouter } from "express";
import { and, eq, ilike, isNull, lte, or } from "drizzle-orm";
import { db, itemsTable } from "@workspace/db";
import {
  CreateItemBody,
  CreateItemResponse,
  DeleteItemParams,
  ListItemsQueryParams,
  ListItemsResponse,
  ListLowStockResponse,
  UpdateItemBody,
  UpdateItemParams,
  UpdateItemResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeItem = (row: typeof itemsTable.$inferSelect) => ({
  id: row.id,
  name: row.name,
  barcode: row.barcode,
  category: row.category,
  brand: row.brand,
  quantity: row.quantity,
  reorderLevel: row.reorderLevel,
  purchasePrice: row.purchasePrice,
  salePrice: row.salePrice,
  unit: row.unit,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});

router.get("/items", async (req, res): Promise<void> => {
  const parsed = ListItemsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filters = [isNull(itemsTable.deletedAt)];
  if (parsed.data.search) {
    const term = `%${parsed.data.search.trim()}%`;
    filters.push(
      or(
        ilike(itemsTable.name, term),
        ilike(itemsTable.barcode, term),
        ilike(itemsTable.category, term),
        ilike(itemsTable.brand, term),
      )!,
    );
  }
  if (parsed.data.lowStock) {
    filters.push(lte(itemsTable.quantity, itemsTable.reorderLevel));
  }

  const rows = await db
    .select()
    .from(itemsTable)
    .where(and(...filters))
    .orderBy(itemsTable.name);

  res.json(ListItemsResponse.parse(rows.map(serializeItem)));
});

router.get("/inventory/low-stock", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(itemsTable)
    .where(
      and(
        isNull(itemsTable.deletedAt),
        eq(itemsTable.status, "active"),
        lte(itemsTable.quantity, itemsTable.reorderLevel),
      ),
    )
    .orderBy(itemsTable.quantity);

  res.json(ListLowStockResponse.parse(rows.map(serializeItem)));
});

router.post("/items", async (req, res): Promise<void> => {
  const parsed = CreateItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(itemsTable)
    .values({ ...parsed.data, status: "active" })
    .returning();

  res.status(201).json(CreateItemResponse.parse(serializeItem(created)));
});

router.patch("/items/:id", async (req, res): Promise<void> => {
  const params = UpdateItemParams.safeParse(req.params);
  const body = UpdateItemBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(itemsTable)
    .set(body.data)
    .where(and(eq(itemsTable.id, params.data.id), isNull(itemsTable.deletedAt)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.json(UpdateItemResponse.parse(serializeItem(updated)));
});

router.delete("/items/:id", async (req, res): Promise<void> => {
  const params = DeleteItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .update(itemsTable)
    .set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(itemsTable.id, params.data.id), isNull(itemsTable.deletedAt)))
    .returning({ id: itemsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;