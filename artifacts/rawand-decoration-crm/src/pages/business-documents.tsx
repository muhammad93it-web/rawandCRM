import { useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Check, ChevronLeft, Plus, RefreshCcw, Save, Trash2 } from "lucide-react";
import {
  useCreateBusinessDocument,
  useCreatePayment,
  useCreateSetting,
  useDeleteBusinessDocument,
  useListAccounts,
  useListBusinessDocuments,
  useListCashBoxes,
  useListItems,
  useListSettings,
  useListWorkplaces,
  useUpdateBusinessDocument,
  useUpdateSetting,
} from "@workspace/api-client-react";
import type { BusinessDocumentInputKind, ListBusinessDocumentsKind } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const labels: Record<string, string> = {
  sale_offer: "پێشنیاری فرۆشتن",
  purchase_order: "داواکاری کڕین",
  sale_return: "گەڕانەوەی فرۆشتن",
  sale_talaf: "تەلەفی فرۆشتن",
  sale_collection: "وەرگرتنی پارەی فرۆشتن",
  purchase_payment: "پارەدانی کڕین",
};
const inputClass = "h-9 rounded-sm border border-gray-200 bg-white px-2 text-right text-xs outline-none focus:border-[#0f4c81]";
const today = () => new Date().toISOString().slice(0, 10);

export function BusinessDocumentList({ kind }: { kind: ListBusinessDocumentsKind }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data = [], isLoading, refetch } = useListBusinessDocuments({ kind });
  const update = useUpdateBusinessDocument();
  const remove = useDeleteBusinessDocument();
  const [search, setSearch] = useState("");
  const filtered = data.filter((doc) => `${doc.number} ${doc.accountName} ${doc.status}`.toLowerCase().includes(search.toLowerCase()));
  const refresh = () => { void refetch(); };
  const setStatus = (id: number, status: "approved" | "completed" | "cancelled") => {
    update.mutate({ id, data: { status } }, {
      onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["/api/business-documents"] }); toast.success("دۆخ نوێکرایەوە"); },
      onError: () => toast.error("نوێکردنەوە سەرکەوتوو نەبوو"),
    });
  };
  const deleteRow = (id: number) => {
    if (!window.confirm("ئەم بەڵگەیە بسڕینەوە؟")) return;
    remove.mutate({ id }, {
      onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["/api/business-documents"] }); toast.success("بەڵگەکە سڕایەوە"); },
      onError: () => toast.error("سڕینەوە سەرکەوتوو نەبوو"),
    });
  };
  return (
    <div className="p-4" dir="rtl">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <div><h1 className="text-xl font-bold text-gray-800">{labels[kind]}</h1><p className="mt-1 text-xs text-gray-500">بەڵگەکان لە بنکەدراوەوە بە ڕاستەوخۆ نوێ دەکرێنەوە.</p></div>
        <button onClick={() => setLocation(kind === "sale_offer" ? "/addselloffer/new" : "/addpurchaseorder/new")} className="flex h-9 items-center gap-2 rounded-sm bg-[#0f4c81] px-4 text-xs font-bold text-white"><Plus className="h-4 w-4" /> زیادکردن</button>
      </div>
      <div className="mb-3 flex gap-2"><input className={`${inputClass} flex-1`} placeholder="گەڕان بە ژمارە یان ناوی هەژمار" value={search} onChange={(e) => setSearch(e.target.value)} /><button className="flex h-9 items-center gap-1 border border-gray-200 px-3 text-xs" onClick={refresh}><RefreshCcw className="h-3.5 w-3.5 text-[#00a8e8]" /> نوێکردنەوە</button></div>
      <div className="overflow-x-auto border border-gray-200"><table className="w-full min-w-[760px] text-right text-xs">
        <thead className="bg-[#0f4c81] text-white"><tr><th className="p-3">ژمارە</th><th className="p-3">هەژمار</th><th className="p-3">بەروار</th><th className="p-3">کۆی گشتی</th><th className="p-3">پارەدراو</th><th className="p-3">دۆخ</th><th className="p-3">کردار</th></tr></thead>
        <tbody>{isLoading ? <tr><td colSpan={7} className="p-10 text-center text-gray-500">لە بارکردندایە...</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-gray-500">هیچ بەڵگەیەک نییە</td></tr> : filtered.map((doc) => <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="p-3 font-bold text-[#0f4c81]">{doc.number}</td><td className="p-3">{doc.accountName}</td><td className="p-3">{doc.documentDate}</td><td className="p-3">{doc.total.toLocaleString()} {doc.currency}</td><td className="p-3">{doc.paidAmount.toLocaleString()}</td><td className="p-3"><span className="rounded-full bg-blue-50 px-2 py-1">{doc.status}</span></td>
          <td className="flex items-center gap-1 p-2"><button title="تەواوکردن" onClick={() => setStatus(doc.id, "completed")} className="rounded p-2 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button><button title="هەڵوەشاندنەوە" onClick={() => setStatus(doc.id, "cancelled")} className="rounded p-2 text-orange-600 hover:bg-orange-50"><ChevronLeft className="h-4 w-4" /></button><button title="سڕینەوە" onClick={() => deleteRow(doc.id)} className="rounded p-2 text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></td>
        </tr>)}</tbody>
      </table></div>
    </div>
  );
}

