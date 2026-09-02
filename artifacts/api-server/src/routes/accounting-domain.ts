import { Router, type IRouter } from "express";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import {
  accountsTable,
  accountCategoriesTable,
  cashBoxesTable,
  db,
  openingDebtsTable,
} from "@workspace/db";
import { paymentsTable } from "@workspace/db";
import {
  CreateAccountCategoryBody,
  CreateAccountCategoryResponse,
  CreateCashBoxBody,
  CreateCashBoxResponse,
  CreateOpeningDebtBody,
  CreateOpeningDebtResponse,
  CreatePaymentBody,
  CreatePaymentResponse,
  ListAccountCategoriesResponse,
  ListCashBoxesQueryParams,
  ListCashBoxesResponse,
  ListOpeningDebtsQueryParams,
  ListOpeningDebtsResponse,
  ListPaymentsQueryParams,
  ListPaymentsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
type Response = Parameters<Parameters<IRouter["get"]>[1]>[1];
const invalid = (res: Response, message: string) => res.status(400).json({ error: message });
const dbDate = (value: Date) => value.toISOString().slice(0, 10);

const persistenceError = (res: Response, error: unknown) => {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  res.status(code === "23503" ? 400 : code === "23505" ? 409 : 500).json({
    error: code === "23503" ? "A referenced record does not exist" : code === "23505" ? "A duplicate record already exists" : "Could not persist accounting record",
  });
};

router.get("/account-categories", async (_req, res): Promise<void> => {
  const rows = await db.select().from(accountCategoriesTable)
    .where(isNull(accountCategoriesTable.deletedAt))
    .orderBy(asc(accountCategoriesTable.name));
  res.json(ListAccountCategoriesResponse.parse(rows));
});

router.post("/account-categories", async (req, res): Promise<void> => {
  const body = CreateAccountCategoryBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(accountCategoriesTable).values(body.data).returning();
    res.status(201).json(CreateAccountCategoryResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/cash-boxes", async (req, res): Promise<void> => {
  const query = ListCashBoxesQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const rows = await db.select().from(cashBoxesTable).where(and(
    isNull(cashBoxesTable.deletedAt),
    ...(query.data.workplaceId ? [eq(cashBoxesTable.workplaceId, query.data.workplaceId)] : []),
  )).orderBy(asc(cashBoxesTable.name));
  res.json(ListCashBoxesResponse.parse(rows));
});

router.post("/cash-boxes", async (req, res): Promise<void> => {
  const body = CreateCashBoxBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(cashBoxesTable).values(body.data).returning();
    res.status(201).json(CreateCashBoxResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/opening-debts", async (req, res): Promise<void> => {
  const query = ListOpeningDebtsQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const rows = await db.select().from(openingDebtsTable).where(and(
    ...(query.data.accountId ? [eq(openingDebtsTable.accountId, query.data.accountId)] : []),
  )).orderBy(desc(openingDebtsTable.debtDate), desc(openingDebtsTable.id));
  res.json(ListOpeningDebtsResponse.parse(rows));
});

router.post("/opening-debts", async (req, res): Promise<void> => {
  const body = CreateOpeningDebtBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const [created] = await db.insert(openingDebtsTable).values({
      ...body.data,
      debtDate: dbDate(body.data.debtDate),
    }).returning();
    res.status(201).json(CreateOpeningDebtResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

router.get("/payments", async (req, res): Promise<void> => {
  const query = ListPaymentsQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const rows = await db.select().from(paymentsTable).where(and(
    isNull(paymentsTable.deletedAt),
    ...(query.data.accountId ? [eq(paymentsTable.accountId, query.data.accountId)] : []),
    ...(query.data.cashBoxId ? [eq(paymentsTable.cashBoxId, query.data.cashBoxId)] : []),
  )).orderBy(desc(paymentsTable.paymentDate), desc(paymentsTable.id));
  res.json(ListPaymentsResponse.parse(rows));
});

router.post("/payments", async (req, res): Promise<void> => {
  const body = CreatePaymentBody.safeParse(req.body);
  if (!body.success) { invalid(res, body.error.message); return; }
  try {
    const created = await db.transaction(async (tx) => {
      const [account] = await tx.select().from(accountsTable).where(eq(accountsTable.id, body.data.accountId));
      if (!account) throw Object.assign(new Error("ACCOUNT_NOT_FOUND"), { code: "23503" });
      const [payment] = await tx.insert(paymentsTable).values({
        ...body.data,
        paymentDate: dbDate(body.data.paymentDate),
        status: body.data.status ?? "posted",
      }).returning();
      await tx.update(accountsTable).set({
        balance: body.data.direction === "received"
          ? sql`${accountsTable.balance} - ${body.data.amount}`
          : sql`${accountsTable.balance} + ${body.data.amount}`,
      }).where(eq(accountsTable.id, body.data.accountId));
      return payment;
    });
    res.status(201).json(CreatePaymentResponse.parse(created));
  } catch (error) { persistenceError(res, error); }
});

export default router;