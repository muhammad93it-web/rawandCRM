import {
  useGetAccountLastActivityReport, useGetCashboxReport, useGetDebtsReport, useGetExpensesReport, useGetOverdueDebtsReport,
  useGetProfitReport, useGetPurchasesReport, useGetSalesReport, useGetStockReport,
  useListBusinessDocuments, useListItems, useListStockTransfers, useListWarehouses,
} from "@workspace/api-client-react";
import type { InvoiceReportRow } from "@workspace/api-client-react";
import { AlertCircle, CalendarDays, FileWarning, RefreshCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

type ReportKind = "stock" | "transfer" | "sale" | "purchase" | "combined" | "account" | "debt" | "expense" | "cashbox" | "profit" | "document";
type Cell = string | number | null | undefined;
type Row = { id: string; cells: Cell[]; date?: string };
export type ReportDefinition = { path: string; title: string; section: string; kind: ReportKind; variant?: string };

export const reportDefinitions: ReportDefinition[] = [
  { path: "storereports", title: "ڕاپۆرتی کۆگاکان", section: "کۆگا و کاڵا", kind: "stock" },
  { path: "reportitemexpose", title: "ڕاپۆرتی کاڵاکان", section: "کۆگا و کاڵا", kind: "stock", variant: "items" },
  { path: "reportminqty", title: "کاڵاکانی کەم لە سنوور", section: "کۆگا و کاڵا", kind: "stock", variant: "low" },
  { path: "reportstockbystorename", title: "ستۆک بە پێی ناوی کۆگا", section: "کۆگا و کاڵا", kind: "stock" },
  { path: "reportstockperstore", title: "ستۆکی هەر کۆگایەک", section: "کۆگا و کاڵا", kind: "stock" },
  { path: "reportstockandpurchase", title: "ستۆک و نرخی کڕین", section: "کۆگا و کاڵا", kind: "stock", variant: "value" },
  { path: "reportitemsTransfer", title: "گواستنەوەی کاڵا", section: "کۆگا و کاڵا", kind: "transfer" },
  { path: "reportexpenses", title: "ڕاپۆرتی خەرجی", section: "دارایی", kind: "expense" },
  { path: "reportexpensebytype", title: "خەرجی بە پێی جۆر", section: "دارایی", kind: "expense", variant: "category" },
  { path: "reportincome", title: "ڕاپۆرتی داهات", section: "دارایی", kind: "profit", variant: "income" },
  { path: "reportpurchaseaccountstatement", title: "حسابی کڕین", section: "هەژمار", kind: "purchase", variant: "headers" },
  { path: "reportsaleaccountstatement", title: "حسابی فرۆشتن", section: "هەژمار", kind: "sale", variant: "headers" },
  { path: "reportpurchasesaleaccountstatement", title: "حسابی کڕین و فرۆشتن", section: "هەژمار", kind: "combined", variant: "headers" },
  { path: "reportaccountlastactivity", title: "دوا چالاکیی هەژمارەکان", section: "هەژمار", kind: "account" },
  { path: "reportdebts", title: "ڕاپۆرتی قەرزەکان", section: "قەرز", kind: "debt" },
  { path: "ReportpurchaseDebts", title: "قەرزی کڕین", section: "قەرز", kind: "debt", variant: "supplier" },
  { path: "ReportsellDebts", title: "قەرزی فرۆشتن", section: "قەرز", kind: "debt", variant: "customer" },
  { path: "reportdebtslateamount", title: "بڕی قەرزی دواخراو", section: "قەرز", kind: "debt", variant: "overdue" },
  { path: "reportdebtslatetime", title: "کاتی قەرزی دواخراو", section: "قەرز", kind: "debt", variant: "overdue" },
  { path: "reportdailysale", title: "فرۆشتنی ڕۆژانە", section: "فرۆشتن", kind: "sale", variant: "daily" },
  { path: "reportsaleitemshistory", title: "مێژووی کاڵای فرۆشراو", section: "فرۆشتن", kind: "sale", variant: "lines" },
  { path: "reportsaleitemsreturn", title: "گەڕاندنەوەی فرۆشتن", section: "فرۆشتن", kind: "document", variant: "sale_return" },
  { path: "reportsellbytotaltypes", title: "فرۆشتن بە پێی جۆری پارەدان", section: "فرۆشتن", kind: "sale", variant: "payment" },
  { path: "reportsaleinvoices", title: "پسوولەکانی فرۆشتن", section: "فرۆشتن", kind: "sale", variant: "headers" },
  { path: "reportsaleitemshistorysummed", title: "پوختەی فرۆشتن", section: "فرۆشتن", kind: "sale", variant: "summary" },
  { path: "ReportEmployeePerSell", title: "فرۆشتن بە پێی کارمەند", section: "فرۆشتن", kind: "sale", variant: "employee" },
  { path: "ReportMostSaleItemByUser", title: "زۆرترین فرۆشتن بە پێی بەکارهێنەر", section: "فرۆشتن", kind: "sale", variant: "creator-items" },
  { path: "ReportSellInvoicePerUser", title: "پسوولەی فرۆشتن بە پێی بەکارهێنەر", section: "فرۆشتن", kind: "sale", variant: "creator" },
  { path: "ReportDamageItems", title: "کاڵای زیان‌لێکەوتوو", section: "کۆگا و کاڵا", kind: "document", variant: "sale_talaf" },
  { path: "reportpurchaseitemshistory", title: "مێژووی کاڵای کڕدراو", section: "کڕین", kind: "purchase", variant: "lines" },
  { path: "reportpurchaseinvoices", title: "پسوولەکانی کڕین", section: "کڕین", kind: "purchase", variant: "headers" },
  { path: "reportpurchaseitemshistorysummed", title: "پوختەی کڕین", section: "کڕین", kind: "purchase", variant: "summary" },
  { path: "ReportemployeePerInvoice", title: "پسوولەی کڕین بە پێی کارمەند", section: "کڕین", kind: "purchase", variant: "employee" },
  { path: "reportpurchasesellitemsummarize", title: "پوختەی کڕین و فرۆشتن", section: "کڕین و فرۆشتن", kind: "combined", variant: "item-summary" },
  { path: "reportprofit", title: "ڕاپۆرتی قازانج", section: "دارایی", kind: "profit" },
  { path: "reportprofitsummary", title: "پوختەی قازانج و زیان", section: "دارایی", kind: "profit" },
  { path: "reportcashboxbalance", title: "باڵانسی سندوق", section: "دارایی", kind: "cashbox" },
];

const words: Record<string, string> = { customer: "کڕیار", supplier: "دابینکەر", other: "تر", cash: "نەقد", credit: "قەرز", completed: "تەواو", draft: "ڕەشنووس", cancelled: "هەڵوەشاوە", received: "وەرگیراو", paid: "دراو", financial_entry: "تۆماری دارایی", transaction: "مامەڵە" };
const text = (value: Cell) => value == null || value === "" ? "—" : words[String(value)] ?? String(value);
const shownDate = (value: string) => new Date(value).toLocaleDateString("ku");

function Table({ definition, headers, rows, loading, error, refresh, note }: { definition: ReportDefinition; headers: string[]; rows: Row[]; loading: boolean; error: boolean; refresh: () => void; note?: string }) {
  const [search, setSearch] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const visible = useMemo(() => rows.filter((row) => (!search || row.cells.some((cell) => text(cell).toLowerCase().includes(search.toLowerCase()))) && (!from || !row.date || row.date >= from) && (!to || !row.date || row.date <= to)), [rows, search, from, to]);
  return <div dir="rtl">
    <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3"><div><h1 className="text-xl font-normal text-gray-800" data-testid="text-report-title">{definition.title}</h1><p className="mt-1 text-xs text-gray-500">{note ?? "زانیارییەکان ڕاستەوخۆ لە ڕاپۆرتی پاشەکەوتکراوی سیستەمەوە وەرگیراون."}</p></div><button type="button" data-testid="button-refresh-report" onClick={refresh} className="flex h-8 items-center gap-1.5 border border-gray-200 bg-white px-3 text-xs text-gray-600"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></header>
    <div className="mb-3 flex flex-wrap gap-2"><label className="relative"><Search className="absolute right-2 top-2.5 h-3.5 w-3.5 text-gray-400" /><input data-testid="input-report-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="گەڕان لە ڕاپۆرت" className="h-9 w-56 border border-gray-200 bg-white pr-8 text-xs outline-none" /></label><label className="flex h-9 items-center gap-2 border border-gray-200 bg-white px-2 text-xs text-gray-500"><CalendarDays className="h-3.5 w-3.5" />لە <input data-testid="input-report-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="outline-none" /></label><label className="flex h-9 items-center gap-2 border border-gray-200 bg-white px-2 text-xs text-gray-500">تا <input data-testid="input-report-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="outline-none" /></label></div>
    <div className="overflow-x-auto border border-[#0f4c81] bg-white"><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap p-2.5 font-medium">{header}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={headers.length} data-testid="status-report-loading" className="p-10 text-center text-gray-500">لە بارکردندایە...</td></tr> : error ? <tr><td colSpan={headers.length} data-testid="status-report-error" className="p-10 text-center text-red-600"><AlertCircle className="ml-2 inline h-4 w-4" />هەڵەیەک لە وەرگرتنی زانیارییەکان ڕوویدا</td></tr> : visible.length === 0 ? <tr><td colSpan={headers.length} data-testid="status-report-empty" className="p-10 text-center font-bold text-gray-700"><FileWarning className="ml-2 inline h-4 w-4 text-orange-400" />هیچ زانیارییەکی پاشەکەوتکراو بەردەست نییە</td></tr> : visible.map((row) => <tr key={row.id} data-testid={`row-report-${row.id}`} className="border-b border-gray-100 hover:bg-gray-50">{row.cells.map((cell, i) => <td key={i} className="whitespace-nowrap p-2.5">{text(cell)}</td>)}</tr>)}</tbody></table></div>
    {!loading && !error && <p className="mt-2 text-xs text-gray-500" data-testid="text-report-count">پیشاندانی {visible.length} لە کۆی {rows.length} تۆمار</p>}
  </div>;
}

type Invoice = InvoiceReportRow;
function invoiceHeaders(invoices: Invoice[]): Row[] { return invoices.map((item) => ({ id: String(item.id), date: item.date, cells: [item.number, shownDate(item.date), item.accountName, item.paymentType, item.lines.length, `${item.paidAmount} ${item.currency}`, `${item.outstandingAmount} ${item.currency}`, `${item.total} ${item.currency}`, item.status] })); }
function lineRows(invoices: Invoice[], prefix = ""): Row[] { return invoices.flatMap((invoice) => invoice.lines.map((line) => ({ id: `${prefix}${invoice.id}-${line.id}`, date: invoice.date, cells: [invoice.number, shownDate(invoice.date), line.itemName, line.barcode, line.quantity, line.unit, line.unitPrice, line.discount, `${line.lineTotal} ${invoice.currency}`] }))); }
function itemTotals(invoices: Invoice[], includeSide = false): Row[] {
  const totals = new Map<string, { name: string | null; unit: string | null; quantity: number; total: number; currency: string; sale: number; purchase: number }>();
  for (const invoice of invoices) for (const line of invoice.lines) { const key = `${line.itemId}-${invoice.currency}`; const value = totals.get(key) ?? { name: line.itemName, unit: line.unit ?? null, quantity: 0, total: 0, currency: invoice.currency, sale: 0, purchase: 0 }; value.quantity += line.quantity; value.total += line.lineTotal; if (includeSide) invoice.number.startsWith("sale") ? value.sale += line.quantity : value.purchase += line.quantity; totals.set(key, value); }
  return [...totals.entries()].map(([id, value]) => ({ id, cells: includeSide ? [value.name, value.unit, value.purchase, value.sale, `${value.total} ${value.currency}`] : [value.name, value.unit, value.quantity, `${value.total} ${value.currency}`] }));
}
function combinedItemTotals(sales: Invoice[], purchases: Invoice[]): Row[] {
  const totals = new Map<string, { name: string | null; unit: string | null; purchase: number; sale: number; purchaseTotal: number; saleTotal: number; currency: string }>();
  for (const [invoices, side] of [[sales, "sale"], [purchases, "purchase"]] as const) for (const invoice of invoices) for (const line of invoice.lines) {
    const key = `${line.itemId}-${invoice.currency}`;
    const value = totals.get(key) ?? { name: line.itemName, unit: line.unit ?? null, purchase: 0, sale: 0, purchaseTotal: 0, saleTotal: 0, currency: invoice.currency };
    if (side === "sale") { value.sale += line.quantity; value.saleTotal += line.lineTotal; } else { value.purchase += line.quantity; value.purchaseTotal += line.lineTotal; }
    totals.set(key, value);
  }
  return [...totals.entries()].map(([id, value]) => ({ id, cells: [value.name, value.unit, value.purchase, value.sale, `${value.purchaseTotal} ${value.currency}`, `${value.saleTotal} ${value.currency}`] }));
}

function InvoiceReport({ definition }: { definition: ReportDefinition }) {
  const sales = useGetSalesReport(); const purchases = useGetPurchasesReport();
  const invoices = definition.kind === "sale" ? sales.data ?? [] : definition.kind === "purchase" ? purchases.data ?? [] : [...(sales.data ?? []), ...(purchases.data ?? [])];
  const loading = sales.isLoading || purchases.isLoading; const error = sales.isError || purchases.isError; const refresh = () => { void sales.refetch(); void purchases.refetch(); };
  if (definition.variant === "lines") return <Table definition={definition} headers={["پسوولە", "بەروار", "کاڵا", "بارکۆد", "بڕ", "یەکە", "نرخی دانە", "داشکاندن", "کۆ"]} rows={lineRows(invoices)} loading={loading} error={error} refresh={refresh} />;
  if (definition.variant === "summary") return <Table definition={definition} headers={["کاڵا", "یەکە", "کۆی بڕ", "کۆی بەها"]} rows={itemTotals(invoices)} loading={loading} error={error} refresh={refresh} />;
  if (definition.variant === "daily") {
    const grouped = new Map<string, { count: number; total: number; currency: string }>(); for (const item of invoices) { const key = `${item.date}-${item.currency}`; const value = grouped.get(key) ?? { count: 0, total: 0, currency: item.currency }; value.count++; value.total += item.total; grouped.set(key, value); }
    return <Table definition={definition} headers={["بەروار", "ژمارەی پسوولە", "کۆی فرۆشتن"]} rows={[...grouped.entries()].map(([id, value]) => ({ id, date: id.slice(0, 10), cells: [shownDate(id.slice(0, 10)), value.count, `${value.total} ${value.currency}`] }))} loading={loading} error={error} refresh={refresh} />;
  }
  if (definition.variant === "payment") { const grouped = new Map<string, { count: number; total: number; currency: string }>(); for (const item of invoices) { const key = `${item.paymentType}-${item.currency}`; const value = grouped.get(key) ?? { count: 0, total: 0, currency: item.currency }; value.count++; value.total += item.total; grouped.set(key, value); } return <Table definition={definition} headers={["جۆری پارەدان", "ژمارەی پسوولە", "کۆی فرۆشتن"]} rows={[...grouped.entries()].map(([id, value]) => ({ id, cells: [id.split("-")[0], value.count, `${value.total} ${value.currency}`] }))} loading={loading} error={error} refresh={refresh} />; }
  if (definition.variant === "employee" || definition.variant === "creator" || definition.variant === "creator-items") {
    if (definition.variant === "creator-items") {
      const grouped = new Map<string, { user: string; item: string | null; quantity: number; total: number; currency: string }>();
      for (const invoice of invoices) for (const line of invoice.lines) { const user = invoice.createdByUserName ?? "بەکارهێنەری نەناسراو"; const key = `${user}-${line.itemId}-${invoice.currency}`; const value = grouped.get(key) ?? { user, item: line.itemName, quantity: 0, total: 0, currency: invoice.currency }; value.quantity += line.quantity; value.total += line.lineTotal; grouped.set(key, value); }
      return <Table definition={definition} headers={["بەکارهێنەر", "کاڵا", "بڕ", "کۆ"]} rows={[...grouped.entries()].map(([id, item]) => ({ id, cells: [item.user, item.item, item.quantity, `${item.total} ${item.currency}`] }))} loading={loading} error={error} refresh={refresh} note="پسوولەکانی بێ بەکارهێنەری تۆمارکراو بە گروپی «بەکارهێنەری نەناسراو» پیشان دەدرێن." />;
    }
    const isEmployee = definition.variant === "employee";
    return <Table definition={definition} headers={["پسوولە", "بەروار", isEmployee ? "کارمەند" : "بەکارهێنەر", "خاوەن حساب", "کۆ"]} rows={invoices.map((item) => ({ id: String(item.id), date: item.date, cells: [item.number, shownDate(item.date), isEmployee ? item.employeeName ?? "بێ کارمەند" : item.createdByUserName ?? "بەکارهێنەری نەناسراو", item.accountName, `${item.total} ${item.currency}`] }))} loading={loading} error={error} refresh={refresh} note="ناوی کارمەند/بەکارهێنەر تەنها ئەگەر لە پسوولەکە پاشەکەوت کرابێت پیشان دەدرێت؛ تۆمارەکانی تر بە ڕوونی نیشان دەدرێن." />;
  }
  if (definition.variant === "item-summary") return <Table definition={definition} headers={["کاڵا", "یەکە", "کۆی کڕین", "کۆی فرۆشتن", "بەهای کڕین", "بەهای فرۆشتن"]} rows={combinedItemTotals(sales.data ?? [], purchases.data ?? [])} loading={loading} error={error} refresh={refresh} />;
  return <Table definition={definition} headers={["ژمارە", "بەروار", "خاوەن حساب", "پارەدان", "ژمارەی کاڵا", "پارەدراو", "ماوە", "کۆ", "دۆخ"]} rows={invoiceHeaders(invoices)} loading={loading} error={error} refresh={refresh} />;
}

function StockReport({ definition }: { definition: ReportDefinition }) {
  const report = useGetStockReport(); const showValue = definition.variant === "value";
  const rows = (report.data ?? []).filter((item) => definition.variant !== "low" || item.isLowStock).map((item) => ({ id: `${item.warehouseId}-${item.itemId}`, cells: [item.warehouseName, item.itemName, item.barcode, item.quantity, item.unit, item.reorderLevel, ...(showValue ? [item.purchasePrice, item.stockValue] : []), item.isLowStock ? "کەمە" : "باشە"] }));
  return <Table definition={definition} headers={["کۆگا", "کاڵا", "بارکۆد", "بڕ", "یەکە", "سنووری داوا", ...(showValue ? ["نرخی کڕین", "بەهای ستۆک"] : []), "دۆخ"]} rows={rows} loading={report.isLoading} error={report.isError} refresh={() => void report.refetch()} />;
}
function DebtReport({ definition }: { definition: ReportDefinition }) {
  const report = useGetDebtsReport(); const overdue = useGetOverdueDebtsReport();
  if (definition.variant === "overdue") return <Table definition={definition} headers={["خاوەن حساب", "بەرواری تۆمار", "بەرواری وادە", "ڕۆژانی دواخستن", "بڕ", "وەسف", "دۆخ"]} rows={(overdue.data ?? []).map((item) => ({ id: String(item.id), date: item.dueDate, cells: [item.accountName, shownDate(item.entryDate), shownDate(item.dueDate), item.daysOverdue, `${item.amount} ${item.currency}`, item.description, item.status] }))} loading={overdue.isLoading} error={overdue.isError} refresh={() => void overdue.refetch()} note="تەنها قەرزەکان بە بەرواری وادەی تێپەڕاو لە تۆمارە پاشەکەوتکراوەکانەوە پیشان دەدرێن." />;
  const rows = (report.data ?? []).filter((item) => !definition.variant || item.accountType === definition.variant).map((item) => ({ id: String(item.accountId), cells: [item.accountName, item.accountType, `${item.balance} ${item.currency}`] }));
  return <Table definition={definition} headers={["خاوەن حساب", "جۆر", "باڵانس"]} rows={rows} loading={report.isLoading} error={report.isError} refresh={() => void report.refetch()} />;
}
function AccountReport({ definition }: { definition: ReportDefinition }) {
  const report = useGetAccountLastActivityReport();
  const rows = (report.data ?? []).map((item) => ({ id: String(item.accountId), date: item.latestActivityDate, cells: [item.accountId, item.accountName, item.city, item.phone, shownDate(item.latestActivityDate), item.daysSinceActivity, item.latestInvoiceNumber, `${item.latestInvoiceTotal} ${item.latestInvoiceCurrency}`] }));
  return <Table definition={definition} headers={["کۆد / زنجیرە", "ناوی خاوەن حساب", "شار / ناونیشان", "مۆبایل", "دوا چالاکی", "ڕۆژ لە دوا چالاکی", "دوا پسوولە", "کۆی دوا پسوولە"]} rows={rows} loading={report.isLoading} error={report.isError} refresh={() => void report.refetch()} />;
}
function ExpenseReport({ definition }: { definition: ReportDefinition }) { const report = useGetExpensesReport(); if (definition.variant === "category") { const grouped = new Map<string, { amount: number; currency: string; count: number }>(); for (const item of report.data ?? []) { const key = `${item.category}-${item.currency}`; const value = grouped.get(key) ?? { amount: 0, currency: item.currency, count: 0 }; value.amount += item.amount; value.count++; grouped.set(key, value); } return <Table definition={definition} headers={["پۆل", "ژمارەی تۆمار", "کۆی خەرجی"]} rows={[...grouped.entries()].map(([id, item]) => ({ id, cells: [id.slice(0, -(item.currency.length + 1)), item.count, `${item.amount} ${item.currency}`] }))} loading={report.isLoading} error={report.isError} refresh={() => void report.refetch()} />; } return <Table definition={definition} headers={["بەروار", "سەرچاوە", "پۆل", "وەسف", "خاوەن حساب", "بڕ", "دۆخ"]} rows={(report.data ?? []).map((item) => ({ id: `${item.source}-${item.id}`, date: item.date, cells: [shownDate(item.date), item.source, item.category, item.description, item.accountName, `${item.amount} ${item.currency}`, item.status] }))} loading={report.isLoading} error={report.isError} refresh={() => void report.refetch()} />; }
function CashboxReport({ definition }: { definition: ReportDefinition }) { const report = useGetCashboxReport(); return <Table definition={definition} headers={["بەروار", "سەرچاوە", "وەسف", "ئاڕاستە", "بڕ", "دۆخ"]} rows={(report.data ?? []).map((item) => ({ id: `${item.source}-${item.id}`, date: item.date, cells: [shownDate(item.date), item.source, item.description, item.direction, `${item.amount} ${item.currency}`, item.status] }))} loading={report.isLoading} error={report.isError} refresh={() => void report.refetch()} />; }
function ProfitReport({ definition }: { definition: ReportDefinition }) { const report = useGetProfitReport(); const rows = (report.data ?? []).map((item) => ({ id: item.currency, cells: [item.currency, item.income, item.expense, item.profit] })); const incomeOnly = definition.variant === "income"; return <Table definition={definition} headers={incomeOnly ? ["دراو", "داهات"] : ["دراو", "داهات", "خەرجی", "قازانج / زیان"]} rows={incomeOnly ? rows.map((row) => ({ ...row, cells: [row.cells[0], row.cells[1]] })) : rows} loading={report.isLoading} error={report.isError} refresh={() => void report.refetch()} />; }
function TransferReport({ definition }: { definition: ReportDefinition }) { const transfers = useListStockTransfers(); const warehouses = useListWarehouses(); const items = useListItems(); const rows = (transfers.data ?? []).flatMap((transfer) => transfer.lines.map((line) => ({ id: `${transfer.id}-${line.id}`, date: transfer.transferDate, cells: [transfer.id, shownDate(transfer.transferDate), warehouses.data?.find((w) => w.id === transfer.fromWarehouseId)?.name, warehouses.data?.find((w) => w.id === transfer.toWarehouseId)?.name, items.data?.find((i) => i.id === line.itemId)?.name, line.quantity, transfer.status] }))); return <Table definition={definition} headers={["ژمارە", "بەروار", "لە کۆگا", "بۆ کۆگا", "کاڵا", "بڕ", "دۆخ"]} rows={rows} loading={transfers.isLoading || warehouses.isLoading || items.isLoading} error={transfers.isError || warehouses.isError || items.isError} refresh={() => { void transfers.refetch(); void warehouses.refetch(); void items.refetch(); }} />; }
function DocumentReport({ definition }: { definition: ReportDefinition }) { const docs = useListBusinessDocuments({ kind: definition.variant as "sale_return" | "sale_talaf" }); const items = useListItems(); const rows = (docs.data ?? []).flatMap((doc) => doc.lines.map((line) => ({ id: `${doc.id}-${line.id}`, date: doc.documentDate, cells: [doc.number, shownDate(doc.documentDate), doc.accountName, items.data?.find((item) => item.id === line.itemId)?.name ?? line.description, line.quantity, line.unitPrice, line.lineTotal, doc.status] }))); return <Table definition={definition} headers={["ژمارە", "بەروار", "خاوەن حساب", "کاڵا", "بڕ", "نرخی دانە", "کۆ", "دۆخ"]} rows={rows} loading={docs.isLoading || items.isLoading} error={docs.isError || items.isError} refresh={() => { void docs.refetch(); void items.refetch(); }} />; }
export default function ReportSuitePage() { const [location] = useLocation(); const definition = reportDefinitions.find((item) => item.path.toLowerCase() === location.replace(/^\//, "").toLowerCase()) ?? reportDefinitions[0]; if (definition.kind === "stock") return <StockReport definition={definition} />; if (definition.kind === "transfer") return <TransferReport definition={definition} />; if (definition.kind === "debt") return <DebtReport definition={definition} />; if (definition.kind === "account") return <AccountReport definition={definition} />; if (definition.kind === "expense") return <ExpenseReport definition={definition} />; if (definition.kind === "cashbox") return <CashboxReport definition={definition} />; if (definition.kind === "profit") return <ProfitReport definition={definition} />; if (definition.kind === "document") return <DocumentReport definition={definition} />; return <InvoiceReport definition={definition} />; }