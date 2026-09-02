import { useLocation, useParams } from "wouter";
import { Plus } from "lucide-react";
import { useCreateAccount, useUpdateAccount } from "@workspace/api-client-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AccountsNew() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEdit = !!params.id && params.id !== "new";
  
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  
  const [name, setName] = useState("");
  const [locationStr, setLocationStr] = useState("");
  const [mobile, setMobile] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("فرۆشتن");
  const [saleType, setSaleType] = useState("نرخی تاک");
  const [allowedReturnDays, setAllowedReturnDays] = useState("");
  const [maxDebt, setMaxDebt] = useState("");
  const [note, setNote] = useState("");
  const [active, setActive] = useState(true);
  
  const handleSave = () => {
    if (!name || !accountType || !saleType) {
      toast.error("تکایە خانە داواکراوەکان پڕبکەرەوە");
      return;
    }

    const mapAccountType = (type: string) => {
      if (type === "فرۆشتن") return "customer";
      if (type === "کڕین") return "supplier";
      return "other";
    };

    const data = {
      name,
      type: mapAccountType(accountType) as any,
      city: locationStr || "Hewler",
      phone: mobile || phone || "0000000000",
      currency: "IQD",
      balance: 0
    };

    if (isEdit) {
      updateAccount.mutate({ id: parseInt(params.id!, 10), data }, {
        onSuccess: () => {
          toast.success("بە سەرکەوتوویی نوێکرایەوە");
          setLocation("/accounts");
        },
        onError: () => toast.error("هەڵەیەک ڕوویدا")
      });
    } else {
      createAccount.mutate({ data }, {
        onSuccess: () => {
          toast.success("بە سەرکەوتوویی پاشەکەوت کرا");
          setLocation("/accounts");
        },
        onError: () => toast.error("هەڵەیەک ڕوویدا")
      });
    }
  };
  
  const handleNew = () => {
    setName("");
    setLocationStr("");
    setMobile("");
    setPhone("");
    setAddress("");
    setEmail("");
    setAccountType("فرۆشتن");
    setSaleType("نرخی تاک");
    setAllowedReturnDays("");
    setMaxDebt("");
    setNote("");
    setActive(true);
  };
  
  const isPending = createAccount.isPending || updateAccount.isPending;

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <div></div>
        <h1 className="text-xl font-normal text-gray-800">{isEdit ? "دەستکاریکردنی خاوەن حساب" : "زیادکردنی خاوەن حساب"}</h1>
      </div>

      <div className="mb-4 flex border-b border-gray-200 flex-row-reverse">
        <button className="border-b-2 border-[#00b0f0] px-4 py-2 text-[13px] font-bold text-[#00b0f0]">زانیاری گشتییەکان</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
        {/* Row 1 */}
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ژمارە تەلەفۆن</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ژ. مۆبایل</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">شوێن</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={locationStr}
              onChange={(e) => setLocationStr(e.target.value)}
            >
              <option value=""></option>
            </select>
          </div>
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ناو *</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Row 2 */}
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">جۆری فرۆش *</label>
          <select 
            className="h-8 rounded border border-gray-200 px-2 bg-white text-xs outline-none"
            value={saleType}
            onChange={(e) => setSaleType(e.target.value)}
          >
            <option value="نرخی تاک">نرخی تاک</option>
            <option value="نرخی کۆ">نرخی کۆ</option>
            <option value="نرخی تایبەت">نرخی تایبەت</option>
            <option value="نرخی کڕین">نرخی کڕین</option>
            <option value="نرخی زیاتر">نرخی زیاتر</option>
          </select>
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">جۆری خاوەن حساب *</label>
          <select 
            className="h-8 rounded border border-gray-200 px-2 bg-white text-xs outline-none"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            <option value="فرۆشتن">فرۆشتن</option>
            <option value="کڕین">کڕین</option>
            <option value="کڕین و فرۆشتن">کڕین و فرۆشتن</option>
            <option value="خۆیی">خۆیی</option>
          </select>
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ئیمەیڵ</label>
          <input 
            type="email" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ناونیشان</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Row 3 */}
        <div className="flex flex-col text-right md:col-start-3">
          <label className="mb-1 text-xs font-bold text-gray-700">زۆرترین قەرز</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={maxDebt}
            onChange={(e) => setMaxDebt(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ڕۆژی ڕێگەپێدراو بۆ گەڕاندەوەی قەرز</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={allowedReturnDays}
            onChange={(e) => setAllowedReturnDays(e.target.value)}
          />
        </div>

        {/* Row 4 */}
        <div className="flex flex-col text-right md:col-span-4 mt-2">
          <label className="mb-1 text-xs font-bold text-gray-700">تێبینی</label>
          <textarea 
            rows={2} 
            className="rounded border border-gray-200 p-2 text-right text-xs outline-none focus:border-[#0f4c81]"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          ></textarea>
        </div>

        {/* Row 5 */}
        <div className="flex flex-col text-right md:col-span-4 mt-2">
          <div className="flex items-center gap-2 flex-row-reverse justify-end">
            <label className="text-xs font-bold text-gray-700">چالاک</label>
            <input 
              type="checkbox" 
              className="h-4 w-4 rounded border-gray-300"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-start gap-2 pt-4 mt-2 mr-4 flex-row-reverse">
        <button 
          onClick={handleSave}
          disabled={isPending}
          className="h-8 rounded-sm bg-[#0f4c81] px-6 text-xs font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50"
        >
          {isPending ? "لە پرۆسەدایە..." : "پاشەکەوت کردن"}
        </button>
        <button 
          onClick={handleNew}
          className="h-8 rounded-sm bg-gray-500 px-6 text-xs font-bold text-white hover:bg-gray-600"
        >
          نوێ
        </button>
      </div>
    </div>
  );
}
