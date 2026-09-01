import { useListItems } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Zap, Filter, Settings, RefreshCcw, Search, FileWarning, ArrowDownUp, FileText } from "lucide-react";

export default function Items() {
  const { data: items = [], isLoading } = useListItems();

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">کاڵاکان</h1>
        <div></div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 flex-row">
        {/* Right side (Add actions) */}
        <div className="flex items-center gap-2 order-1 ml-auto">
          <button className="flex h-8 items-center gap-1.5 rounded-sm border border-[#00b0f0] bg-white px-3 text-xs font-bold text-[#00b0f0] hover:bg-blue-50">
            <Zap className="h-3.5 w-3.5 text-yellow-500" />
            زیادکردنی خێرا
          </button>
          <Link href="/items/new" className="flex h-8 items-center gap-1.5 rounded-sm bg-[#0f4c81] px-3 text-xs font-medium text-white hover:bg-[#0f4c81]/90">
            <Plus className="h-3.5 w-3.5" />
            زیادکردنی کاڵا
          </Link>
        </div>

        {/* Left side (Search/Filter controls) */}
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
            <FileText className="h-3.5 w-3.5 text-[#00b0f0]" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-end gap-2 px-2 bg-gray-50/50 py-1.5 rounded-sm border border-gray-100">
        <select className="h-7 rounded-sm border border-gray-200 px-2 text-xs text-right text-gray-600 outline-none bg-white">
          <option>Kamal Decorate</option>
        </select>
        <div className="flex items-center gap-1.5">
          <label htmlFor="selectAll" className="text-xs font-medium text-gray-700">هەموو</label>
          <input type="checkbox" id="selectAll" className="h-3.5 w-3.5 rounded-sm border-gray-300" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-[#0f4c81]">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#0f4c81] text-white">
            <tr>
              {["وێنە", "زنجیرە", "جۆری کاڵا", "وردەکاری", "بارکۆد", "کۆد", "نرخی کڕین", "نرخی تاک", "نرخی کۆ", "نرخی تایبەت", "نرخی زیاتر", "دەرخستەی کاڵا"].map((th, i) => (
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
            {items.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
                  <div className="flex items-center justify-center gap-2">
                    هیچ زانیارییەک بەردەست نییە
                    <FileWarning className="h-4 w-4 text-orange-400" />
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                  <td className="px-3 py-2">
                    <div className="h-6 w-6 rounded bg-gray-200"></div>
                  </td>
                  <td className="px-3 py-2">{item.name}</td>
                  <td className="px-3 py-2">{item.category}</td>
                  <td className="px-3 py-2">{item.unit}</td>
                  <td className="px-3 py-2">{item.barcode}</td>
                  <td className="px-3 py-2">{item.id}</td>
                  <td className="px-3 py-2">{item.purchasePrice}</td>
                  <td className="px-3 py-2">{item.salePrice}</td>
                  <td className="px-3 py-2">-</td>
                  <td className="px-3 py-2">-</td>
                  <td className="px-3 py-2">-</td>
                  <td className="px-3 py-2">چالاك</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
