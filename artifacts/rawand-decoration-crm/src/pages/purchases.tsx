import { Link } from "wouter";
import { Plus, ChevronLeft, FileText, ShoppingCart, ListCollapse, Settings } from "lucide-react";

export default function Purchases() {
  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">کڕین</h1>
        <div></div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
          <Link href="/purchases/new" className="flex h-9 items-center justify-center gap-1.5 rounded-sm border border-gray-200 bg-white px-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
            <Plus className="h-3.5 w-3.5 text-[#00b0f0]" />
            زیادکردنی پسوولەی کڕین
          </Link>
          <button className="flex h-9 items-center justify-center gap-1.5 rounded-sm border border-gray-200 bg-white px-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
            <Plus className="h-3.5 w-3.5 text-[#00b0f0]" />
            زیادکردنی پسوولەی گەڕانەوە
          </button>
          <button className="flex h-9 items-center justify-center gap-1.5 rounded-sm border border-gray-200 bg-white px-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
            <Plus className="h-3.5 w-3.5 text-[#00b0f0]" />
            زیادکردنی پسوولەی پارەدان
          </button>
          <button className="flex h-9 items-center justify-center gap-1.5 rounded-sm border border-gray-200 bg-white px-2 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
            <Plus className="h-3.5 w-3.5 text-[#00b0f0]" />
            زیادکردنی داواکاری کڕین
          </button>
      </div>

      <div className="space-y-1.5 mt-6">
        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">پسوولەکانی کڕین</span>
            <FileText className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
        
        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">داواکاری کڕین</span>
            <ShoppingCart className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
        
        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">قەرزی کۆنی خاوەن حساب</span>
            <ListCollapse className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>

        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">کێشە</span>
            <Settings className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
