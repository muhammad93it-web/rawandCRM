import { Router, type IRouter } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db, financialEntriesTable } from "@workspace/db";
import {
  CreateFinancialEntryBody,
  CreateFinancialEntryResponse,
  DeleteFinancialEntryParams,
  GetFinancialEntryParams,
  GetFinancialEntryResponse,
  ListFinancialEntriesQueryParams,
  ListFinancialEntriesResponse,
  UpdateFinancialEntryBody,
  UpdateFinancialEntryParams,
  UpdateFinancialEntryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const invalid = (res: Parameters<Parameters<IRouter["get"]>[1]>[1], message: string) => {
  res.status(400).json({ error: message });
};

const persistenceError = (res: Parameters<Parameters<IRouter["get"]>[1]>[1], error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  res.status(code === "23503" ? 400 : 500).json({
    error: code === "23503" ? "A referenced record does not exist" : "Could not persist financial entry",
  });
};

const toDbDates = <T extends { entryDate?: Date | null; dueDate?: Date | null }>(value: T) => ({
  ...value,
  ...(value.entryDate !== undefined
    ? { entryDate: value.entryDate ? value.entryDate.toISOString().slice(0, 10) : null }
    : {}),
  ...(value.dueDate !== undefined
    ? { dueDate: value.dueDate ? value.dueDate.toISOString().slice(0, 10) : null }
    : {}),
});

router.get("/financial-entries", async (req, res): Promise<void> => {
  const query = ListFinancialEntriesQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(financialEntriesTable.deletedAt)];
  if (query.data.type) filters.push(eq(financialEntriesTable.type, query.data.type));
  if (query.data.workplaceId) filters.push(eq(financialEntriesTable.workplaceId, query.data.workplaceId));
  const rows = await db.select().from(financialEntriesTable)
    .where(and(...filters))
    .orderBy(desc(financialEntriesTable.entryDate), desc(financialEntriesTable.id));
  res.json(ListFinancialEntriesResponse.parse(rows));
});

router.post("/financial-entries", async (req, res): Promise<void> => {
  const body = CreateFinancialEntryBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(financialEntriesTable)
      .values(toDbDates(body.data))
      .returning();
    res.status(201).json(CreateFinancialEntryResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/financial-entries/:id", async (req, res): Promise<void> => {
  const params = GetFinancialEntryParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [row] = await db.select().from(financialEntriesTable).where(and(
    eq(financialEntriesTable.id, params.data.id),
    isNull(financialEntriesTable.deletedAt),
  ));
  if (!row) { res.status(404).json({ error: "Financial entry not found" }); return; }
  res.json(GetFinancialEntryResponse.parse(row));
});

router.patch("/financial-entries/:id", async (req, res): Promise<void> => {
  const params = UpdateFinancialEntryParams.safeParse(req.params);
  const body = UpdateFinancialEntryBody.safeParse(req.body);
  if (!params.success) { invalid(res, params.error.message); return; }
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [updated] = await db.update(financialEntriesTable)
      .set(toDbDates(body.data))
      .where(and(
        eq(financialEntriesTable.id, params.data.id),
        isNull(financialEntriesTable.deletedAt),
      ))
      .returning();
    if (!updated) { res.status(404).json({ error: "Financial entry not found" }); return; }
    res.json(UpdateFinancialEntryResponse.parse(updated));
  } catch (error) { persistenceError(res, error); }
});

router.delete("/financial-entries/:id", async (req, res): Promise<void> => {
  const params = DeleteFinancialEntryParams.safeParse(req.params);
  if (!params.success) { invalid(res, params.error.message); return; }
  const [deleted] = await db.update(financialEntriesTable)
    .set({ deletedAt: new Date(), status: "cancelled" })
    .where(and(
      eq(financialEntriesTable.id, params.data.id),
      isNull(financialEntriesTable.deletedAt),
    ))
    .returning({ id: financialEntriesTable.id });
  if (!deleted) { res.status(404).json({ error: "Financial entry not found" }); return; }
  res.sendStatus(204);
});

export default router;