import { Router, type IRouter } from "express";
import { and, asc, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, or } from "drizzle-orm";
import {
  accountsTable,
  db,
  employeesTable,
  financialEntriesTable,
  invoiceLinesTable,
  invoicesTable,
  itemsTable,
  paymentsTable,
  transactionsTable,
  usersTable,
  warehousesTable,
  warehouseStockTable,
} from "@workspace/db";
import {
  GetAccountLastActivityReportQueryParams,
  GetAccountLastActivityReportResponse,
  GetAccountsReportQueryParams,
  GetAccountsReportResponse,
  GetCashboxReportQueryParams,
  GetCashboxReportResponse,
  GetCashboxTransactionsReportQueryParams,
  GetCashboxTransactionsReportResponse,
  GetDebtReportResponse,
  GetDebtsReportQueryParams,
  GetDebtsReportResponse,
  GetExpensesReportQueryParams,
  GetExpensesReportResponse,
  GetInventoryBalanceReportQueryParams,
  GetInventoryBalanceReportResponse,
  GetOverdueDebtsReportQueryParams,
  GetOverdueDebtsReportResponse,
  GetProfitLossReportQueryParams,
  GetProfitLossReportResponse,
  GetProfitReportQueryParams,
  GetProfitReportResponse,
  GetPurchasesReportQueryParams,
  GetPurchasesReportResponse,
  GetSalesReportQueryParams,
  GetSalesReportResponse,
  GetStockReportQueryParams,
  GetStockReportResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
type Response = Parameters<Parameters<IRouter["get"]>[1]>[1];

const invalid = (res: Response, message: string) =>
  res.status(400).json({ error: message });
const dbDate = (value: Date) => value.toISOString().slice(0, 10);
const queryWithDates = (query: Record<string, unknown>) => {
  const result = { ...query };
  for (const key of ["from", "to", "asOf"]) {
    if (typeof result[key] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(result[key])) {
      const input = result[key];
      const parsed = new Date(`${input}T00:00:00.000Z`);
      if (dbDate(parsed) === input) result[key] = parsed;
    }
  }
  return result;
};
const queryWithBoolean = (query: Record<string, unknown>, key: string) => {
  const result = { ...query };
  if (result[key] === "true") result[key] = true;
  if (result[key] === "false") result[key] = false;
  return result;
};
const invalidDateRange = (from?: Date, to?: Date) =>
  from !== undefined && to !== undefined && from > to;
const dateOnlyResponse = <T>(schema: { parse: (value: unknown) => T }, value: unknown): T => {
  const normalize = (item: unknown, key?: string): unknown => {
    if (item instanceof Date) return key?.endsWith("At") ? item.toISOString() : dbDate(item);
    if (Array.isArray(item)) return item.map((child) => normalize(child));
    if (item !== null && typeof item === "object") {
      return Object.fromEntries(Object.entries(item).map(([childKey, child]) => [childKey, normalize(child, childKey)]));
    }
    return item;
  };
  return normalize(schema.parse(value)) as T;
};

const invoiceReport = async (
  type: "sale" | "purchase",
  query: {
    from?: Date;
    to?: Date;
    accountId?: number;
    workplaceId?: number;
    warehouseId?: number;
    status?: string;
    currency?: string;
  },
) => {
  const filters = [isNull(invoicesTable.deletedAt), eq(invoicesTable.type, type)];
  if (query.from) filters.push(gte(invoicesTable.date, dbDate(query.from)));
  if (query.to) filters.push(lte(invoicesTable.date, dbDate(query.to)));
  if (query.accountId) filters.push(eq(invoicesTable.accountId, query.accountId));
  if (query.workplaceId) filters.push(eq(invoicesTable.workplaceId, query.workplaceId));
  if (query.warehouseId) filters.push(eq(invoicesTable.warehouseId, query.warehouseId));
  if (query.status) filters.push(eq(invoicesTable.status, query.status));
  if (query.currency) filters.push(eq(invoicesTable.currency, query.currency));

  const invoices = await db
    .select({
      id: invoicesTable.id,
      number: invoicesTable.number,
      date: invoicesTable.date,
      accountId: invoicesTable.accountId,
      accountName: accountsTable.name,
      workplaceId: invoicesTable.workplaceId,
      warehouseId: invoicesTable.warehouseId,
      createdByUserId: invoicesTable.createdByUserId,
      createdByUserName: usersTable.displayName,
      total: invoicesTable.total,
      paidAmount: invoicesTable.paidAmount,
      currency: invoicesTable.currency,
      paymentType: invoicesTable.paymentType,
      status: invoicesTable.status,
    })
    .from(invoicesTable)
    .innerJoin(accountsTable, eq(invoicesTable.accountId, accountsTable.id))
    .leftJoin(usersTable, eq(invoicesTable.createdByUserId, usersTable.id))
    .where(and(...filters))
    .orderBy(desc(invoicesTable.date), desc(invoicesTable.id));
  if (invoices.length === 0) return [];
  const creatorIds = invoices.flatMap((invoice) => invoice.createdByUserId === null ? [] : [invoice.createdByUserId]);
  const [lines, employees] = await Promise.all([db.select({
    id: invoiceLinesTable.id,
    invoiceId: invoiceLinesTable.invoiceId,
    itemId: invoiceLinesTable.itemId,
    itemName: itemsTable.name,
    barcode: itemsTable.barcode,
    unit: itemsTable.unit,
    warehouseId: invoiceLinesTable.warehouseId,
    quantity: invoiceLinesTable.quantity,
    unitPrice: invoiceLinesTable.unitPrice,
    discount: invoiceLinesTable.discount,
    lineTotal: invoiceLinesTable.lineTotal,
  }).from(invoiceLinesTable)
    .leftJoin(itemsTable, eq(invoiceLinesTable.itemId, itemsTable.id))
    .where(and(isNull(invoiceLinesTable.deletedAt), inArray(invoiceLinesTable.invoiceId, invoices.map((invoice) => invoice.id)))),
  creatorIds.length === 0
    ? Promise.resolve([])
    : db.select({
      id: employeesTable.id,
      userId: employeesTable.userId,
      name: employeesTable.name,
    }).from(employeesTable)
      .where(inArray(employeesTable.userId, creatorIds))
      .orderBy(asc(employeesTable.id)),
  ]);
  const linesByInvoice = new Map<number, typeof lines>();
  for (const line of lines) {
    const group = linesByInvoice.get(line.invoiceId) ?? [];
    group.push(line);
    linesByInvoice.set(line.invoiceId, group);
  }
  const employeeByUser = new Map<number, (typeof employees)[number]>();
  for (const employee of employees) {
    if (employee.userId !== null && !employeeByUser.has(employee.userId)) employeeByUser.set(employee.userId, employee);
  }
  return invoices.map((invoice) => ({
    ...invoice,
    employeeId: invoice.createdByUserId === null ? null : employeeByUser.get(invoice.createdByUserId)?.id ?? null,
    employeeName: invoice.createdByUserId === null ? null : employeeByUser.get(invoice.createdByUserId)?.name ?? null,
    outstandingAmount: Math.max(0, invoice.total - invoice.paidAmount),
    lines: (linesByInvoice.get(invoice.id) ?? []).map(({ invoiceId: _invoiceId, ...line }) => line),
  }));
};

router.get("/reports/sales", async (req, res): Promise<void> => {
  const query = GetSalesReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (invalidDateRange(query.data.from, query.data.to)) { invalid(res, "'from' must not be after 'to'"); return; }
  res.json(dateOnlyResponse(GetSalesReportResponse, await invoiceReport("sale", query.data)));
});

router.get("/reports/purchases", async (req, res): Promise<void> => {
  const query = GetPurchasesReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (invalidDateRange(query.data.from, query.data.to)) { invalid(res, "'from' must not be after 'to'"); return; }
  res.json(dateOnlyResponse(GetPurchasesReportResponse, await invoiceReport("purchase", query.data)));
});

router.get("/reports/stock", async (req, res): Promise<void> => {
  const query = GetStockReportQueryParams.safeParse(queryWithBoolean(req.query, "lowStock"));
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(itemsTable.deletedAt), isNull(warehousesTable.deletedAt)];
  if (query.data.warehouseId) filters.push(eq(warehouseStockTable.warehouseId, query.data.warehouseId));
  if (query.data.itemId) filters.push(eq(warehouseStockTable.itemId, query.data.itemId));
  const rows = await db
    .select({
      warehouseId: warehouseStockTable.warehouseId,
      warehouseName: warehousesTable.name,
      itemId: warehouseStockTable.itemId,
      itemName: itemsTable.name,
      barcode: itemsTable.barcode,
      quantity: warehouseStockTable.quantity,
      reorderLevel: warehouseStockTable.reorderLevel,
      purchasePrice: itemsTable.purchasePrice,
      unit: itemsTable.unit,
    })
    .from(warehouseStockTable)
    .innerJoin(warehousesTable, eq(warehouseStockTable.warehouseId, warehousesTable.id))
    .innerJoin(itemsTable, eq(warehouseStockTable.itemId, itemsTable.id))
    .where(and(...filters))
    .orderBy(asc(warehousesTable.name), asc(itemsTable.name));
  const result = rows
    .map((row) => ({
      ...row,
      stockValue: row.quantity * row.purchasePrice,
      isLowStock: row.quantity <= row.reorderLevel,
    }))
    .filter((row) => query.data.lowStock === undefined || row.isLowStock === query.data.lowStock);
  res.json(dateOnlyResponse(GetStockReportResponse, result));
});

