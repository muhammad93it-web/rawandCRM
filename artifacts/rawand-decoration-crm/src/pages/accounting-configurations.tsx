import { useState } from "react";
import { FileWarning, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateAccountCategory,
  useCreateCashBox,
  useCreatePayment,
  useListAccounts,
  useListAccountCategories,
  useListCashBoxes,
  useListPayments,
  useListWorkplaces,
} from "@workspace/api-client-react";

type Tab = "categories" | "cashboxes" | "payments";

export default function AccountingConfigurations() {
  const [tab, setTab] = useState<Tab>("categories");
  return <div dir="rtl">
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h1 className="text-xl font-normal text-gray-800">ڕێکخستنەکانی خەرجی و داهات</h1></div>
    <div className="mb-4 flex border-b border-gray-200">{([["categories", "پۆلەکانی هەژمار"], ["cashboxes", "سندوقەکان"], ["payments", "پارەدانەکان"]] as const).map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`flex-1 py-3 text-sm font-bold ${tab === value ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "text-gray-500"}`}>{label}</button>)}</div>
    {tab === "categories" && <Categories />}
    {tab === "cashboxes" && <Cashboxes />}
    {tab === "payments" && <Payments />}
  </div>;
}

function Categories() {
  const { data = [], isLoading, refetch } = useListAccountCategories();
  const create = useCreateAccountCategory();
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"customer" | "supplier" | "other">("customer");
  const add = () => {
    if (!name.trim()) { toast.error("ناوی پۆل پێویستە"); return; }
    create.mutate({ data: { name: name.trim(), accountType } }, { onSuccess: () => { setName(""); void refetch(); toast.success("پۆلی هەژمار زیادکرا"); }, onError: () => toast.error("پۆلی هەژمار زیاد نەکرا") });
  };
  return <Section title="پۆلەکانی هەژمار" refresh={() => void refetch()} form={<><input value={name} onChange={(e) => setName(e.target.value)} placeholder="ناوی پۆل" /><select value={accountType} onChange={(e) => setAccountType(e.target.value as typeof accountType)}><option value="customer">کڕیار</option><option value="supplier">دابینکەر</option><option value="other">هی تر</option></select><button onClick={add} disabled={create.isPending} className="bg-[#0f4c81] text-white"><Plus className="mx-auto h-4 w-4" /></button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">جۆر</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((row) => <tr key={row.id} className="border-b border-gray-100"><td className="p-2">{row.name}</td><td className="p-2">{row.accountType}</td><td className="p-2">{row.status}</td></tr>) : <Empty loading={isLoading} colSpan={3} />}</tbody></table></Section>;
}

function Cashboxes() {
  const { data = [], isLoading, refetch } = useListCashBoxes();
  const { data: workplaces = [] } = useListWorkplaces();
  const create = useCreateCashBox();
  const [workplaceId, setWorkplaceId] = useState("");
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("IQD");
  const add = () => {
    if (!workplaceId || !name.trim() || !currency.trim()) { toast.error("شوێنکار، ناو و دراو پێویستن"); return; }
    create.mutate({ data: { workplaceId: Number(workplaceId), name: name.trim(), currency } }, { onSuccess: () => { setName(""); void refetch(); toast.success("سندوق زیادکرا"); }, onError: () => toast.error("سندوق زیاد نەکرا") });
  };
  return <Section title="سندوقەکان" refresh={() => void refetch()} form={<><select value={workplaceId} onChange={(e) => setWorkplaceId(e.target.value)}><option value="">شوێنکار</option>{workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}</select><input value={name} onChange={(e) => setName(e.target.value)} placeholder="ناوی سندوق" /><input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="دراو" /><button onClick={add} disabled={create.isPending} className="bg-[#0f4c81] text-white"><Plus className="mx-auto h-4 w-4" /></button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">شوێنکار</th><th className="p-2">دراو</th><th className="p-2">دۆخ</th></tr></thead><tbody>{data.length ? data.map((row) => <tr key={row.id} className="border-b border-gray-100"><td className="p-2">{row.name}</td><td className="p-2">{workplaces.find((workplace) => workplace.id === row.workplaceId)?.name ?? `#${row.workplaceId}`}</td><td className="p-2">{row.currency}</td><td className="p-2">{row.status}</td></tr>) : <Empty loading={isLoading} colSpan={4} />}</tbody></table></Section>;
}

function Payments() {
  const { data = [], isLoading, refetch } = useListPayments();
  const { data: accounts = [] } = useListAccounts();
  const { data: cashboxes = [] } = useListCashBoxes();
  const create = useCreatePayment();
  const [accountId, setAccountId] = useState("");
  const [cashBoxId, setCashBoxId] = useState("");
  const [direction, setDirection] = useState<"received" | "paid">("received");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IQD");
  const [note, setNote] = useState("");
  const add = () => {
    const value = Number(amount);
    if (!accountId || !paymentDate || !Number.isFinite(value) || value <= 0 || !currency.trim()) { toast.error("هەژمار، بەروار، بڕ و دراو پێویستن"); return; }
    create.mutate({ data: { accountId: Number(accountId), cashBoxId: cashBoxId ? Number(cashBoxId) : null, direction, paymentDate, amount: value, currency, note } }, { onSuccess: () => { setAmount(""); setNote(""); void refetch(); toast.success("پارەدان تۆمارکرا"); }, onError: () => toast.error("پارەدان تۆمار نەکرا") });
  };
  return <Section title="پارەدانەکان" refresh={() => void refetch()} form={<><select value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">هەژمار</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select value={cashBoxId} onChange={(e) => setCashBoxId(e.target.value)}><option value="">سندوق</option>{cashboxes.map((cashbox) => <option key={cashbox.id} value={cashbox.id}>{cashbox.name}</option>)}</select><select value={direction} onChange={(e) => setDirection(e.target.value as typeof direction)}><option value="received">وەرگیراو</option><option value="paid">دراوە</option></select><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /><input type="number" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="بڕ" /><input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="دراو" /><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="تێبینی" /><button onClick={add} disabled={create.isPending} className="bg-[#0f4c81] text-white"><Plus className="mx-auto h-4 w-4" /></button></>}><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">هەژمار</th><th className="p-2">سندوق</th><th className="p-2">بەروار</th><th className="p-2">ئاڕاستە</th><th className="p-2">بڕ</th><th className="p-2">دراو</th></tr></thead><tbody>{data.length ? data.map((row) => <tr key={row.id} className="border-b border-gray-100"><td className="p-2">{accounts.find((account) => account.id === row.accountId)?.name ?? `#${row.accountId}`}</td><td className="p-2">{cashboxes.find((cashbox) => cashbox.id === row.cashBoxId)?.name ?? "-"}</td><td className="p-2">{row.paymentDate}</td><td className="p-2">{row.direction}</td><td className="p-2">{row.amount}</td><td className="p-2">{row.currency}</td></tr>) : <Empty loading={isLoading} colSpan={6} />}</tbody></table></Section>;
}

function Section({ title, refresh, form, children }: { title: string; refresh: () => void; form: React.ReactNode; children: React.ReactNode }) {
  return <><div className="mb-2 flex items-center justify-between"><h2 className="text-sm font-bold text-gray-700">{title}</h2><button onClick={refresh} className="flex h-8 items-center gap-1 border border-gray-200 px-3 text-xs"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></div><div className="mb-4 flex flex-wrap gap-2 border border-[#0f4c81] bg-white p-3 text-xs [&_input]:h-8 [&_input]:min-w-24 [&_input]:border [&_input]:border-gray-200 [&_input]:px-2 [&_input]:text-right [&_select]:h-8 [&_select]:border [&_select]:border-gray-200 [&_select]:px-2">{form}</div><div className="overflow-x-auto border border-[#0f4c81] bg-white">{children}</div></>;
}

function Empty({ loading, colSpan }: { loading: boolean; colSpan: number }) {
  return <tr><td colSpan={colSpan} className="p-8 text-center font-bold">{loading ? "لە بارکردندایە..." : <span className="inline-flex items-center gap-2">هیچ زانیارییەک بەردەست نییە <FileWarning className="h-4 w-4 text-orange-400" /></span>}</td></tr>;
}