import { Router, type IRouter } from "express";
import { and, eq, ilike, isNull, or } from "drizzle-orm";
import { accountsTable, db } from "@workspace/db";
import {
  CreateAccountBody,
  CreateAccountResponse,
  DeleteAccountParams,
  ListAccountsQueryParams,
  ListAccountsResponse,
  UpdateAccountBody,
  UpdateAccountParams,
  UpdateAccountResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeAccount = (row: typeof accountsTable.$inferSelect) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  phone: row.phone,
  city: row.city,
  balance: row.balance,
  currency: row.currency,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
});

router.get("/accounts", async (req, res): Promise<void> => {
  const parsed = ListAccountsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const filters = [isNull(accountsTable.deletedAt)];
  if (parsed.data.type) {
    filters.push(eq(accountsTable.type, parsed.data.type));
  }
  if (parsed.data.search) {
    const term = `%${parsed.data.search.trim()}%`;
    filters.push(
      or(
        ilike(accountsTable.name, term),
        ilike(accountsTable.phone, term),
        ilike(accountsTable.city, term),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(accountsTable)
    .where(and(...filters))
    .orderBy(accountsTable.name);

  res.json(ListAccountsResponse.parse(rows.map(serializeAccount)));
});

router.post("/accounts", async (req, res): Promise<void> => {
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(accountsTable)
    .values({ ...parsed.data, status: "active" })
    .returning();

  res.status(201).json(CreateAccountResponse.parse(serializeAccount(created)));
});

router.patch("/accounts/:id", async (req, res): Promise<void> => {
  const params = UpdateAccountParams.safeParse(req.params);
  const body = UpdateAccountBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(accountsTable)
    .set(body.data)
    .where(and(eq(accountsTable.id, params.data.id), isNull(accountsTable.deletedAt)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.json(UpdateAccountResponse.parse(serializeAccount(updated)));
});

router.delete("/accounts/:id", async (req, res): Promise<void> => {
  const params = DeleteAccountParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .update(accountsTable)
    .set({ deletedAt: new Date(), status: "inactive" })
    .where(and(eq(accountsTable.id, params.data.id), isNull(accountsTable.deletedAt)))
    .returning({ id: accountsTable.id });

  if (!deleted) {
    res.status(404).json({ error: "Account not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;