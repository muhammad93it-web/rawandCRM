import { Plus, X, FileWarning, Printer, Settings as SettingsIcon, DollarSign, PieChart, LayoutTemplate, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useCreateCurrency,
  useCreateQuotaRatio,
  useCreateSetting,
  useDeleteQuotaRatio,
  useListCurrencies,
  useListQuotaRatios,
  useListSettings,
  useUpdateSetting,
} from "@workspace/api-client-react";

type TabId = 'partners' | 'currency' | 'capital' | 'system' | 'print';

export default function GeneralConfigurations() {
  const [activeTab, setActiveTab] = useState<TabId>('partners');

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">ڕێکخستنە گشتییەکان</h1>
        <div></div>
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
  const { data: ratios = [], isLoading, refetch } = useListQuotaRatios();
  const createRatio = useCreateQuotaRatio();
  const deleteRatio = useDeleteQuotaRatio();
  const [name, setName] = useState("");
  const [percentage, setPercentage] = useState("");

  const addRatio = () => {
    const value = Number(percentage);
    if (!name.trim() || !Number.isFinite(value) || value < 0 || value > 100) {
      toast.error("ناو و ڕێژەیەکی دروست بنووسە");
      return;
    }
    createRatio.mutate({ data: { name: name.trim(), percentage: value } }, {
      onSuccess: () => {
        setName("");
        setPercentage("");
        void refetch();
        toast.success("ڕێژە زیادکرا");
      },
      onError: () => toast.error("هەڵەیەک ڕوویدا"),
    });
  };

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
              <button onClick={addRatio} disabled={createRatio.isPending} className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#0f4c81] text-white disabled:opacity-50">
                  <Plus className="h-4 w-4" />
                </button>
                <button onClick={() => {
                  const last = ratios.at(-1);
                  if (last) deleteRatio.mutate({ id: last.id }, { onSuccess: () => void refetch() });
                }} className="flex h-7 w-7 items-center justify-center rounded-sm border border-red-200 text-red-500 bg-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </td>
            <td className="px-3 py-1.5">
                <input type="number" value={percentage} onChange={(e) => setPercentage(e.target.value)} className="h-7 w-full rounded-sm border border-gray-200 px-2 text-right outline-none" />
            </td>
            <td className="px-3 py-1.5">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="h-7 w-full rounded-sm border border-gray-200 px-2 text-right outline-none" />
            </td>
          </tr>
          <tr className="bg-[#0f4c81] text-white font-bold">
             <td className="px-3 py-2 text-center" colSpan={2}>ڕێژە (%)</td>
             <td className="px-3 py-2">ناو</td>
          </tr>
            {isLoading ? <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">لە بارکردندایە...</td>
            </tr> : ratios.length === 0 ? <tr>
            <td colSpan={3} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
              <div className="flex items-center justify-center gap-2">
                هیچ زانیارییەک بەردەست نییە
                <FileWarning className="h-4 w-4 text-orange-400" />
              </div>
            </td>
            </tr> : ratios.map((ratio) => <tr key={ratio.id} className="border-b border-gray-100">
              <td className="px-3 py-2 text-center">{ratio.percentage}</td>
              <td className="px-3 py-2">{ratio.name}</td>
              <td className="px-3 py-2 text-left">
                <button onClick={() => deleteRatio.mutate({ id: ratio.id }, { onSuccess: () => void refetch() })} className="text-red-500"><X className="h-4 w-4" /></button>
              </td>
            </tr>)}
        </tbody>
      </table>
    </div>
  );
}

function CurrencyTab() {
  const { data: currencies = [], isLoading, refetch } = useListCurrencies();
  const createCurrency = useCreateCurrency();
  const [code, setCode] = useState("");
  const [currencyName, setCurrencyName] = useState("");
  const [rate, setRate] = useState("");
  const [symbol, setSymbol] = useState("");

  const addCurrency = () => {
    const numericRate = Number(rate);
    if (!code.trim() || !currencyName.trim() || !Number.isFinite(numericRate) || numericRate <= 0) {
      toast.error("کۆد، ناو و نرخ پێویستن");
      return;
    }
    createCurrency.mutate({
      data: { code: code.trim(), name: currencyName.trim(), rate: numericRate, symbol },
    }, {
      onSuccess: () => {
        setCode("");
        setCurrencyName("");
        setRate("");
        setSymbol("");
        void refetch();
        toast.success("دراو زیادکرا");
      },
      onError: () => toast.error("هەڵەیەک ڕوویدا"),
    });
  };

  return (
    <div className="rounded-sm border border-[#0f4c81]">
      <div className="grid grid-cols-5 gap-2 border-b border-gray-100 p-3 text-xs">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="کۆد" className="h-8 rounded-sm border border-gray-200 px-2 text-right" />
        <input value={currencyName} onChange={(e) => setCurrencyName(e.target.value)} placeholder="ناو" className="h-8 rounded-sm border border-gray-200 px-2 text-right" />
        <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" placeholder="نرخ" className="h-8 rounded-sm border border-gray-200 px-2 text-right" />
        <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="هێما" className="h-8 rounded-sm border border-gray-200 px-2 text-right" />
        <button onClick={addCurrency} disabled={createCurrency.isPending} className="h-8 rounded-sm bg-[#0f4c81] text-white disabled:opacity-50">زیادکردن</button>
      </div>
      {isLoading ? <div className="p-10 text-center text-gray-500">لە بارکردندایە...</div> : currencies.length === 0 ? <div className="p-10 text-center font-bold text-gray-800">هیچ زانیارییەک بەردەست نییە</div> : <table className="w-full text-right text-xs">
        <thead><tr className="bg-[#0f4c81] text-white"><th className="p-2">کۆد</th><th className="p-2">ناو</th><th className="p-2">نرخ</th><th className="p-2">هێما</th></tr></thead>
        <tbody>{currencies.map((currency) => <tr key={currency.id} className="border-b border-gray-100"><td className="p-2">{currency.code}</td><td className="p-2">{currency.name}</td><td className="p-2">{currency.rate}</td><td className="p-2">{currency.symbol}</td></tr>)}</tbody>
      </table>}
    </div>
  );
}