router.get("/reports/inventory-balance", async (req, res): Promise<void> => {
  const query = GetInventoryBalanceReportQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(itemsTable.deletedAt), isNull(warehousesTable.deletedAt)];
  if (query.data.warehouseId) filters.push(eq(warehouseStockTable.warehouseId, query.data.warehouseId));
  if (query.data.itemId) filters.push(eq(warehouseStockTable.itemId, query.data.itemId));
  const rows = await db.select({
    warehouseId: warehouseStockTable.warehouseId,
    itemId: warehouseStockTable.itemId,
    quantity: warehouseStockTable.quantity,
    reorderLevel: warehouseStockTable.reorderLevel,
  }).from(warehouseStockTable)
    .innerJoin(warehousesTable, eq(warehouseStockTable.warehouseId, warehousesTable.id))
    .innerJoin(itemsTable, eq(warehouseStockTable.itemId, itemsTable.id))
    .where(and(...filters))
    .orderBy(asc(warehouseStockTable.warehouseId), asc(warehouseStockTable.itemId));
  res.json(dateOnlyResponse(GetInventoryBalanceReportResponse, rows.map((row) => ({
    ...row,
    isLowStock: row.quantity <= row.reorderLevel,
  }))));
});

router.get("/reports/accounts", async (req, res): Promise<void> => {
  const query = GetAccountsReportQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  const filters = [isNull(accountsTable.deletedAt)];
  if (query.data.search) filters.push(ilike(accountsTable.name, `%${query.data.search}%`));
  if (query.data.type) filters.push(eq(accountsTable.type, query.data.type));
  if (query.data.status) filters.push(eq(accountsTable.status, query.data.status));
  if (query.data.currency) filters.push(eq(accountsTable.currency, query.data.currency));
  const rows = await db.select({
    accountId: accountsTable.id,
    name: accountsTable.name,
    type: accountsTable.type,
    phone: accountsTable.phone,
    city: accountsTable.city,
    balance: accountsTable.balance,
    currency: accountsTable.currency,
    status: accountsTable.status,
  }).from(accountsTable).where(and(...filters)).orderBy(asc(accountsTable.name));
  res.json(dateOnlyResponse(GetAccountsReportResponse, rows));
});

