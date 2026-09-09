import { Plus, X, FileWarning, Printer, Settings as SettingsIcon, DollarSign, PieChart, LayoutTemplate, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getApiError } from "@/lib/api-error";
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
    <div dir="rtl" className="pb-10 min-h-screen">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-bold text-gray-800">ڕێکخستنە گشتییەکان</h1>
      </div>

      <div className="mb-4 flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('partners')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'partners' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          ڕێژەی هاوبەشەکان
        </button>
        <button
          onClick={() => setActiveTab('currency')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'currency' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          دراو
        </button>
        <button
          onClick={() => setActiveTab('capital')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'capital' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          سەرمایە
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'system' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          هەڵبژاردنەکانی سیستم
        </button>
        <button
          onClick={() => setActiveTab('print')}
          className={cn("flex-1 py-2.5 text-center text-[13px] font-bold transition-colors", activeTab === 'print' ? "border-b-2 border-[#00b0f0] text-[#00b0f0]" : "border-b-2 border-transparent text-gray-500 hover:text-gray-800")}
        >
          چاپکردن
        </button>
      </div>

      <div className="bg-transparent">
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
        toast.success("ڕێژە بە سەرکەوتوویی زیادکرا");
      },
      onError: (err) => toast.error(getApiError(err)),
    });
  };

  return (
    <div className="rounded-sm border border-[#deecf9] bg-white">
      <table className="w-full text-right text-[13px]">
        <thead>
          <tr className="bg-[#f8fcff] border-b border-gray-200">
             <th className="px-3 py-2.5 font-bold text-gray-600 w-1/2">ناو *</th>
             <th className="px-3 py-2.5 font-bold text-gray-600 w-1/3">ڕێژە (%)</th>
             <th className="px-3 py-2.5 font-bold text-gray-600"></th>
          </tr>
        </thead>
        <tbody>
          <tr className="bg-[#f8fcff] border-b border-[#deecf9]">
            <td className="px-3 py-2">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="crm-dense-input" placeholder="ناوی هاوبەش" />
            </td>
            <td className="px-3 py-2">
                <input type="number" value={percentage} onChange={(e) => setPercentage(e.target.value)} className="crm-dense-input text-left" dir="ltr" placeholder="0" />
            </td>
            <td className="px-3 py-2">
              <div className="flex items-center gap-1 justify-end">
                <button onClick={addRatio} disabled={createRatio.isPending} className="flex h-[28px] w-[28px] items-center justify-center rounded-sm bg-[#0f4c81] text-white disabled:opacity-50 hover:bg-[#0f4c81]/90 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
                <button onClick={() => {
                  const last = ratios.at(-1);
                  if (last) deleteRatio.mutate({ id: last.id }, { onSuccess: () => void refetch(), onError: (err) => toast.error(getApiError(err)) });
                }} className="flex h-[28px] w-[28px] items-center justify-center rounded-sm border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
          <tr className="bg-[#0f4c81] text-white font-bold">
             <td className="px-3 py-2.5">ناو</td>
             <td className="px-3 py-2.5 text-center">ڕێژە (%)</td>
             <td className="px-3 py-2.5"></td>
          </tr>
          {isLoading ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-500">لە بارکردندایە...</td>
            </tr>
          ) : ratios.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
                <div className="flex items-center justify-center gap-2">
                  هیچ زانیارییەک بەردەست نییە
                  <FileWarning className="h-4 w-4 text-orange-400" />
                </div>
              </td>
            </tr>
          ) : ratios.map((ratio) => (
            <tr key={ratio.id} className="border-b border-gray-100 hover:bg-[#f8fcff] transition-colors">
              <td className="px-3 py-2.5">{ratio.name}</td>
              <td className="px-3 py-2.5 text-center font-bold" dir="ltr">{ratio.percentage}%</td>
              <td className="px-3 py-2.5 text-left">
                <button onClick={() => deleteRatio.mutate({ id: ratio.id }, { onSuccess: () => void refetch(), onError: (err) => toast.error(getApiError(err)) })} className="text-red-500 hover:text-red-700 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
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
        toast.success("دراو بە سەرکەوتوویی زیادکرا");
      },
      onError: (err) => toast.error(getApiError(err)),
    });
  };

  return (
    <div className="rounded-sm border border-[#deecf9] bg-white">
      <div className="grid grid-cols-5 gap-2 border-b border-[#deecf9] bg-[#f8fcff] p-3 text-[13px]">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="کۆد" className="crm-dense-input text-left" dir="ltr" />
        <input value={currencyName} onChange={(e) => setCurrencyName(e.target.value)} placeholder="ناو" className="crm-dense-input" />
        <input value={rate} onChange={(e) => setRate(e.target.value)} type="number" placeholder="نرخ" className="crm-dense-input text-left" dir="ltr" />
        <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="هێما" className="crm-dense-input text-center" />
        <button onClick={addCurrency} disabled={createCurrency.isPending} className="h-[28px] rounded-sm bg-[#0f4c81] font-bold text-white disabled:opacity-50 hover:bg-[#0f4c81]/90 transition-colors">زیادکردن</button>
      </div>
      {isLoading ? <div className="p-10 text-center text-gray-500">لە بارکردندایە...</div> : currencies.length === 0 ? <div className="p-10 text-center font-bold text-gray-800">هیچ زانیارییەک بەردەست نییە</div> : <table className="w-full text-right text-[13px]">
        <thead><tr className="bg-[#0f4c81] text-white"><th className="p-2.5 font-bold">کۆد</th><th className="p-2.5 font-bold">ناو</th><th className="p-2.5 font-bold">نرخ</th><th className="p-2.5 font-bold">هێما</th></tr></thead>
        <tbody>{currencies.map((currency) => <tr key={currency.id} className="border-b border-gray-100 hover:bg-[#f8fcff] transition-colors"><td className="p-2.5" dir="ltr">{currency.code}</td><td className="p-2.5">{currency.name}</td><td className="p-2.5" dir="ltr">{currency.rate}</td><td className="p-2.5">{currency.symbol}</td></tr>)}</tbody>
      </table>}
    </div>
  );
}

