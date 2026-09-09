import { useState } from "react";
import { toast } from "sonner";
import { useCreateWorkplace, useListWorkplaces } from "@workspace/api-client-react";
import { Plus, Filter, Settings, RefreshCcw, Search, FileWarning, ArrowDownUp } from "lucide-react";
import { getApiError } from "@/lib/api-error";

export default function Workplaces() {
  const { data: workplaces = [], isLoading, refetch } = useListWorkplaces();
  const createWorkplace = useCreateWorkplace();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [currency, setCurrency] = useState("IQD");

  const addWorkplace = () => {
    if (!name.trim() || !code.trim() || !currency.trim()) {
      toast.error("ناو، کۆد و دراو پێویستن");
      return;
    }
    createWorkplace.mutate({ data: { name, code, currency } }, {
      onSuccess: () => {
        setName("");
        setCode("");
        void refetch();
        toast.success("شوێنکار بە سەرکەوتوویی زیادکرا");
      },
      onError: (err) => toast.error(getApiError(err)),
    });
  };

  return (
    <div dir="rtl" className="pb-10">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-bold text-gray-800">شوێنکارەکان</h1>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-sm border border-[#deecf9]">
        {/* Right side in RTL (Form) */}
        <div className="flex items-center gap-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="ناو" className="crm-dense-input w-48" />
          <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="کۆد" className="crm-dense-input w-24" />
          <input value={currency} onChange={(event) => setCurrency(event.target.value)} placeholder="دراو" className="crm-dense-input w-24" />
          <button onClick={addWorkplace} disabled={createWorkplace.isPending} className="flex h-[28px] items-center gap-1.5 rounded-sm bg-[#0f4c81] px-4 text-xs font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            زیادکردنی شوێنکار
          </button>
        </div>

        {/* Left side in RTL (Toolbar) */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="گەڕان"
              className="crm-dense-input w-48 pr-8"
            />
            <Search className="absolute right-2 top-1.5 h-4 w-4 text-gray-400" />
          </div>
          <button className="flex h-[28px] items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Filter className="h-3.5 w-3.5 text-[#00b0f0]" />
            جیاکردنەوە
          </button>
          <button className="flex h-[28px] w-[28px] items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors">
            <Settings className="h-3.5 w-3.5 text-[#00b0f0]" />
          </button>
          <button onClick={() => void refetch()} className="flex h-[28px] w-[28px] items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors">
            <RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-[#deecf9] bg-white">
        <table className="w-full text-right text-[13px]">
          <thead className="bg-[#0f4c81] text-white">
            <tr>
              {["زنجیرە", "ناوی شوێنکار", "ناونیشان", "ژمارە تەلەفۆن", "کاتی تۆمارکردن"].map((th, i) => (
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
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 bg-white">
                  لە بارکردندایە...
                </td>
              </tr>
            ) : workplaces.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
                  <div className="flex items-center justify-center gap-2">
                    هیچ زانیارییەک بەردەست نییە
                    <FileWarning className="h-4 w-4 text-orange-400" />
                  </div>
                </td>
              </tr>
            ) : (
              workplaces.map((wp) => (
                <tr key={wp.id} className="border-b border-gray-100 hover:bg-[#f8fcff] bg-white transition-colors">
                  <td className="px-3 py-2">{wp.id}</td>
                  <td className="px-3 py-2 font-medium">{wp.name}</td>
                  <td className="px-3 py-2">{wp.address || '-'}</td>
                  <td className="px-3 py-2" dir="ltr">{wp.phone || '-'}</td>
                  <td className="px-3 py-2" dir="ltr">{new Date(wp.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