router.get("/reports/account-last-activity", async (req, res): Promise<void> => {
  const query = GetAccountLastActivityReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (
    query.data.minDays !== undefined
    && query.data.maxDays !== undefined
    && query.data.minDays > query.data.maxDays
  ) {
    invalid(res, "'minDays' must not be greater than 'maxDays'");
    return;
  }
  const asOf = query.data.asOf ?? new Date();
  const asOfDate = dbDate(asOf);
  const accountFilters = [
    isNull(accountsTable.deletedAt),
    eq(accountsTable.type, "customer"),
  ];
  if (query.data.accountId) accountFilters.push(eq(accountsTable.id, query.data.accountId));
  if (query.data.search) {
    const pattern = `%${query.data.search}%`;
    accountFilters.push(or(
      ilike(accountsTable.name, pattern),
      ilike(accountsTable.phone, pattern),
      ilike(accountsTable.city, pattern),
    )!);
  }
  const accounts = await db.select({
    accountId: accountsTable.id,
    accountName: accountsTable.name,
    city: accountsTable.city,
    phone: accountsTable.phone,
  }).from(accountsTable)
    .where(and(...accountFilters))
    .orderBy(asc(accountsTable.name), asc(accountsTable.id));
  if (accounts.length === 0) {
    res.json(dateOnlyResponse(GetAccountLastActivityReportResponse, []));
    return;
  }
  const invoiceFilters = [
    isNull(invoicesTable.deletedAt),
    eq(invoicesTable.type, "sale"),
    lte(invoicesTable.date, asOfDate),
    inArray(invoicesTable.accountId, accounts.map((account) => account.accountId)),
  ];
  if (query.data.workplaceId) invoiceFilters.push(eq(invoicesTable.workplaceId, query.data.workplaceId));
  if (query.data.currency) invoiceFilters.push(eq(invoicesTable.currency, query.data.currency));
  const invoices = await db.select({
    accountId: invoicesTable.accountId,
    activityAt: invoicesTable.createdAt,
    activityDate: invoicesTable.date,
    number: invoicesTable.number,
    total: invoicesTable.total,
    currency: invoicesTable.currency,
    id: invoicesTable.id,
  }).from(invoicesTable)
    .where(and(...invoiceFilters))
    .orderBy(desc(invoicesTable.date), desc(invoicesTable.createdAt), desc(invoicesTable.id));
  const latestByAccount = new Map<number, (typeof invoices)[number]>();
  for (const invoice of invoices) {
    if (!latestByAccount.has(invoice.accountId)) latestByAccount.set(invoice.accountId, invoice);
  }
  const asOfUtc = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  const rows = accounts.flatMap((account) => {
    const invoice = latestByAccount.get(account.accountId);
    if (!invoice) return [];
    const daysSinceActivity = Math.max(
      0,
      Math.floor((asOfUtc - Date.parse(`${invoice.activityDate}T00:00:00.000Z`)) / 86_400_000),
    );
    if (query.data.minDays !== undefined && daysSinceActivity < query.data.minDays) return [];
    if (query.data.maxDays !== undefined && daysSinceActivity > query.data.maxDays) return [];
    return [{
      ...account,
      latestActivityAt: invoice.activityAt,
      latestActivityDate: invoice.activityDate,
      daysSinceActivity,
      latestInvoiceNumber: invoice.number,
      latestInvoiceTotal: invoice.total,
      latestInvoiceCurrency: invoice.currency,
    }];
  });
  res.json(dateOnlyResponse(GetAccountLastActivityReportResponse, rows));
});

