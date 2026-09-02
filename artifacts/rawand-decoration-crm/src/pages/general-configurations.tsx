import { Plus, X, FileWarning, Printer, Settings as SettingsIcon, DollarSign, PieChart, LayoutTemplate, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type TabId = 'partners' | 'currency' | 'capital' | 'system' | 'print';

export default function GeneralConfigurations() {
  const [activeTab, setActiveTab] = useState<TabId>('partners');

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <div></div>
        <h1 className="text-xl font-normal text-gray-800">ڕێکخستنە گشتییەکان</h1>
      </div>

      <div className="mb-4 flex border-b border-gray-200 flex-row-reverse">
        <button 
          onClick={() => setActiveTab('print')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'print' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          چاپکردن
        </button>
        <button 
          onClick={() => setActiveTab('system')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'system' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          هەڵبژاردنەکانی سیستم
        </button>
        <button 
          onClick={() => setActiveTab('capital')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'capital' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          سەرمایە
        </button>
        <button 
          onClick={() => setActiveTab('currency')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'currency' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          دراو
        </button>
        <button 
          onClick={() => setActiveTab('partners')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'partners' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          ڕێژەی هاوبەشەکان
        </button>
      </div>

      <div className="bg-white">
        {activeTab === 'partners' && <PartnersTab />}
        {activeTab === 'currency' && <CurrencyTab />}
        {activeTab === 'capital' && <CapitalTab />}
        {activeTab === 'system' && <SystemTab />}
        {activeTab === 'print' && <PrintTab />}
      </div>
    </div>
  );
}

function PartnersTab() {
  return (
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
  );
}

function CurrencyTab() {
  return (
    <div className="flex items-center justify-center p-12 text-gray-500">
      بەشی دراو کار ناکات بەبێ پەیوەندی سێرڤەر (API نەدۆزرایەوە)
    </div>
  );
}

function CapitalTab() {
  return (
    <div className="flex items-center justify-center p-12 text-gray-500">
      بەشی سەرمایە کار ناکات بەبێ پەیوەندی سێرڤەر (API نەدۆزرایەوە)
    </div>
  );
}

function SystemTab() {
  return (
    <div className="flex items-center justify-center p-12 text-gray-500">
      بەشی هەڵبژاردنەکانی سیستم کار ناکات بەبێ پەیوەندی سێرڤەر (API نەدۆزرایەوە)
    </div>
  );
}

function PrintTab() {
  const [openSection, setOpenSection] = useState<string | null>("general");

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  return (
    <div className="space-y-2">
      <div className="border border-gray-200 rounded-sm overflow-hidden">
        <button 
          onClick={() => toggleSection("general")}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-gray-800 font-bold text-sm"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", openSection === "general" ? "rotate-180" : "")} />
          <span>ڕێکخستنە گشتییەکان چاپکردن</span>
        </button>
        {openSection === "general" && (
          <div className="p-4 bg-white border-t border-gray-200">
             <div className="text-gray-500 text-xs text-center">بژاردەکانی چاپکردنی گشتی لێرەدا دەردەکەون (بێ زانیاری API)</div>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-sm overflow-hidden">
        <button 
          onClick={() => toggleSection("sales")}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-gray-800 font-bold text-sm"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", openSection === "sales" ? "rotate-180" : "")} />
          <span>ڕێکخستنی چاپکردنی پسوولەی فرۆشتن</span>
        </button>
        {openSection === "sales" && (
          <div className="p-4 bg-white border-t border-gray-200">
             <div className="text-gray-500 text-xs text-center">بژاردەکانی پسوولەی فرۆشتن لێرەدا دەردەکەون</div>
          </div>
        )}
      </div>

      <div className="border border-gray-200 rounded-sm overflow-hidden">
        <button 
          onClick={() => toggleSection("purchases")}
          className="w-full flex items-center justify-between p-3 bg-gray-50 text-gray-800 font-bold text-sm"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", openSection === "purchases" ? "rotate-180" : "")} />
          <span>ڕێکخستنی چاپکردنی پسوولەی کڕین</span>
        </button>
        {openSection === "purchases" && (
          <div className="p-4 bg-white border-t border-gray-200">
             <div className="text-gray-500 text-xs text-center">بژاردەکانی پسوولەی کڕین لێرەدا دەردەکەون</div>
          </div>
        )}
      </div>
    </div>
  );
}
