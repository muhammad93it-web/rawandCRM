import { Link } from "wouter";
import { Plus, Filter, Settings, RefreshCcw, Search, FileWarning, ArrowDownUp } from "lucide-react";

export default function Workplaces() {
  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">شوێنکارەکان</h1>
        <div></div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 flex-row">
        {/* Right side */}
        <div className="flex items-center gap-2 order-1 ml-auto">
          <button className="flex h-8 items-center gap-1.5 rounded-sm bg-[#0f4c81] px-3 text-xs font-bold text-white hover:bg-[#0f4c81]/90">
            <Plus className="h-3.5 w-3.5" />
            زیادکردنی شوێنکار
          </button>
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
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
                <div className="flex items-center justify-center gap-2">
                  هیچ زانیارییەک بەردەست نییە
                  <FileWarning className="h-4 w-4 text-orange-400" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