const debtRows = async (query: { accountId?: number; accountType?: string; currency?: string } = {}) => {
  const filters = [isNull(accountsTable.deletedAt), ne(accountsTable.balance, 0)];
  if (query.accountId) filters.push(eq(accountsTable.id, query.accountId));
  if (query.accountType) filters.push(eq(accountsTable.type, query.accountType));
  if (query.currency) filters.push(eq(accountsTable.currency, query.currency));
  return db.select({
    accountId: accountsTable.id,
    accountName: accountsTable.name,
    accountType: accountsTable.type,
    balance: accountsTable.balance,
    currency: accountsTable.currency,
  }).from(accountsTable).where(and(...filters)).orderBy(asc(accountsTable.name));
};

router.get("/reports/debts", async (req, res): Promise<void> => {
  const query = GetDebtsReportQueryParams.safeParse(req.query);
  if (!query.success) { invalid(res, query.error.message); return; }
  res.json(dateOnlyResponse(GetDebtsReportResponse, await debtRows(query.data)));
});

router.get("/reports/debt", async (_req, res): Promise<void> => {
  res.json(dateOnlyResponse(GetDebtReportResponse, await debtRows()));
});

router.get("/reports/overdue-debts", async (req, res): Promise<void> => {
  const query = GetOverdueDebtsReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  const asOf = query.data.asOf ?? new Date();
  const asOfDate = dbDate(asOf);
  const filters = [
    isNull(financialEntriesTable.deletedAt),
    eq(financialEntriesTable.type, "debt"),
    isNotNull(financialEntriesTable.dueDate),
    lt(financialEntriesTable.dueDate, asOfDate),
    ne(financialEntriesTable.status, "settled"),
    ne(financialEntriesTable.status, "cancelled"),
  ];
  if (query.data.accountId) filters.push(eq(financialEntriesTable.accountId, query.data.accountId));
  if (query.data.workplaceId) filters.push(eq(financialEntriesTable.workplaceId, query.data.workplaceId));
  if (query.data.currency) filters.push(eq(financialEntriesTable.currency, query.data.currency));
  const rows = await db.select({
    id: financialEntriesTable.id,
    accountId: financialEntriesTable.accountId,
    accountName: accountsTable.name,
    entryDate: financialEntriesTable.entryDate,
    dueDate: financialEntriesTable.dueDate,
    amount: financialEntriesTable.amount,
    currency: financialEntriesTable.currency,
    description: financialEntriesTable.description,
    status: financialEntriesTable.status,
  }).from(financialEntriesTable)
    .leftJoin(accountsTable, eq(financialEntriesTable.accountId, accountsTable.id))
    .where(and(...filters))
    .orderBy(asc(financialEntriesTable.dueDate), asc(financialEntriesTable.id));
  const asOfUtc = Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate());
  res.json(dateOnlyResponse(GetOverdueDebtsReportResponse, rows.map((row) => ({
    ...row,
    dueDate: row.dueDate!,
    daysOverdue: Math.floor((asOfUtc - Date.parse(`${row.dueDate}T00:00:00.000Z`)) / 86_400_000),
  }))));
});

