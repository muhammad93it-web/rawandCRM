import { ChevronLeft, BarChart3, LineChart, FileText, ShoppingCart, List, CreditCard, Box, Archive } from "lucide-react";
import { Link } from "wouter";

export default function Reports() {
  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">ڕاپۆرتەکان</h1>
        <div></div>
      </div>

      <div className="space-y-1.5">
        {[
          { name: "ڕاپۆرتی مەخزەن", icon: Box },
          { name: "ڕاپۆرتی خەرجی و داهات", icon: FileText },
          { name: "کەشفی حساب", icon: List },
          { name: "ڕاپۆرتی قەرزەکان", icon: CreditCard },
          { name: "فرۆشتن", icon: FileText },
          { name: "کڕین", icon: ShoppingCart },
          { name: "قازانج", icon: LineChart },
        ].map((item, i) => (
          <Link key={i} href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-3">

              <span className="text-[14px] font-medium text-gray-800">{item.name}</span>
              <item.icon className="h-4 w-4 text-[#00b0f0]" />
            
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
          </Link>
        ))}

        <div className="pt-4 space-y-1.5 border-t border-gray-100 mt-4">
          <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-3">

              <span className="text-[14px] font-medium text-gray-800">ڕاپۆرتی باڵانسی مەخزەن</span>
              <Archive className="h-4 w-4 text-[#00b0f0]" />
            
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
          </Link>
          <Link href="#" className="flex h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 transition-colors hover:bg-gray-50">
            <div className="flex items-center gap-3">

              <span className="text-[14px] font-medium text-gray-800">ڕاپۆرتی مامەڵەی سندوق</span>
              <BarChart3 className="h-4 w-4 text-[#00b0f0]" />
            
          </div>
          <ChevronLeft className="h-4 w-4 text-[#00b0f0]" strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
