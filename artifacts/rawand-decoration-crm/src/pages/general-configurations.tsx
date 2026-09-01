import { Plus, X, FileWarning } from "lucide-react";

export default function GeneralConfigurations() {
  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">ڕێکخستنە گشتییەکان</h1>
        <div></div>
      </div>

      <div className="mb-4 flex border-b border-gray-200">
        <button className="flex-1 border-b-2 border-transparent py-2.5 text-center text-[13px] font-bold text-gray-500 hover:text-gray-800">چاپکردن</button>
        <button className="flex-1 border-b-2 border-transparent py-2.5 text-center text-[13px] font-bold text-gray-500 hover:text-gray-800">هەڵبژاردنەکانی سیستم</button>
        <button className="flex-1 border-b-2 border-transparent py-2.5 text-center text-[13px] font-bold text-gray-500 hover:text-gray-800">سەرمایە</button>
        <button className="flex-1 border-b-2 border-transparent py-2.5 text-center text-[13px] font-bold text-gray-500 hover:text-gray-800">دراو</button>
        <button className="flex-1 border-b-2 border-[#00b0f0] py-2.5 text-center text-[13px] font-bold text-[#00b0f0]">ڕێژەی هاوبەشەکان</button>
      </div>

      <div className="rounded-sm border border-[#0f4c81]">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-white">
               <th className="px-3 py-2 font-medium text-gray-600"></th>
               <th className="px-3 py-2 font-medium text-gray-600">ڕێژە (%)</th>
               <th className="px-3 py-2 font-medium text-gray-600">ناو *</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-white border-b border-gray-100">
              <td className="px-3 py-1.5">
                <div className="flex items-center gap-1 justify-end">
                  <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#0f4c81] text-white">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-sm border border-red-200 text-red-500 bg-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </td>
              <td className="px-3 py-1.5">
                <input type="number" defaultValue="0" className="h-7 w-full rounded-sm border border-gray-200 px-2 text-right outline-none" />
              </td>
              <td className="px-3 py-1.5">
                <input type="text" className="h-7 w-full rounded-sm border border-gray-200 px-2 text-right outline-none" />
              </td>
            </tr>
            <tr className="bg-[#0f4c81] text-white font-bold">
               <td className="px-3 py-2 text-center" colSpan={2}>ڕێژە (%)</td>
               <td className="px-3 py-2">ناو</td>
            </tr>
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
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
