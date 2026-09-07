import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Printer, Search, Building2, Calendar, Scale, Receipt, FileText, ArrowUpRight, ArrowDownRight, CreditCard, LineChart, Users } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  const todayStr = format(new Date(), "MM/dd/yyyy");
  const monthAgoStr = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "MM/dd/yyyy");

  return (
    <div className="">
      
      {/* Tabs */}
      <div className="flex justify-start mb-6 border-b border-gray-100">
        <div className="flex">
          <button className="px-4 py-2.5 text-[13px] font-bold text-[#00b0f0] border-b-2 border-[#00b0f0] bg-blue-50/50">هێڵکارییەکان</button>
          <button className="px-4 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-800">پوختەی کاڵاکان</button>
          <button className="px-4 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-800">قەرزی خاوەن حساب</button>
          <button className="px-4 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-800">کارەکان</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        
        {/* Form controls on the right */}
        <div className="flex items-center gap-3 flex-wrap justify-start">
          <button className="h-8 w-8 flex items-center justify-center border border-red-200 text-red-500 rounded-sm hover:bg-red-50">
            <Printer className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 flex items-center justify-center bg-[#0f4c81] text-white rounded-sm hover:bg-blue-800">
            <Search className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <input type="text" defaultValue={todayStr} className="h-8 w-32 rounded-sm border border-gray-200 px-2 text-xs text-right bg-white outline-none focus:border-[#0f4c81]" />
              <Calendar className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500">-</span>
            <div className="relative">
              <input type="text" defaultValue={monthAgoStr} className="h-8 w-32 rounded-sm border border-gray-200 px-2 text-xs text-right bg-white outline-none focus:border-[#0f4c81]" />
              <Calendar className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
            </div>
            <label className="text-xs font-bold text-gray-700 ml-1">لە بەرواری</label>
          </div>

          <div className="flex items-center gap-1.5">
            <select className="h-8 w-32 rounded-sm border border-gray-200 px-2 text-xs text-right bg-white outline-none">
              <option>هەموو</option>
            </select>
            <label className="text-xs font-bold text-gray-700 ml-1">شوێنکار</label>
          </div>
        </div>

        {/* Utilities on the left */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <input type="radio" id="yearly" name="period" className="h-4 w-4 text-[#0f4c81]" />
            <label htmlFor="yearly" className="text-[13px] text-gray-700 font-medium">ساڵانە</label>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="radio" id="monthly" name="period" className="h-4 w-4 text-[#0f4c81]" />
            <label htmlFor="monthly" className="text-[13px] text-gray-700 font-medium">مانگانە</label>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="radio" id="weekly" name="period" className="h-4 w-4 text-[#0f4c81]" />
            <label htmlFor="weekly" className="text-[13px] text-gray-700 font-medium">هەفتانە</label>
          </div>
          <div className="flex items-center gap-1.5">
            <input type="radio" id="daily" name="period" className="h-4 w-4 text-[#0f4c81]" defaultChecked />
            <label htmlFor="daily" className="text-[13px] text-gray-700 font-medium">ڕۆژانە</label>
          </div>
        </div>

      </div>

      {/* Grid 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
        <MetricCard 
          title="کۆی گشتی باڵانس" 
          icon={<Building2 className="h-5 w-5 text-blue-800" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]}
        />
        <MetricCard 
          title="باڵانسی ئەمڕۆ" 
          icon={<Scale className="h-5 w-5 text-blue-500" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
        <MetricCard 
          title="کۆی گشتی فرۆشتن (پێی وەرگیراو)" 
          icon={<Receipt className="h-5 w-5 text-teal-500" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
        <MetricCard 
          title="کۆی قەرزی فرۆشتن" 
          icon={<FileText className="h-5 w-5 text-teal-500" />} 
          mainValue={summary?.payables?.toString() || "0"} 
        />
        <MetricCard 
          title="کۆی گشتی کڕین (پێی دراو)" 
          icon={<Receipt className="h-5 w-5 text-red-500" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
      </div>

      {/* Grid 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard 
          title="کۆی قەرزی کڕین" 
          icon={<FileText className="h-5 w-5 text-red-400" />} 
          mainValue={summary?.receivables?.toString() || "0"} 
        />
        <MetricCard 
          title="ژمارەی خاوەن حساب" 
          icon={<Users className="h-5 w-5 text-orange-500" />} 
          mainValue={summary?.customersCount?.toString() || "0"} 
        />
        <MetricCard 
          title="کۆی قازانجی فرۆش" 
          icon={<LineChart className="h-5 w-5 text-green-500" />} 
          mainValue="0" 
        />
        <MetricCard 
          title="کۆی گشتی داهات" 
          icon={<ArrowDownRight className="h-5 w-5 text-green-600" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
        <MetricCard 
          title="کۆی خەرجی" 
          icon={<ArrowUpRight className="h-5 w-5 text-red-500" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
      </div>

      {/* Section 2 */}
      <h2 className="text-[17px] font-bold text-gray-800 text-right mb-4">کۆی گشتی قەرز</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <MetricCard 
          title="وەگرتن" 
          icon={<CreditCard className="h-5 w-5 text-green-600" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
        <MetricCard 
          title="گەڕانەوەی قەرزی وەرگیراو" 
          icon={<CreditCard className="h-5 w-5 text-teal-500" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
        <MetricCard 
          title="پێدانی قەرز" 
          icon={<CreditCard className="h-5 w-5 text-red-500" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
        <MetricCard 
          title="گەڕانەوەی قەرزی پێدراو" 
          icon={<CreditCard className="h-5 w-5 text-teal-600" />} 
          mainValue="0" subValues={["IQD 0", "$ 0"]} 
        />
      </div>

    </div>
  );
}

function MetricCard({ title, icon, mainValue, subValues }: { title: string, icon: React.ReactNode, mainValue: string, subValues?: string[] }) {
  return (
    <div className="rounded-sm border border-gray-200 bg-white p-4 flex flex-col h-[110px] relative">
      <div className="flex w-full justify-between items-start mb-2">
        <h3 className="text-[13px] font-bold text-gray-800">{title}</h3>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className="mt-auto flex flex-col items-start w-full">
        <div className="text-xl font-bold text-gray-900">{mainValue}</div>
        {subValues && (
          <div className="flex gap-3 mt-1 text-xs text-gray-500 font-medium">
            {subValues.map((v, i) => <span key={i}>{v}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}
