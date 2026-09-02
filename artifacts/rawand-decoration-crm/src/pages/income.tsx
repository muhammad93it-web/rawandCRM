import { Filter, Save, X, FileWarning, ArrowDownUp } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { useCreateFinancialEntry, useListFinancialEntries, useListWorkplaces } from "@workspace/api-client-react";

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
      onError: () => toast.error("هەڵەیەک ڕوویدا لە پاشەکەوتکردن"),
    });
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm min-h-[calc(100vh-80px)]">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
        <div></div>
        <h1 className="text-3xl font-bold text-gray-800">داهاتەکان</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Form on the right visually in RTL */}
        <div className="w-full lg:w-96 shrink-0 rounded-md border border-gray-100 p-4 bg-white self-start">
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">جۆری داهات *</label>
               <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>جۆری لاوەکی داهات...</option>
              </select>
            </div>

            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">شوێنکار</label>
               <select value={workplaceId} onChange={(e) => setWorkplaceId(e.target.value)} className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                 <option value="">شوێنکار</option>
                 {workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="flex flex-col text-right">
                 <label className="mb-1 text-sm font-bold text-gray-700">بڕ (IQD)</label>
                 <input type="number" value={amountIqd} onChange={(e) => setAmountIqd(e.target.value)} className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
               </div>
               <div className="flex flex-col text-right">
                 <label className="mb-1 text-sm font-bold text-gray-700">بڕ * $</label>
                 <input type="number" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
               </div>
            </div>

            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">نرخی دراو (IQD) *</label>
               <input type="text" value={rate} onChange={(e) => setRate(e.target.value)} className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>

            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">پ. دەستی</label>
               <input type="text" value={details} onChange={(e) => setDetails(e.target.value)} className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>

            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">وردەکاری</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>

            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">بەرواری</label>
               <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>

            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">تێبینی</label>
               <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="rounded border border-gray-200 p-3 text-right outline-none focus:border-[#0f4c81]"></textarea>
            </div>
          </div>

          <div className="flex gap-2 justify-start mt-4">
              <button onClick={handleSave} disabled={createEntry.isPending} className="flex h-10 items-center gap-2 rounded bg-[#0f4c81] px-4 font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50">
               <Save className="h-4 w-4" />
                {createEntry.isPending ? "لە پرۆسەدایە..." : "پاشەکەوت کردن"}
             </button>
              <button onClick={reset} className="flex h-10 items-center gap-2 rounded border border-gray-200 bg-white px-4 font-bold text-gray-700 hover:bg-gray-50">
               <X className="h-4 w-4 text-red-500" />
               پاشگەزبوونەوە
             </button>
          </div>
        </div>

        {/* Table on the left visually */}
        <div className="flex-1">
          <div className="mb-4">
              <button onClick={() => void refetch()} className="flex h-9 items-center gap-2 rounded border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Filter className="h-4 w-4 text-[#00b0f0]" />
              جیاکردنەوە
            </button>
          </div>

          <div className="overflow-x-auto rounded-md border border-gray-100">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#0f4c81] text-white">
                <tr>
                  {["کاتی تۆمارکردن", "وردەکاری", "بڕ (IQD)", "بڕ ($)", "پ. دەستی", "شوێنکار", "جۆری داهات"].map((th, i) => (
                    <th key={i} className="px-4 py-3 font-bold whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <ArrowDownUp className="h-3 w-3 opacity-50" />
                        {th}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">لە بارکردندایە...</td></tr> : entries.length === 0 ? <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-800 font-bold">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                         هیچ زانیارییەک بەردەست نییە
                         <FileWarning className="h-5 w-5 text-orange-400" />
                      </div>
                      <div className="flex gap-8 text-lg text-[#0f4c81]">
                         <div>بڕ: {entries.length}</div>
                         <div>بڕ ($): {entries.filter((entry) => entry.currency === "USD").reduce((sum, entry) => sum + entry.amount, 0)}</div>
                         <div>بڕ (IQD): {entries.filter((entry) => entry.currency === "IQD").reduce((sum, entry) => sum + entry.amount, 0)}</div>
                      </div>
                    </div>
                  </td>
                </tr> : entries.map((entry) => <tr key={entry.id} className="border-b border-gray-100">
                  <td className="px-4 py-3">{new Date(entry.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{entry.description || "-"}</td>
                  <td className="px-4 py-3">{entry.currency === "IQD" ? entry.amount : "-"}</td>
                  <td className="px-4 py-3">{entry.currency === "USD" ? entry.amount : "-"}</td>
                  <td className="px-4 py-3">-</td>
                  <td className="px-4 py-3">{entry.workplaceId ?? "-"}</td>
                  <td className="px-4 py-3">{entry.category}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
