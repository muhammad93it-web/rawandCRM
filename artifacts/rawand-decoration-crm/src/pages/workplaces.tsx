import { useState } from "react";
import { toast } from "sonner";
import { useCreateWorkplace, useListWorkplaces } from "@workspace/api-client-react";
import { Plus, Filter, Settings, RefreshCcw, Search, FileWarning, ArrowDownUp } from "lucide-react";

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
      onSuccess: () => { setName(""); setCode(""); void refetch(); toast.success("شوێنکار زیادکرا"); },
      onError: () => toast.error("شوێنکار زیاد نەکرا"),
    });
  };

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <div></div>
        <h1 className="text-xl font-normal text-gray-800">شوێنکارەکان</h1>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 flex-row">
        {/* Right side */}
        <div className="flex items-center gap-2 order-1 ml-auto">
          <button onClick={addWorkplace} disabled={createWorkplace.isPending} className="flex h-8 items-center gap-1.5 rounded-sm bg-[#0f4c81] px-3 text-xs font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50">
            <Plus className="h-3.5 w-3.5" />
            زیادکردنی شوێنکار
          </button>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="ناو" className="h-8 w-32 border border-gray-200 px-2 text-right text-xs" />
          <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="کۆد" className="h-8 w-24 border border-gray-200 px-2 text-right text-xs" />
          <input value={currency} onChange={(event) => setCurrency(event.target.value)} placeholder="دراو" className="h-8 w-20 border border-gray-200 px-2 text-right text-xs" />
        </div>

        {/* Left side */}
        <div className="flex items-center gap-1.5 order-2 mr-auto">
          <button className="flex h-8 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5 text-[#00b0f0]" />
            جیاکردنەوە
          </button>
          <div className="relative">
            <input 
              type="text" 
              placeholder="گەڕان" 
              className="h-8 w-48 rounded-sm border border-gray-200 bg-white pl-2 pr-7 text-xs text-right focus:border-[#0f4c81] focus:outline-none"
            />
            <Search className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400" />
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
            <Settings className="h-3.5 w-3.5 text-[#00b0f0]" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
            <RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-[#0f4c81] mt-4">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#0f4c81] text-white">
            <tr>
              {["کاتی تۆمارکردن", "ژمارە تەلەفۆن", "ناونیشان", "ناوی شوێنکار", "زنجیرە"].map((th, i) => (
                <th key={i} className="px-3 py-2 font-medium whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <ArrowDownUp className="h-3 w-3 opacity-50" />
                    {th}
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
                <tr key={wp.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                  <td className="px-3 py-2" dir="ltr">{new Date(wp.createdAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{wp.phone || '-'}</td>
                  <td className="px-3 py-2">{wp.address || '-'}</td>
                  <td className="px-3 py-2">{wp.name}</td>
                  <td className="px-3 py-2">{wp.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
