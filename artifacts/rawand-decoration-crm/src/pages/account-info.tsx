import { Link } from "wouter";
import { Plus, Users, Settings, FileText, ChevronLeft } from "lucide-react";

export default function AccountInfo() {
  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">زانیارییەکانی خاوەن حساب</h1>
        <div>
          <Link href="/accounts/new" className="flex items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <Plus className="h-3.5 w-3.5 text-[#00b0f0]" />
            زیادکردنی خاوەن حساب
          </Link>
        </div>
      </div>

      <div className="space-y-1.5">
        <Link href="/accounts" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">خاوەن حسابەکان</span>
            <Users className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
        
        <Link href="/accountconfiguration" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">ڕێکخستنی پۆلێنەکان</span>
            <Settings className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
        
        <Link href="/reportaccounts" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">ڕاپۆرتی خاوەن حساب</span>
            <FileText className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
