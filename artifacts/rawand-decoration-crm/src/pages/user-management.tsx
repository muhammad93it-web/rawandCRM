import { Link } from "wouter";
import { ChevronLeft, Users, ShieldAlert, KeyRound, Activity } from "lucide-react";

export default function UserManagement() {
  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">بەڕێوەبردنی بەکارهێنەر</h1>
        <div></div>
      </div>

      <div className="space-y-1.5">
        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">بەکارهێنەرەکان</span>
            <Users className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
        
        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">ڕۆڵەکان و دەسەڵاتەکان</span>
            <ShieldAlert className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
        
        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">گۆڕینی وشەی نهێنی</span>
            <KeyRound className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>

        <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
          <div className="flex items-center gap-3">

            <span className="text-[14px] font-medium text-gray-800">چالاکییەکانی بەکارهێنەر</span>
            <Activity className="h-4 w-4 text-[#00b0f0]" />
          
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
