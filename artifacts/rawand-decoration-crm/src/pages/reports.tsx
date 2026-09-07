import { BarChart3, ChevronLeft } from "lucide-react";
import { Link } from "wouter";
import { reportDefinitions } from "@/pages/report-suite";

export default function Reports() {
  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">ڕاپۆرتەکان</h1>
        <div></div>
      </div>

      <p className="mb-4 text-xs text-gray-500">هەموو ڕاپۆرتەکان بە زانیارییە پاشەکەوتکراوەکانی سیستەم نوێ دەبنەوە.</p>
      <div className="space-y-5" dir="rtl">
        {Array.from(new Set(reportDefinitions.map((report) => report.section))).map((section) => (
          <section key={section}>
            <h2 className="mb-2 text-sm font-bold text-[#0f4c81]">{section}</h2>
            <div className="grid gap-1.5 md:grid-cols-2">
              {reportDefinitions.filter((report) => report.section === section).map((report) => (
                <Link key={report.path} data-testid={`link-report-${report.path.toLowerCase()}`} href={`/${report.path}`} className="flex min-h-12 items-center justify-between rounded-sm border border-gray-100 bg-white px-4 py-2 transition-colors hover:border-[#00b0f0] hover:bg-blue-50/40">
                  <div className="flex items-center gap-3"><BarChart3 className="h-4 w-4 shrink-0 text-[#00b0f0]" /><span className="text-[13px] font-medium text-gray-800">{report.title}</span></div>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-[#00b0f0]" strokeWidth={2.5} />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