function CapitalTab() {
  const { data: settings = [], isLoading } = useListSettings({ module: "accounting" });
  return (
    <div className="p-8 text-center text-gray-500">
      {isLoading ? "لە بارکردندایە..." : settings.length ? "ڕێکخستنەکانی سەرمایە لە API ـەوە خوێندرایەوە." : "هیچ ڕێکخستنێکی سەرمایە بەردەست نییە"}
    </div>
  );
}

function SystemTab() {
  const { data: settings = [], isLoading } = useListSettings({ module: "general" });
  return (
    <div className="p-8 text-center text-gray-500">
      {isLoading ? "لە بارکردندایە..." : settings.length ? "هەڵبژاردنەکانی سیستم لە API ـەوە بەردەستن." : "هیچ هەڵبژاردنێکی سیستم بەردەست نییە"}
    </div>
  );
}

function PrintTab() {
  return (
    <div className="space-y-3">
      <SettingEditor module="general" title="ڕێکخستنی چاپکردنی پسوولەی فرۆشتن" prefix="sales_print" />
      <SettingEditor module="purchase" title="ڕێکخستنی چاپکردنی پسوولەی کڕین" prefix="purchase_print" />
    </div>
  );
}

function SettingEditor({ module, title, prefix }: { module: "general" | "purchase"; title: string; prefix: string }) {
  const { data: settings = [], isLoading, refetch } = useListSettings({ module });
  const create = useCreateSetting();
  const update = useUpdateSetting();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const relevant = settings.filter((setting) => setting.key.startsWith(prefix));
  const add = () => {
    if (!key.trim()) { toast.error("کلیلی ڕێکخستن پێویستە"); return; }
    create.mutate({ data: { module, key: `${prefix}_${key.trim()}`, value } }, { onSuccess: () => { setKey(""); setValue(""); void refetch(); toast.success("ڕێکخستن پاشەکەوتکرا"); }, onError: () => toast.error("هەڵەیەک ڕوویدا") });
  };
  return <div className="overflow-hidden rounded-sm border border-gray-200"><div className="bg-gray-50 p-3 text-sm font-bold text-gray-800">{title}</div><div className="grid grid-cols-1 gap-2 border-b border-gray-100 p-3 md:grid-cols-3"><input className="h-8 rounded-sm border border-gray-200 px-2 text-right text-xs" placeholder="ناوی بژاردە" value={key} onChange={(e) => setKey(e.target.value)} /><input className="h-8 rounded-sm border border-gray-200 px-2 text-right text-xs" placeholder="بەها" value={value} onChange={(e) => setValue(e.target.value)} /><button onClick={add} disabled={create.isPending} className="h-8 rounded-sm bg-[#0f4c81] text-xs font-bold text-white">زیادکردن</button></div>{isLoading ? <div className="p-6 text-center text-xs text-gray-500">لە بارکردندایە...</div> : relevant.length === 0 ? <div className="p-6 text-center text-xs text-gray-500">هیچ ڕێکخستنێک نییە؛ لە سەرەوە زیاد بکە.</div> : relevant.map((setting) => <PrintSettingRow key={setting.id} setting={setting} update={update} refetch={refetch} />)}</div>;
}

function PrintSettingRow({ setting, update, refetch }: { setting: { id: number; key: string; value: unknown }; update: ReturnType<typeof useUpdateSetting>; refetch: () => Promise<unknown> }) {
  const [value, setValue] = useState(String(setting.value ?? ""));
  return <div className="flex items-center gap-2 border-b border-gray-100 p-3"><span className="w-1/3 text-xs text-gray-600">{setting.key}</span><input className="h-8 flex-1 rounded-sm border border-gray-200 px-2 text-right text-xs" value={value} onChange={(e) => setValue(e.target.value)} /><button onClick={() => update.mutate({ id: setting.id, data: { value } }, { onSuccess: () => { void refetch(); toast.success("نوێکرایەوە"); } })} className="h-8 rounded-sm bg-gray-100 px-3 text-xs font-bold text-[#0f4c81]">پاشەکەوت</button></div>;
}