function CapitalTab() {
  const { data: settings = [], isLoading } = useListSettings({ module: "accounting" });
  return (
    <div className="p-8 text-center text-gray-500 crm-dense-panel">
      {isLoading ? "لە بارکردندایە..." : settings.length ? "ڕێکخستنەکانی سەرمایە لە API ـەوە خوێندرایەوە." : "هیچ ڕێکخستنێکی سەرمایە بەردەست نییە"}
    </div>
  );
}

function SystemTab() {
  const { data: settings = [], isLoading } = useListSettings({ module: "general" });
  return (
    <div className="p-8 text-center text-gray-500 crm-dense-panel">
      {isLoading ? "لە بارکردندایە..." : settings.length ? "هەڵبژاردنەکانی سیستم لە API ـەوە بەردەستن." : "هیچ هەڵبژاردنێکی سیستم بەردەست نییە"}
    </div>
  );
}

function PrintTab() {
  return (
    <div className="space-y-4">
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
    create.mutate({ data: { module, key: `${prefix}_${key.trim()}`, value } }, {
      onSuccess: () => {
        setKey("");
        setValue("");
        void refetch();
        toast.success("ڕێکخستن پاشەکەوتکرا");
      },
      onError: (err) => toast.error(getApiError(err))
    });
  };

  return (
    <div className="overflow-hidden rounded-sm border border-[#deecf9] bg-white">
      <div className="bg-[#f8fcff] border-b border-[#deecf9] p-3 text-[13px] font-bold text-[#0f4c81]">{title}</div>
      <div className="flex items-end gap-3 border-b border-gray-100 p-3">
        <div className="flex-1">
          <label className="crm-dense-label">ناوی بژاردە</label>
          <input className="crm-dense-input" placeholder="ناوی بژاردە" value={key} onChange={(e) => setKey(e.target.value)} dir="ltr" />
        </div>
        <div className="flex-1">
          <label className="crm-dense-label">بەها</label>
          <input className="crm-dense-input" placeholder="بەها" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <button onClick={add} disabled={create.isPending} className="h-[28px] rounded-sm bg-[#0f4c81] px-6 text-xs font-bold text-white hover:bg-[#0f4c81]/90 transition-colors disabled:opacity-50">زیادکردن</button>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-xs text-gray-500">لە بارکردندایە...</div>
      ) : relevant.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-500">هیچ ڕێکخستنێک نییە؛ لە سەرەوە زیاد بکە.</div>
      ) : (
        relevant.map((setting) => <PrintSettingRow key={setting.id} setting={setting} update={update} refetch={refetch} />)
      )}
    </div>
  );
}

function PrintSettingRow({ setting, update, refetch }: { setting: { id: number; key: string; value: unknown }; update: ReturnType<typeof useUpdateSetting>; refetch: () => Promise<unknown> }) {
  const [value, setValue] = useState(String(setting.value ?? ""));
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors">
      <span className="w-1/3 text-[13px] text-gray-600 font-mono text-left" dir="ltr">{setting.key}</span>
      <input className="crm-dense-input flex-1" value={value} onChange={(e) => setValue(e.target.value)} />
      <button onClick={() => update.mutate({ id: setting.id, data: { value } }, { onSuccess: () => { void refetch(); toast.success("بە سەرکەوتوویی نوێکرایەوە"); }, onError: (err) => toast.error(getApiError(err)) })} className="h-[28px] rounded-sm bg-gray-100 px-4 text-[12px] font-bold text-[#0f4c81] border border-gray-200 hover:bg-gray-200 transition-colors">پاشەکەوت</button>
    </div>
  );
}
