import { format } from "date-fns";
import { Link } from "wouter";
import { ChevronRight, Plus, X } from "lucide-react";

export default function PurchasesNew() {
  const todayStr = format(new Date(), "MM/dd/yyyy");

  return (
    <div className="rounded-lg bg-white p-6 shadow-sm min-h-[calc(100vh-80px)]">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
        <div></div>
        <h1 className="text-3xl font-bold text-gray-800">زیادکردنی پسوولەی کڕین</h1>
      </div>

      <div className="rounded-md border border-gray-100 p-6 bg-white mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">مۆبایل</label>
            <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">وەرگر</label>
            <div className="flex items-center">
              <button className="flex h-10 w-10 items-center justify-center rounded-l border border-gray-200 bg-white">
                 <X className="h-4 w-4 text-red-500" />
              </button>
              <select className="h-10 flex-1 border-y border-gray-200 px-3 bg-white outline-none">
                <option>ڕاستەوخۆ</option>
              </select>
              <button className="flex h-10 w-10 items-center justify-center rounded-r border border-gray-200 bg-gray-50">
                 <Plus className="h-4 w-4 text-[#0f4c81]" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">خاوەن حساب *</label>
            <div className="flex items-center">
              <button className="flex h-10 w-10 items-center justify-center rounded-l border border-gray-200 bg-white">
                 <X className="h-4 w-4 text-red-500" />
              </button>
              <select className="h-10 flex-1 border-y border-gray-200 px-3 bg-white outline-none">
                <option>ڕاستەوخۆ</option>
              </select>
              <button className="flex h-10 w-10 items-center justify-center rounded-r border border-gray-200 bg-gray-50">
                 <Plus className="h-4 w-4 text-[#0f4c81]" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">جۆر *</label>
            <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
              <option>کاش</option>
            </select>
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">شوێنکار</label>
            <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
              <option>Kamal Decorate</option>
            </select>
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">ناونیشان</label>
            <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">شۆفێر</label>
            <div className="flex items-center">
              <select className="h-10 flex-1 rounded-l border border-gray-200 px-3 bg-white outline-none">
                <option>شۆفێر</option>
              </select>
              <button className="flex h-10 w-10 items-center justify-center rounded-r border border-gray-200 bg-gray-50 border-l-0">
                 <Plus className="h-4 w-4 text-[#0f4c81]" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">بەروار</label>
            <input type="text" defaultValue={todayStr} className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">پ. دەستی</label>
            <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="flex flex-col text-right">
             <label className="mb-2 text-sm font-bold text-gray-700">تێبینی</label>
             <textarea rows={2} className="rounded border border-gray-200 p-3 text-right outline-none focus:border-[#0f4c81]"></textarea>
           </div>
           
           <div className="flex flex-col text-right">
             <label className="mb-2 text-sm font-bold text-gray-700">نرخی دراو (IQD) *</label>
             <input type="text" defaultValue="154,000" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
           </div>
        </div>
      </div>

      <div className="flex justify-start border-t border-gray-100 pt-4 mt-6">
        <Link href="/purchases" className="flex h-10 items-center gap-2 rounded bg-[#0f4c81] px-6 font-bold text-white hover:bg-[#0f4c81]/90">
          <ChevronRight className="h-5 w-5" />
          دواتر
        </Link>
      </div>
    </div>
  );
}
