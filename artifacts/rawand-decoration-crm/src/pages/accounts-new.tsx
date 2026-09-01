import { Save } from "lucide-react";
import { useLocation } from "wouter";
import { useCreateAccount } from "@workspace/api-client-react";

export default function AccountsNew() {
  const [, setLocation] = useLocation();
  const createAccount = useCreateAccount();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createAccount.mutate({
      data: {
        name: fd.get("name") as string || "Untitled",
        type: "customer", // Default since UI implies sales customer
        phone: fd.get("phone") as string || "",
        city: fd.get("city") as string || "",
        balance: 0,
        currency: "IQD"
      }
    }, {
      onSuccess: () => {
        setLocation("/accounts");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm min-h-[calc(100vh-80px)]">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
        <div></div>
        <h1 className="text-3xl font-bold text-gray-800">زیادکردنی خاوەن حساب</h1>
      </div>

      <div className="mb-6 flex border-b border-gray-200">
        <button type="button" className="flex-1 border-b-2 border-transparent py-3 text-center font-bold text-gray-500 hover:text-gray-800">بەپرسیارەکان</button>
        <button type="button" className="flex-1 border-b-2 border-transparent py-3 text-center font-bold text-gray-500 hover:text-gray-800">مافەکانی خاوەن حساب</button>
        <button type="button" className="flex-1 border-b-2 border-[#0f4c81] py-3 text-center font-bold text-[#0f4c81]">زانیارییەکانی خاوەن حساب</button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Right main area visually in RTL */}
        <div className="flex-1 rounded-md border border-gray-100 p-4 bg-white self-start">
          <h3 className="text-xl font-bold text-gray-800 text-right mb-4">زانیارییە گشتییەکان</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ژمارە تەلەفۆن</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ژ. مۆبایل</label>
              <input name="phone" type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">شوێن</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ناو *</label>
              <input name="name" type="text" required className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ناونیشان</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">کلاس</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>کلاس</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">شار</label>
              <input name="city" type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">جۆر</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>جۆر</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ئیمەیڵ</label>
              <input type="email" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">وشەی نهێنی</label>
              <input type="password" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ناوی بەکارهێنەر</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ژمارەی خانوو - شووقە</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 border-t border-gray-100 pt-4 mt-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">داشکاندن % (فرۆش)</label>
              <input type="number" defaultValue="0" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ڕێژەی بڕی دراو (فرۆشتن)</label>
              <input type="number" defaultValue="0" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">جۆری فرۆش *</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>نرخی تاک</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">جۆری خاوەن حساب *</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>فرۆشتن</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col text-right md:col-start-1">
              <label className="mb-1 text-sm font-bold text-gray-700">تەلەف</label>
              <div className="flex h-10 items-center justify-end px-3">
                <input type="checkbox" className="h-4 w-4" />
              </div>
            </div>
            <div className="flex flex-col text-right md:col-span-2">
              <label className="mb-1 text-sm font-bold text-gray-700">تێبینی</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ڕۆژی ڕێگەپێدراو بۆ گەڕاندنەوەی قەرز</label>
              <input type="number" defaultValue="0" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button type="button" className="rounded border border-gray-200 px-4 py-2 font-bold text-gray-600 hover:bg-gray-50">قەرزی فرۆشتن</button>
            <div className="flex items-center gap-2">
              <label className="font-bold text-gray-700">چالاک</label>
              <input type="checkbox" defaultChecked className="h-5 w-5 rounded bg-blue-600" />
            </div>
          </div>
        </div>

        {/* Left Categories area */}
        <div className="w-full lg:w-72 shrink-0 rounded-md border border-gray-100 p-4 bg-white self-start">
          <h3 className="text-xl font-bold text-gray-800 text-right mb-4">جۆرەکان</h3>
          
          {["پۆلێنی یەکەم", "پۆلێنی دووەم", "پۆلێنی سێیەم", "پۆلێنی چوارەم", "پۆلێنی پێنجەم"].map((label, i) => (
            <div key={i} className="flex flex-col text-right mb-4">
              <label className="mb-1 text-sm font-bold text-gray-700">{label}</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>{label}</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-start">
        <button 
          type="submit" 
          disabled={createAccount.isPending}
          className="flex h-10 items-center gap-2 rounded bg-[#0f4c81] px-6 font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          پاشەکەوت کردن
        </button>
      </div>
    </form>
  );
}
