import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  CreateTransactionResponse,
  ListTransactionsQueryParams,
  ListTransactionsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const serializeTransaction = (row: typeof transactionsTable.$inferSelect) => ({
  id: row.id,
  type: row.type,
  date: row.date,
  category: row.category,
  description: row.description,
  accountName: row.accountName,
  amount: row.amount,
  currency: row.currency,
  status: row.status,
});

router.get("/transactions", async (req, res): Promise<void> => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = parsed.data.type
    ? await db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.type, parsed.data.type))
        .orderBy(transactionsTable.date)
    : await db.select().from(transactionsTable).orderBy(transactionsTable.date);

  res.json(
    ListTransactionsResponse.parse(rows.reverse().map(serializeTransaction)),
  );
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(transactionsTable)
    .values({
      ...parsed.data,
      date: parsed.data.date.toISOString().slice(0, 10),
      status: "posted",
    })
    .returning();

  res
    .status(201)
    .json(CreateTransactionResponse.parse(serializeTransaction(created)));
});

export default router;