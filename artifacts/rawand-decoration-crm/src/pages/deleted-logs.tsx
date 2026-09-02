import { useListDeletedRecords, useRestoreDeletedRecord } from "@workspace/api-client-react";
import { ChevronLeft, FileX, Trash2, Search, Filter, RefreshCcw, FileWarning, ArrowDownUp, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function DeletedLogs() {
  const [activeTab, setActiveTab] = useState<'menu' | 'records'>('menu');
  const { data: records = [], isLoading, refetch } = useListDeletedRecords({ resource: "accounts" }); // Using accounts as default
  const restoreRecord = useRestoreDeletedRecord();

  const handleRestore = (id: number, resource: string) => {
    restoreRecord.mutate({ id, resource: resource as any }, {
      onSuccess: () => {
        toast.success("بە سەرکەوتوویی گەڕێنرایەوە");
        refetch();
      },
      onError: () => {
        toast.error("هەڵەیەک ڕوویدا یان کردارەکە پشتگیری ناکرێت");
      }
    });
  };

  if (activeTab === 'records') {
    return (
      <div className="">
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
          <button 
            onClick={() => setActiveTab('menu')}
            className="text-xs font-bold text-gray-500 hover:text-gray-800"
          >
            گەڕانەوە
          </button>
          <h1 className="text-xl font-normal text-gray-800">زانیارییە سڕاوەکان - هەموو</h1>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 flex-row">
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
            <button onClick={() => refetch()} className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-sm border border-[#0f4c81] mt-4">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0f4c81] text-white">
              <tr>
                {["کردار", "ڕێکەوتی سڕینەوە", "جۆر", "زنجیرەی زانیاری"].map((th, i) => (
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
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 bg-white">
                    لە بارکردندایە...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
                    <div className="flex items-center justify-center gap-2">
                      هیچ زانیارییەک بەردەست نییە
                      <FileWarning className="h-4 w-4 text-orange-400" />
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                    <td className="px-3 py-2">
                      <button 
                        onClick={() => handleRestore(r.id, r.resource)}
                        disabled={restoreRecord.isPending && restoreRecord.variables?.id === r.id}
                        className={cn(
                          "flex h-7 items-center justify-center gap-1 rounded bg-[#0f4c81] px-2 text-white hover:bg-blue-800",
                          restoreRecord.isPending && restoreRecord.variables?.id === r.id ? "opacity-50" : ""
                        )}
                      >
                        <RefreshCw className="h-3 w-3" />
                        گەڕاندنەوە
                      </button>
                    </td>
                    <td className="px-3 py-2" dir="ltr">{new Date(r.deletedAt).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.resource}</td>
                    <td className="px-3 py-2">{r.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">زانیارییە سڕاوەکان</h1>
        <div></div>
      </div>

      <div className="space-y-1.5">
        <button onClick={() => setActiveTab('records')} className="w-full flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-gray-800">خەرجییە سڕاوەکان</span>
            <FileX className="h-4 w-4 text-[#00b0f0]" />
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </button>
        
        <button onClick={() => setActiveTab('records')} className="w-full flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-gray-800">داهاتە سڕاوەکان</span>
            <FileX className="h-4 w-4 text-[#00b0f0]" />
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </button>
        
        <button onClick={() => setActiveTab('records')} className="w-full flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-gray-800">پسوولە سڕاوەکانی کڕین</span>
            <Trash2 className="h-4 w-4 text-[#00b0f0]" />
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </button>

        <button onClick={() => setActiveTab('records')} className="w-full flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-gray-800">کڕینە سڕاوەکان</span>
            <Trash2 className="h-4 w-4 text-[#00b0f0]" />
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </button>

        <button onClick={() => setActiveTab('records')} className="w-full flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-gray-800">پسوولە سڕاوەکانی فرۆشتن</span>
            <Trash2 className="h-4 w-4 text-[#00b0f0]" />
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </button>

        <button onClick={() => setActiveTab('records')} className="w-full flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">
            <span className="text-[14px] font-medium text-gray-800">فرۆشتنە سڕاوەکان</span>
            <Trash2 className="h-4 w-4 text-[#00b0f0]" />
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