export function BusinessDocumentForm({ kind }: { kind: BusinessDocumentInputKind }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useListAccounts();
  const { data: items = [] } = useListItems();
  const { data: workplaces = [] } = useListWorkplaces();
  const create = useCreateBusinessDocument();
  const [accountId, setAccountId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [warehouseId] = useState("");
  const [documentDate, setDocumentDate] = useState(today);
  const [validUntil, setValidUntil] = useState("");
  const [currency, setCurrency] = useState("IQD");
  const [status, setStatus] = useState<"draft" | "sent" | "approved" | "completed">("draft");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([{ itemId: "", quantity: "1", unitPrice: "", discount: "0", tax: "0", description: "" }]);
  const total = useMemo(() => Math.max(0, lines.reduce((sum, line) => sum + Math.max(0, Number(line.quantity) * Number(line.unitPrice) - Number(line.discount) + Number(line.tax)), 0) - Number(discount) + Number(tax)), [lines, discount, tax]);
  const updateLine = (index: number, key: string, value: string) => setLines((current) => current.map((line, i) => i === index ? { ...line, [key]: value } : line));
  const save = () => {
    if (!accountId || lines.some((line) => !line.itemId || !Number(line.unitPrice) || Number(line.quantity) <= 0)) { toast.error("هەژمار و کاڵا و نرخەکان پڕبکەرەوە"); return; }
    create.mutate({ data: {
      kind, accountId: Number(accountId), workplaceId: workplaceId ? Number(workplaceId) : null, warehouseId: warehouseId ? Number(warehouseId) : null,
      documentDate, validUntil: validUntil || null, currency, status, discount: Number(discount) || 0, tax: Number(tax) || 0, paidAmount: 0, notes,
      lines: lines.map((line) => ({ itemId: Number(line.itemId), quantity: Number(line.quantity), unitPrice: Number(line.unitPrice), discount: Number(line.discount) || 0, tax: Number(line.tax) || 0, description: line.description })),
    } }, {
      onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["/api/business-documents"] }); toast.success("بە سەرکەوتوویی پاشەکەوت کرا"); setLocation(kind === "sale_offer" ? "/selloffer" : kind === "purchase_order" ? "/purchaseorders" : "/saletalaflist"); },
      onError: () => toast.error("پاشەکەوتکردن سەرکەوتوو نەبوو"),
    });
  };
  const accountOptions = accounts.filter((account) => ["sale_offer", "sale_return", "sale_talaf"].includes(kind) ? account.type === "customer" : account.type === "supplier");
  return <div className="p-4" dir="rtl">
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3"><h1 className="text-xl font-bold text-gray-800">{labels[kind]}</h1><button onClick={() => setLocation(kind === "sale_offer" ? "/selloffer" : kind === "purchase_order" ? "/purchaseorders" : "/saletalaflist")} className="text-xs text-gray-500">گەڕانەوە</button></div>
    <div className="grid grid-cols-1 gap-3 border border-gray-200 p-4 md:grid-cols-4">
      <label className="text-xs font-bold">هەژمار<select className={`${inputClass} mt-1 w-full`} value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">هەڵبژێرە</option>{accountOptions.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
      <label className="text-xs font-bold">شوێنکار<select className={`${inputClass} mt-1 w-full`} value={workplaceId} onChange={(e) => setWorkplaceId(e.target.value)}><option value="">هەموو</option>{workplaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      <label className="text-xs font-bold">بەروار<input type="date" className={`${inputClass} mt-1 w-full`} value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} /></label>
      <label className="text-xs font-bold">بەرواری بەسەرچوون<input type="date" className={`${inputClass} mt-1 w-full`} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></label>
      <label className="text-xs font-bold">دۆخ<select className={`${inputClass} mt-1 w-full`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}><option value="draft">ڕەشنووس</option><option value="sent">نێردراو</option><option value="approved">پەسەندکراو</option><option value="completed">تەواوکراو</option></select></label>
      <label className="text-xs font-bold">دراو<input className={`${inputClass} mt-1 w-full`} value={currency} onChange={(e) => setCurrency(e.target.value)} /></label>
      <label className="text-xs font-bold">داشکاندن<input type="number" min="0" className={`${inputClass} mt-1 w-full`} value={discount} onChange={(e) => setDiscount(e.target.value)} /></label>
      <label className="text-xs font-bold">باژ<input type="number" min="0" className={`${inputClass} mt-1 w-full`} value={tax} onChange={(e) => setTax(e.target.value)} /></label>
    </div>
    <div className="mt-4 overflow-x-auto border border-gray-200"><table className="w-full min-w-[820px] text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">کاڵا</th><th className="p-2">ژمارە</th><th className="p-2">نرخ</th><th className="p-2">داشکاندن</th><th className="p-2">باژ</th><th className="p-2">کۆ</th><th className="p-2"></th></tr></thead><tbody>{lines.map((line, index) => <tr key={index} className="border-b border-gray-100"><td className="p-2"><select className={`${inputClass} w-56`} value={line.itemId} onChange={(e) => updateLine(index, "itemId", e.target.value)}><option value="">هەڵبژێرە</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.salePrice}</option>)}</select></td><td className="p-2"><input type="number" min="0.01" className={`${inputClass} w-24`} value={line.quantity} onChange={(e) => updateLine(index, "quantity", e.target.value)} /></td><td className="p-2"><input type="number" min="0" className={`${inputClass} w-28`} value={line.unitPrice} onChange={(e) => updateLine(index, "unitPrice", e.target.value)} /></td><td className="p-2"><input type="number" min="0" className={`${inputClass} w-24`} value={line.discount} onChange={(e) => updateLine(index, "discount", e.target.value)} /></td><td className="p-2"><input type="number" min="0" className={`${inputClass} w-24`} value={line.tax} onChange={(e) => updateLine(index, "tax", e.target.value)} /></td><td className="p-2 font-bold">{Math.max(0, Number(line.quantity) * Number(line.unitPrice) - Number(line.discount) + Number(line.tax)).toLocaleString()}</td><td className="p-2"><button onClick={() => setLines((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current)} className="text-red-500"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
    <button onClick={() => setLines((current) => [...current, { itemId: "", quantity: "1", unitPrice: "", discount: "0", tax: "0", description: "" }])} className="mt-3 flex items-center gap-1 text-xs font-bold text-[#0f4c81]"><Plus className="h-4 w-4" /> هێڵی نوێ</button>
    <div className="mt-4 flex items-end justify-between gap-3"><textarea className={`${inputClass} h-16 flex-1`} placeholder="تێبینی" value={notes} onChange={(e) => setNotes(e.target.value)} /><div className="text-left text-lg font-bold text-[#0f4c81]">کۆی گشتی: {total.toLocaleString()} {currency}</div><button onClick={save} disabled={create.isPending} className="flex h-10 items-center gap-2 rounded-sm bg-[#0f4c81] px-5 text-xs font-bold text-white disabled:opacity-50"><Save className="h-4 w-4" /> پاشەکەوتکردن</button></div>
  </div>;
}

