import { useState } from "react";
import { FileWarning, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateOpeningDebt,
  useListAccounts,
  useListOpeningDebts,
} from "@workspace/api-client-react";

export default function Debt() {
  const { data: debts = [], isLoading, refetch } = useListOpeningDebts();
  const { data: accounts = [] } = useListAccounts();
  const createDebt = useCreateOpeningDebt();
  const [accountId, setAccountId] = useState("");
  const [side, setSide] = useState<"sale" | "purchase">("sale");
  const [debtDate, setDebtDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IQD");
  const [note, setNote] = useState("");

  const save = () => {
    const numericAmount = Number(amount);
    if (!accountId || !debtDate || !Number.isFinite(numericAmount) || numericAmount < 0 || !currency.trim()) {
      toast.error("هەژمار، بەروار، بڕ و دراو پێویستن");
      return;
    }
    createDebt.mutate({ data: { accountId: Number(accountId), side, debtDate, amount: numericAmount, currency, note } }, {
      onSuccess: () => { setAmount(""); setNote(""); void refetch(); toast.success("قەرزەکە تۆمارکرا"); },
      onError: () => toast.error("قەرزەکە تۆمار نەکرا"),
    });
  };

  return <div dir="rtl">
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h1 className="text-xl font-normal text-gray-800">قەرزەکان</h1><button onClick={() => void refetch()} className="flex h-8 items-center gap-1 border border-gray-200 px-3 text-xs"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></div>
    <div className="mb-4 grid gap-2 border border-[#0f4c81] bg-white p-3 md:grid-cols-6">
      <select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="h-8 border border-gray-200 px-2 text-right text-xs"><option value="">هەژمار *</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select>
      <select value={side} onChange={(event) => setSide(event.target.value as "sale" | "purchase")} className="h-8 border border-gray-200 px-2 text-right text-xs"><option value="sale">قەرزی فرۆشتن</option><option value="purchase">قەرزی کڕین</option></select>
      <input type="date" value={debtDate} onChange={(event) => setDebtDate(event.target.value)} className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="بڕ" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <input value={currency} onChange={(event) => setCurrency(event.target.value)} placeholder="دراو" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <button onClick={save} disabled={createDebt.isPending} className="flex h-8 items-center justify-center gap-1 bg-[#0f4c81] text-xs text-white disabled:opacity-50"><Save className="h-4 w-4" /> پاشەکەوتکردن</button>
      <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="تێبینی" className="h-8 border border-gray-200 px-2 text-right text-xs md:col-span-2" />
    </div>
    <div className="overflow-x-auto border border-[#0f4c81] bg-white"><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">هەژمار</th><th className="p-2">جۆر</th><th className="p-2">بەروار</th><th className="p-2">بڕ</th><th className="p-2">دراو</th><th className="p-2">تێبینی</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">لە بارکردندایە...</td></tr> : debts.length === 0 ? <tr><td colSpan={6} className="p-8 text-center font-bold">هیچ زانیارییەک بەردەست نییە <FileWarning className="mx-auto mt-2 h-4 w-4 text-orange-400" /></td></tr> : debts.map((debt) => <tr key={debt.id} className="border-b border-gray-100"><td className="p-2">{accounts.find((account) => account.id === debt.accountId)?.name ?? `#${debt.accountId}`}</td><td className="p-2">{debt.side === "sale" ? "فرۆشتن" : "کڕین"}</td><td className="p-2">{debt.debtDate}</td><td className="p-2">{debt.amount}</td><td className="p-2">{debt.currency}</td><td className="p-2">{debt.note || "-"}</td></tr>)}</tbody></table></div>
  </div>;
}