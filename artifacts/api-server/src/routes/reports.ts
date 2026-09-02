import { Router, type IRouter } from "express";
import { and, asc, eq, gte, isNull, lte } from "drizzle-orm";
import {
  accountsTable,
  db,
  financialEntriesTable,
  paymentsTable,
  warehouseStockTable,
} from "@workspace/db";
import {
  GetCashboxTransactionsReportQueryParams,
  GetCashboxTransactionsReportResponse,
  GetDebtReportResponse,
  GetInventoryBalanceReportQueryParams,
  GetInventoryBalanceReportResponse,
  GetProfitLossReportQueryParams,
  GetProfitLossReportResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
type Response = Parameters<Parameters<IRouter["get"]>[1]>[1];
const invalid = (res: Response, message: string) => res.status(400).json({ error: message });
const dbDate = (value: Date) => value.toISOString().slice(0, 10);

router.get("/reports/inventory-balance", async (req, res): Promise<void> => {
  const query = GetInventoryBalanceReportQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [];
  if (query.data.warehouseId) filters.push(eq(warehouseStockTable.warehouseId, query.data.warehouseId));
  if (query.data.itemId) filters.push(eq(warehouseStockTable.itemId, query.data.itemId));
  const rows = await db.select().from(warehouseStockTable)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(warehouseStockTable.warehouseId), asc(warehouseStockTable.itemId));
  res.json(GetInventoryBalanceReportResponse.parse(rows.map((row) => ({
    ...row,
    isLowStock: row.quantity <= row.reorderLevel,
  }))));
});

router.get("/reports/cashbox-transactions", async (req, res): Promise<void> => {
  const query = GetCashboxTransactionsReportQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const financialFilters = [isNull(financialEntriesTable.deletedAt)];
  const paymentFilters = [isNull(paymentsTable.deletedAt)];
  if (query.data.cashBoxId) {
    financialFilters.push(eq(financialEntriesTable.cashBoxId, query.data.cashBoxId));
    paymentFilters.push(eq(paymentsTable.cashBoxId, query.data.cashBoxId));
  }
  if (query.data.from) {
    const date = dbDate(query.data.from);
    financialFilters.push(gte(financialEntriesTable.entryDate, date));
    paymentFilters.push(gte(paymentsTable.paymentDate, date));
  }
  if (query.data.to) {
    const date = dbDate(query.data.to);
    financialFilters.push(lte(financialEntriesTable.entryDate, date));
    paymentFilters.push(lte(paymentsTable.paymentDate, date));
  }
  const [entries, payments] = await Promise.all([
    db.select().from(financialEntriesTable).where(and(...financialFilters)),
    db.select().from(paymentsTable).where(and(...paymentFilters)),
  ]);
  const rows = [
    ...entries.map((entry) => ({
      id: entry.id,
      source: "financial_entry" as const,
      date: entry.entryDate,
      amount: entry.amount,
      currency: entry.currency,
      description: entry.description || entry.category,
      direction: entry.type === "income" ? "received" : entry.type === "expense" ? "paid" : null,
      status: entry.status,
    })),
    ...payments.map((payment) => ({
      id: payment.id,
      source: "payment" as const,
      date: payment.paymentDate,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.note,
      direction: payment.direction,
      status: payment.status,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  res.json(GetCashboxTransactionsReportResponse.parse(rows));
});

router.get("/reports/profit-loss", async (req, res): Promise<void> => {
  const query = GetProfitLossReportQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(financialEntriesTable.deletedAt)];
  if (query.data.from) filters.push(gte(financialEntriesTable.entryDate, dbDate(query.data.from)));
  if (query.data.to) filters.push(lte(financialEntriesTable.entryDate, dbDate(query.data.to)));
  const entries = await db.select().from(financialEntriesTable).where(and(...filters));
  const currency = entries[0]?.currency ?? "IQD";
  const income = entries.filter((entry) => entry.type === "income" && entry.currency === currency)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const expense = entries.filter((entry) => entry.type === "expense" && entry.currency === currency)
    .reduce((sum, entry) => sum + entry.amount, 0);
  res.json(GetProfitLossReportResponse.parse({ income, expense, profit: income - expense, currency }));
});

router.get("/reports/debt", async (_req, res): Promise<void> => {
  const rows = await db.select({
    accountId: accountsTable.id,
    accountName: accountsTable.name,
    accountType: accountsTable.type,
    balance: accountsTable.balance,
    currency: accountsTable.currency,
  }).from(accountsTable)
    .where(isNull(accountsTable.deletedAt))
    .orderBy(asc(accountsTable.name));
  res.json(GetDebtReportResponse.parse(rows));
});

export default router;