export function PaymentPage({ direction, title }: { direction: "received" | "paid"; title: string }) {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { data: accounts = [] } = useListAccounts();
  const { data: cashboxes = [] } = useListCashBoxes();
  const { data: workplaces = [] } = useListWorkplaces();
  const create = useCreatePayment();
  const [accountId, setAccountId] = useState("");
  const [cashBoxId, setCashBoxId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("IQD");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const save = () => {
    if (!accountId || Number(amount) <= 0) { toast.error("هەژمار و بڕ پێویستن"); return; }
    const id = Number(params.id);
    create.mutate({ data: { accountId: Number(accountId), cashBoxId: cashBoxId ? Number(cashBoxId) : null, workplaceId: workplaceId ? Number(workplaceId) : null, direction, paymentDate, amount: Number(amount), currency, paymentMethod, referenceType: Number.isFinite(id) ? (direction === "received" ? "sale_invoice" : "purchase_invoice") : null, referenceId: Number.isFinite(id) ? id : null, note, status: "posted" } }, {
      onSuccess: () => { toast.success("پارەدان تۆمارکرا"); setLocation(direction === "received" ? "/sales" : "/purchases"); },
      onError: () => toast.error("پارەدان تۆمار نەکرا"),
    });
  };
  const validAccounts = accounts.filter((a) => direction === "received" ? a.type === "customer" : a.type === "supplier");
  return <div className="max-w-3xl p-4" dir="rtl"><div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3"><h1 className="text-xl font-bold">{title}</h1><button onClick={() => setLocation(direction === "received" ? "/sales" : "/purchases")} className="text-xs text-gray-500">گەڕانەوە</button></div><div className="grid grid-cols-1 gap-4 border border-gray-200 p-5 md:grid-cols-2">
    <label className="text-xs font-bold">هەژمار<select className={`${inputClass} mt-1 w-full`} value={accountId} onChange={(e) => setAccountId(e.target.value)}><option value="">هەڵبژێرە</option>{validAccounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
    <label className="text-xs font-bold">سندوق<select className={`${inputClass} mt-1 w-full`} value={cashBoxId} onChange={(e) => setCashBoxId(e.target.value)}><option value="">سندوق هەڵبژێرە</option>{cashboxes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="text-xs font-bold">شوێنکار<select className={`${inputClass} mt-1 w-full`} value={workplaceId} onChange={(e) => setWorkplaceId(e.target.value)}><option value="">هەموو</option>{workplaces.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
    <label className="text-xs font-bold">بەروار<input type="date" className={`${inputClass} mt-1 w-full`} value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} /></label>
    <label className="text-xs font-bold">بڕ<input type="number" min="0.01" className={`${inputClass} mt-1 w-full`} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
    <label className="text-xs font-bold">دراو<input className={`${inputClass} mt-1 w-full`} value={currency} onChange={(e) => setCurrency(e.target.value)} /></label>
    <label className="text-xs font-bold">شێوازی پارەدان<select className={`${inputClass} mt-1 w-full`} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">نەقد</option><option value="bank">بانک</option><option value="card">کارت</option></select></label>
    <label className="text-xs font-bold">تێبینی<input className={`${inputClass} mt-1 w-full`} value={note} onChange={(e) => setNote(e.target.value)} /></label>
    <button onClick={save} disabled={create.isPending} className="h-9 rounded-sm bg-[#0f4c81] text-xs font-bold text-white md:col-span-2"><Save className="mr-2 inline h-4 w-4" /> پاشەکەوتکردن</button>
  </div></div>;
}

export function PurchaseIssueConfig() {
  const { data: settings = [], isLoading, refetch } = useListSettings({ module: "purchase" });
  const create = useCreateSetting();
  const update = useUpdateSetting();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const saveNew = () => {
    if (!key.trim()) { toast.error("کلیل پێویستە"); return; }
    create.mutate({ data: { module: "purchase", key: key.trim(), value } }, { onSuccess: () => { setKey(""); setValue(""); void refetch(); toast.success("ڕێکخستن پاشەکەوتکرا"); }, onError: () => toast.error("هەڵەیەک ڕوویدا") });
  };
  return <div className="p-4" dir="rtl"><div className="mb-4 border-b border-gray-100 pb-3"><h1 className="text-xl font-bold">ڕێکخستنی کڕین</h1><p className="mt-1 text-xs text-gray-500">ڕێکخستنەکان لە API ـەوە هەڵدەگیرێن و لە بنکەدراوە پاشەکەوت دەکرێن.</p></div><div className="mb-4 grid grid-cols-1 gap-2 border border-gray-200 p-3 md:grid-cols-3"><input className={inputClass} placeholder="کلیلی ڕێکخستن" value={key} onChange={(e) => setKey(e.target.value)} /><input className={inputClass} placeholder="بەها" value={value} onChange={(e) => setValue(e.target.value)} /><button onClick={saveNew} disabled={create.isPending} className="rounded-sm bg-[#0f4c81] text-xs font-bold text-white">زیادکردن</button></div><div className="border border-gray-200">{isLoading ? <div className="p-8 text-center text-gray-500">لە بارکردندایە...</div> : settings.length === 0 ? <div className="p-8 text-center text-gray-500">هیچ ڕێکخستنێک نییە</div> : settings.map((setting) => <SettingRow key={setting.id} id={setting.id} initialKey={setting.key} initialValue={String(setting.value ?? "")} update={update} />)}</div></div>;
}

function SettingRow({ id, initialKey, initialValue, update }: { id: number; initialKey: string; initialValue: string; update: ReturnType<typeof useUpdateSetting> }) {
  const [key, setKey] = useState(initialKey);
  const [value, setValue] = useState(initialValue);
  return <div className="flex items-center gap-2 border-b border-gray-100 p-3"><input className={`${inputClass} flex-1`} value={key} onChange={(e) => setKey(e.target.value)} /><input className={`${inputClass} flex-1`} value={value} onChange={(e) => setValue(e.target.value)} /><button onClick={() => update.mutate({ id, data: { key, value } }, { onSuccess: () => toast.success("نوێکرایەوە"), onError: () => toast.error("نوێکردنەوە سەرکەوتوو نەبوو") })} className="rounded-sm bg-gray-100 p-2 text-[#0f4c81]" title="پاشەکەوت"><Save className="h-4 w-4" /></button></div>;
}