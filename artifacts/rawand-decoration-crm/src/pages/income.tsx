import { Filter, Save, X, FileWarning, ArrowDownUp } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateFinancialEntry, useListFinancialEntries, useListWorkplaces } from "@workspace/api-client-react";
import { getApiError } from "@/lib/api-error";

export default function Income() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const { data: entries = [], isLoading, refetch } = useListFinancialEntries({ type: "income" });
  const { data: workplaces = [] } = useListWorkplaces();
  const createEntry = useCreateFinancialEntry();

  const [category, setCategory] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [amountIqd, setAmountIqd] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [rate, setRate] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState(todayStr);
  const [note, setNote] = useState("");

  const reset = () => {
    setCategory("");
    setWorkplaceId("");
    setAmountIqd("");
    setAmountUsd("");
    setRate("");
    setDetails("");
    setDate(todayStr);
    setNote("");
  };

  const handleSave = () => {
    const rawAmount = amountIqd.trim() || amountUsd.trim();
    const amount = Number(rawAmount);
    if (!category.trim() || !rawAmount || !Number.isFinite(amount) || amount < 0 || !date) {
      toast.error("تکایە خانە داواکراوەکان بە دروستی پڕبکەرەوە");
      return;
    }
    createEntry.mutate({
      data: {
        type: "income",
        entryDate: date,
        amount,
        currency: amountIqd.trim() ? "IQD" : "USD",
        category: category.trim(),
        description: [details.trim(), note.trim(), rate.trim() ? `rate: ${rate.trim()}` : ""].filter(Boolean).join(" · "),
        workplaceId: workplaceId ? Number(workplaceId) : null,
        status: "posted",
      },
    }, {
      onSuccess: () => {
        toast.success("بە سەرکەوتوویی پاشەکەوت کرا");
        reset();
        void refetch();
      },
      onError: (err) => toast.error(getApiError(err)),
    });
  };

  return (
    <div dir="rtl" className="pb-10 min-h-screen">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-bold text-gray-800">داهاتەکان</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Form on the right visually in RTL */}
        <div className="w-full lg:w-96 shrink-0 crm-dense-panel self-start">
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div>
              <label className="crm-dense-label">جۆری داهات *</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="crm-dense-select">
                <option value="">جۆری لاوەکی داهات...</option>
                <option value="فرۆشتن">فرۆشتن</option>
                <option value="کرێ">کرێ</option>
                <option value="هەمەجۆر">هەمەجۆر</option>
              </select>
            </div>

            <div>
              <label className="crm-dense-label">شوێنکار</label>
               <select value={workplaceId} onChange={(e) => setWorkplaceId(e.target.value)} className="crm-dense-select">
                 <option value="">شوێنکار</option>
                 {workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="crm-dense-label">بڕ * $</label>
                 <input type="number" value={amountUsd} onChange={(e) => { setAmountUsd(e.target.value); setAmountIqd(""); }} className="crm-dense-input text-left" dir="ltr" disabled={!!amountIqd} />
               </div>
               <div>
                 <label className="crm-dense-label">بڕ (IQD)</label>
                 <input type="number" value={amountIqd} onChange={(e) => { setAmountIqd(e.target.value); setAmountUsd(""); }} className="crm-dense-input text-left" dir="ltr" disabled={!!amountUsd} />
               </div>
            </div>

            <div>
              <label className="crm-dense-label">نرخی دراو (IQD) *</label>
               <input type="text" value={rate} onChange={(e) => setRate(e.target.value)} className="crm-dense-input text-left" dir="ltr" />
            </div>

            <div>
              <label className="crm-dense-label">پ. دەستی</label>
               <input type="text" className="crm-dense-input text-left" dir="ltr" />
            </div>

            <div>
              <label className="crm-dense-label">وردەکاری</label>
              <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} className="crm-dense-input" />
            </div>

            <div>
              <label className="crm-dense-label">بەرواری</label>
               <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="crm-dense-input" />
            </div>

            <div>
              <label className="crm-dense-label">تێبینی</label>
               <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full border border-gray-300 p-2 text-[13px] outline-none focus:border-[#0f4c81] rounded-sm bg-white"></textarea>
            </div>
          </div>

          <div className="flex gap-2 justify-start mt-4">
              <button onClick={handleSave} disabled={createEntry.isPending} className="flex h-[32px] items-center gap-2 rounded-sm bg-[#0f4c81] px-4 font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50 text-xs transition-colors">
               <Save className="h-4 w-4" />
                {createEntry.isPending ? "لە پرۆسەدایە..." : "پاشەکەوت کردن"}
             </button>
              <button onClick={reset} className="flex h-[32px] items-center gap-2 rounded-sm border border-gray-200 bg-white px-4 font-bold text-gray-700 hover:bg-gray-50 text-xs transition-colors">
               <X className="h-4 w-4 text-red-500" />
               پاشگەزبوونەوە
             </button>
          </div>
        </div>

        {/* Table on the left visually */}
        <div className="flex-1">
          <div className="mb-4">
              <button onClick={() => void refetch()} className="flex h-[28px] items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
              <Filter className="h-3.5 w-3.5 text-[#00b0f0]" />
              جیاکردنەوە
            </button>
          </div>

          <div className="overflow-x-auto rounded-sm border border-[#deecf9] bg-white">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-[#0f4c81] text-white">
                <tr>
                  {["جۆری داهات", "شوێنکار", "پ. دەستی", "بڕ ($)", "بڕ (IQD)", "وردەکاری", "کاتی تۆمارکردن"].map((th, i) => (
                    <th key={i} className="px-3 py-2.5 font-bold whitespace-nowrap">
                      <div className="flex items-center justify-start gap-1">
                        {th}
                        <ArrowDownUp className="h-3 w-3 opacity-50" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">لە بارکردندایە...</td></tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-800 font-bold">
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                           هیچ زانیارییەک بەردەست نییە
                           <FileWarning className="h-5 w-5 text-orange-400" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-gray-100 hover:bg-[#f8fcff] transition-colors">
                    <td className="px-3 py-2.5">{entry.category}</td>
                    <td className="px-3 py-2.5">{workplaces.find(w => w.id === entry.workplaceId)?.name ?? (entry.workplaceId ?? "-")}</td>
                    <td className="px-3 py-2.5">-</td>
                    <td className="px-3 py-2.5" dir="ltr">{entry.currency === "USD" ? entry.amount : "-"}</td>
                    <td className="px-3 py-2.5" dir="ltr">{entry.currency === "IQD" ? entry.amount : "-"}</td>
                    <td className="px-3 py-2.5 truncate max-w-[150px]" title={entry.description || ""}>{entry.description || "-"}</td>
                    <td className="px-3 py-2.5" dir="ltr">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