const cashboxRows = async (query: {
  cashBoxId?: number;
  from?: Date;
  to?: Date;
  workplaceId?: number;
  currency?: string;
}) => {
  const financialFilters = [
    isNull(financialEntriesTable.deletedAt),
    isNotNull(financialEntriesTable.cashBoxId),
    ne(financialEntriesTable.status, "cancelled"),
  ];
  const paymentFilters = [
    isNull(paymentsTable.deletedAt),
    isNotNull(paymentsTable.cashBoxId),
    ne(paymentsTable.status, "cancelled"),
  ];
  if (query.cashBoxId) {
    financialFilters.push(eq(financialEntriesTable.cashBoxId, query.cashBoxId));
    paymentFilters.push(eq(paymentsTable.cashBoxId, query.cashBoxId));
  }
  if (query.workplaceId) {
    financialFilters.push(eq(financialEntriesTable.workplaceId, query.workplaceId));
    paymentFilters.push(eq(paymentsTable.workplaceId, query.workplaceId));
  }
  if (query.currency) {
    financialFilters.push(eq(financialEntriesTable.currency, query.currency));
    paymentFilters.push(eq(paymentsTable.currency, query.currency));
  }
  if (query.from) {
    financialFilters.push(gte(financialEntriesTable.entryDate, dbDate(query.from)));
    paymentFilters.push(gte(paymentsTable.paymentDate, dbDate(query.from)));
  }
  if (query.to) {
    financialFilters.push(lte(financialEntriesTable.entryDate, dbDate(query.to)));
    paymentFilters.push(lte(paymentsTable.paymentDate, dbDate(query.to)));
  }
  const [entries, payments] = await Promise.all([
    db.select().from(financialEntriesTable).where(and(...financialFilters)),
    db.select().from(paymentsTable).where(and(...paymentFilters)),
  ]);
  return [
    ...entries.map((entry) => ({
      id: entry.id,
      source: "financial_entry" as const,
      date: entry.entryDate,
      workplaceId: entry.workplaceId,
      cashBoxId: entry.cashBoxId,
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
      workplaceId: payment.workplaceId,
      cashBoxId: payment.cashBoxId,
      amount: payment.amount,
      currency: payment.currency,
      description: payment.note,
      direction: payment.direction,
      status: payment.status,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
};

router.get("/reports/cashbox", async (req, res): Promise<void> => {
  const query = GetCashboxReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (invalidDateRange(query.data.from, query.data.to)) { invalid(res, "'from' must not be after 'to'"); return; }
  res.json(dateOnlyResponse(GetCashboxReportResponse, await cashboxRows(query.data)));
});

router.get("/reports/cashbox-transactions", async (req, res): Promise<void> => {
  const query = GetCashboxTransactionsReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (invalidDateRange(query.data.from, query.data.to)) { invalid(res, "'from' must not be after 'to'"); return; }
  res.json(dateOnlyResponse(GetCashboxTransactionsReportResponse, await cashboxRows(query.data)));
});

router.get("/reports/expenses", async (req, res): Promise<void> => {
  const query = GetExpensesReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (invalidDateRange(query.data.from, query.data.to)) { invalid(res, "'from' must not be after 'to'"); return; }
  const entryFilters = [
    isNull(financialEntriesTable.deletedAt),
    eq(financialEntriesTable.type, "expense"),
    ne(financialEntriesTable.status, "cancelled"),
  ];
  const transactionFilters = [isNull(transactionsTable.deletedAt), eq(transactionsTable.type, "expense"), ne(transactionsTable.status, "cancelled")];
  if (query.data.from) {
    entryFilters.push(gte(financialEntriesTable.entryDate, dbDate(query.data.from)));
    transactionFilters.push(gte(transactionsTable.date, dbDate(query.data.from)));
  }
  if (query.data.to) {
    entryFilters.push(lte(financialEntriesTable.entryDate, dbDate(query.data.to)));
    transactionFilters.push(lte(transactionsTable.date, dbDate(query.data.to)));
  }
  if (query.data.currency) {
    entryFilters.push(eq(financialEntriesTable.currency, query.data.currency));
    transactionFilters.push(eq(transactionsTable.currency, query.data.currency));
  }
  if (query.data.category) {
    entryFilters.push(eq(financialEntriesTable.category, query.data.category));
    transactionFilters.push(eq(transactionsTable.category, query.data.category));
  }
  if (query.data.accountId) entryFilters.push(eq(financialEntriesTable.accountId, query.data.accountId));
  if (query.data.workplaceId) entryFilters.push(eq(financialEntriesTable.workplaceId, query.data.workplaceId));
  const [entries, legacyTransactions] = await Promise.all([
    db.select({
      id: financialEntriesTable.id,
      date: financialEntriesTable.entryDate,
      workplaceId: financialEntriesTable.workplaceId,
      accountId: financialEntriesTable.accountId,
      accountName: accountsTable.name,
      cashBoxId: financialEntriesTable.cashBoxId,
      category: financialEntriesTable.category,
      description: financialEntriesTable.description,
      amount: financialEntriesTable.amount,
      currency: financialEntriesTable.currency,
      status: financialEntriesTable.status,
    }).from(financialEntriesTable)
      .leftJoin(accountsTable, eq(financialEntriesTable.accountId, accountsTable.id))
      .where(and(...entryFilters)),
    query.data.accountId || query.data.workplaceId
      ? Promise.resolve([])
      : db.select().from(transactionsTable).where(and(...transactionFilters)),
  ]);
  const rows = [
    ...entries.map((entry) => ({ ...entry, source: "financial_entry" as const })),
    ...legacyTransactions.map((entry) => ({
      id: entry.id,
      source: "transaction" as const,
      date: entry.date,
      workplaceId: null,
      accountId: null,
      accountName: entry.accountName || null,
      cashBoxId: null,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      currency: entry.currency,
      status: entry.status,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  res.json(dateOnlyResponse(GetExpensesReportResponse, rows));
});

const profitRows = async (query: { from?: Date; to?: Date; workplaceId?: number; currency?: string }) => {
  const entryFilters = [isNull(financialEntriesTable.deletedAt), ne(financialEntriesTable.status, "cancelled")];
  const invoiceFilters = [isNull(invoicesTable.deletedAt), eq(invoicesTable.status, "completed")];
  const transactionFilters = [isNull(transactionsTable.deletedAt), ne(transactionsTable.status, "cancelled")];
  if (query.from) {
    entryFilters.push(gte(financialEntriesTable.entryDate, dbDate(query.from)));
    invoiceFilters.push(gte(invoicesTable.date, dbDate(query.from)));
    transactionFilters.push(gte(transactionsTable.date, dbDate(query.from)));
  }
  if (query.to) {
    entryFilters.push(lte(financialEntriesTable.entryDate, dbDate(query.to)));
    invoiceFilters.push(lte(invoicesTable.date, dbDate(query.to)));
    transactionFilters.push(lte(transactionsTable.date, dbDate(query.to)));
  }
  if (query.workplaceId) {
    entryFilters.push(eq(financialEntriesTable.workplaceId, query.workplaceId));
    invoiceFilters.push(eq(invoicesTable.workplaceId, query.workplaceId));
  }
  if (query.currency) {
    entryFilters.push(eq(financialEntriesTable.currency, query.currency));
    invoiceFilters.push(eq(invoicesTable.currency, query.currency));
    transactionFilters.push(eq(transactionsTable.currency, query.currency));
  }
  const [entries, invoices, legacyTransactions] = await Promise.all([
    db.select().from(financialEntriesTable).where(and(...entryFilters)),
    db.select().from(invoicesTable).where(and(...invoiceFilters)),
    query.workplaceId ? Promise.resolve([]) : db.select().from(transactionsTable).where(and(...transactionFilters)),
  ]);
  const totals = new Map<string, { income: number; expense: number }>();
  const add = (currency: string, side: "income" | "expense", amount: number) => {
    const total = totals.get(currency) ?? { income: 0, expense: 0 };
    total[side] += amount;
    totals.set(currency, total);
  };
  for (const entry of entries) {
    if (entry.type === "income" || entry.type === "expense") add(entry.currency, entry.type, entry.amount);
  }
  for (const invoice of invoices) add(invoice.currency, invoice.type === "sale" ? "income" : "expense", invoice.total);
  for (const entry of legacyTransactions) add(entry.currency, entry.type as "income" | "expense", entry.amount);
  return [...totals.entries()]
    .map(([currency, total]) => ({ ...total, profit: total.income - total.expense, currency }))
    .sort((a, b) => a.currency.localeCompare(b.currency));
};

router.get("/reports/profit", async (req, res): Promise<void> => {
  const query = GetProfitReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (invalidDateRange(query.data.from, query.data.to)) { invalid(res, "'from' must not be after 'to'"); return; }
  res.json(dateOnlyResponse(GetProfitReportResponse, await profitRows(query.data)));
});

router.get("/reports/profit-loss", async (req, res): Promise<void> => {
  const query = GetProfitLossReportQueryParams.safeParse(queryWithDates(req.query));
  if (!query.success) { invalid(res, query.error.message); return; }
  if (invalidDateRange(query.data.from, query.data.to)) { invalid(res, "'from' must not be after 'to'"); return; }
  const rows = await profitRows(query.data);
  const row = rows[0] ?? { income: 0, expense: 0, profit: 0, currency: "IQD" };
  res.json(dateOnlyResponse(GetProfitLossReportResponse, row));
});

export default router;