import { FileWarning, RefreshCcw } from "lucide-react";
import {
  useGetCashboxTransactionsReport,
  useGetDebtReport,
  useGetInventoryBalanceReport,
  useGetProfitLossReport,
  useListItems,
  useListWarehouses,
} from "@workspace/api-client-react";

function Empty({ loading, children }: { loading: boolean; children?: React.ReactNode }) {
  if (loading) return <div className="p-10 text-center text-gray-500">لە بارکردندایە...</div>;
  return <div className="p-10 text-center font-bold text-gray-800"><span className="inline-flex items-center gap-2">{children ?? "هیچ زانیارییەک بەردەست نییە"} <FileWarning className="h-4 w-4 text-orange-400" /></span></div>;
}

function ReportHeader({ title, onRefresh }: { title: string; onRefresh: () => void }) {
  return <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h1 className="text-xl font-normal text-gray-800">{title}</h1><button type="button" onClick={onRefresh} className="flex h-8 items-center gap-1 rounded-sm border border-gray-200 px-3 text-xs text-gray-600"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></div>;
}

export function InventoryBalanceReport() {
  const { data = [], isLoading, refetch } = useGetInventoryBalanceReport();
  const { data: warehouses = [] } = useListWarehouses();
  const { data: items = [] } = useListItems();
  return <div dir="rtl"><ReportHeader title="ڕاپۆرتی باڵانسی مەخزەن" onRefresh={() => void refetch()} /><div className="overflow-x-auto border border-[#0f4c81] bg-white"><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">کۆگا</th><th className="p-2">کاڵا</th><th className="p-2">بڕ</th><th className="p-2">ئاستی داواکاری</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length === 0 ? <tr><td colSpan={5}><Empty loading={isLoading} /></td></tr> : data.map((row) => <tr key={`${row.warehouseId}-${row.itemId}`} className="border-b border-gray-100"><td className="p-2">{warehouses.find((warehouse) => warehouse.id === row.warehouseId)?.name ?? `#${row.warehouseId}`}</td><td className="p-2">{items.find((item) => item.id === row.itemId)?.name ?? `#${row.itemId}`}</td><td className="p-2">{row.quantity}</td><td className="p-2">{row.reorderLevel}</td><td className="p-2">{row.isLowStock ? "کەمە" : "باشە"}</td></tr>)}</tbody></table></div></div>;
}

export function CashboxTransactionsReport() {
  const { data = [], isLoading, refetch } = useGetCashboxTransactionsReport();
  return <div dir="rtl"><ReportHeader title="ڕاپۆرتی مامەڵەی سندوق" onRefresh={() => void refetch()} /><div className="overflow-x-auto border border-[#0f4c81] bg-white"><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">بەروار</th><th className="p-2">سەرچاوە</th><th className="p-2">وەسف</th><th className="p-2">بڕ</th><th className="p-2">دراو</th><th className="p-2">ئاڕاستە</th></tr></thead><tbody>{data.length === 0 ? <tr><td colSpan={6}><Empty loading={isLoading} /></td></tr> : data.map((row) => <tr key={`${row.source}-${row.id}`} className="border-b border-gray-100"><td className="p-2">{row.date}</td><td className="p-2">{row.source === "payment" ? "پارەدان" : "تۆمارێکی دارایی"}</td><td className="p-2">{row.description || "-"}</td><td className="p-2">{row.amount}</td><td className="p-2">{row.currency}</td><td className="p-2">{row.direction ?? "-"}</td></tr>)}</tbody></table></div></div>;
}

export function ProfitLossReport() {
  const { data, isLoading, refetch } = useGetProfitLossReport();
  return <div dir="rtl"><ReportHeader title="قازانج و زیان" onRefresh={() => void refetch()} />{isLoading ? <Empty loading /> : <div className="grid gap-3 md:grid-cols-4">{[["داهات", data?.income ?? 0], ["خەرجی", data?.expense ?? 0], ["قازانج/زیان", data?.profit ?? 0], ["دراو", data?.currency ?? "-"]].map(([label, value]) => <div key={String(label)} className="border border-gray-100 bg-white p-5 text-right"><div className="text-xs text-gray-500">{label}</div><div className="mt-2 text-xl font-bold text-[#0f4c81]">{value}</div></div>)}</div>}</div>;
}

export function DebtReport() {
  const { data = [], isLoading, refetch } = useGetDebtReport();
  return <div dir="rtl"><ReportHeader title="ڕاپۆرتی قەرز" onRefresh={() => void refetch()} /><div className="overflow-x-auto border border-[#0f4c81] bg-white"><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">هەژمار</th><th className="p-2">جۆر</th><th className="p-2">باڵانس</th><th className="p-2">دراو</th></tr></thead><tbody>{data.length === 0 ? <tr><td colSpan={4}><Empty loading={isLoading} /></td></tr> : data.map((row) => <tr key={row.accountId} className="border-b border-gray-100"><td className="p-2">{row.accountName}</td><td className="p-2">{row.accountType}</td><td className="p-2">{row.balance}</td><td className="p-2">{row.currency}</td></tr>)}</tbody></table></div></div>;
}