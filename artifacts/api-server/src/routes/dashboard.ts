import { Router, type IRouter } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import {
  accountsTable,
  db,
  invoiceLinesTable,
  invoicesTable,
  itemsTable,
  transactionsTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  ListActivityQueryParams,
  ListActivityResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [accounts, items, invoices, lines] = await Promise.all([
    db.select().from(accountsTable).where(isNull(accountsTable.deletedAt)),
    db.select().from(itemsTable).where(isNull(itemsTable.deletedAt)),
    db.select().from(invoicesTable),
    db.select().from(invoiceLinesTable),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const salesToday = invoices
    .filter((invoice) => invoice.type === "sale" && invoice.date === today)
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const purchasesToday = invoices
    .filter((invoice) => invoice.type === "purchase" && invoice.date === today)
    .reduce((sum, invoice) => sum + invoice.total, 0);

  const monthKeys = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));
    return date.toISOString().slice(0, 7);
  });
  const monthLabels = ["کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران", "تەمموز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم"];
  const revenueSeries = monthKeys.map((key) => {
    const monthInvoices = invoices.filter((invoice) =>
      invoice.date.startsWith(key),
    );
    return {
      label: monthLabels[Number(key.slice(5, 7)) - 1],
      sales: monthInvoices
        .filter((invoice) => invoice.type === "sale")
        .reduce((sum, invoice) => sum + invoice.total, 0),
      purchases: monthInvoices
        .filter((invoice) => invoice.type === "purchase")
        .reduce((sum, invoice) => sum + invoice.total, 0),
    };
  });

  const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const itemMap = new Map(items.map((item) => [item.id, item]));
  const itemTotals = new Map<number, { quantity: number; revenue: number }>();
  for (const line of lines) {
    if (invoiceMap.get(line.invoiceId)?.type !== "sale") continue;
    const current = itemTotals.get(line.itemId) ?? { quantity: 0, revenue: 0 };
    current.quantity += line.quantity;
    current.revenue += line.lineTotal;
    itemTotals.set(line.itemId, current);
  }
  const topItems = [...itemTotals.entries()]
    .map(([itemId, totals]) => ({
      name: itemMap.get(itemId)?.name ?? "—",
      ...totals,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const summary = {
    salesToday,
    purchasesToday,
    receivables: accounts
      .filter((account) => account.balance > 0)
      .reduce((sum, account) => sum + account.balance, 0),
    payables: Math.abs(
      accounts
        .filter((account) => account.balance < 0)
        .reduce((sum, account) => sum + account.balance, 0),
    ),
    itemsCount: items.length,
    lowStockCount: items.filter(
      (item) => item.quantity <= item.reorderLevel,
    ).length,
    customersCount: accounts.filter((account) => account.type === "customer")
      .length,
    revenueSeries,
    topItems,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

router.get("/activity", async (req, res): Promise<void> => {
  const parsed = ListActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 8;
  const [invoices, transactions] = await Promise.all([
    db
      .select({
        id: invoicesTable.id,
        type: invoicesTable.type,
        number: invoicesTable.number,
        amount: invoicesTable.total,
        currency: invoicesTable.currency,
        createdAt: invoicesTable.createdAt,
        accountName: accountsTable.name,
      })
      .from(invoicesTable)
      .innerJoin(accountsTable, eq(invoicesTable.accountId, accountsTable.id))
      .orderBy(desc(invoicesTable.createdAt))
      .limit(limit),
    db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(limit),
  ]);

  const activity = [
    ...invoices.map((invoice) => ({
      id: invoice.id * 10,
      kind: invoice.type,
      title:
        invoice.type === "sale" ? "پسووڵەی فرۆشتن" : "پسووڵەی کڕین",
      description: `${invoice.number} · ${invoice.accountName}`,
      amount: invoice.amount,
      currency: invoice.currency,
      createdAt: invoice.createdAt.toISOString(),
    })),
    ...transactions.map((transaction) => ({
      id: transaction.id * 10 + 1,
      kind: transaction.type,
      title: transaction.type === "income" ? "داهاتی نوێ" : "خەرجی نوێ",
      description: transaction.description,
      amount: transaction.amount,
      currency: transaction.currency,
      createdAt: transaction.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);

  res.json(ListActivityResponse.parse(activity));
});

export default router;