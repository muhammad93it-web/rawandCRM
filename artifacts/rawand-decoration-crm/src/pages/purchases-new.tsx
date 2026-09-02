import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { ChevronRight, Plus, X } from "lucide-react";
import { useListAccounts, useListWorkplaces, useCreatePurchase } from "@workspace/api-client-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PurchasesNew() {
  const [, setLocation] = useLocation();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  const { data: accounts = [], isLoading: accountsLoading } = useListAccounts();
  const { data: workplaces = [], isLoading: workplacesLoading } = useListWorkplaces();
  const createPurchase = useCreatePurchase();

  const [accountId, setAccountId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [receiver, setReceiver] = useState("");
  const [type, setType] = useState("کاش");
  const [downPayment, setDownPayment] = useState("");
  const [date, setDate] = useState(todayStr);
  const [currencyRate, setCurrencyRate] = useState("154,000");
  const [note, setNote] = useState("");

  const handleNext = () => {
    if (!accountId) {
      toast.error("تکایە خاوەن حساب هەڵبژێرە");
      return;
    }
    
    // In a real app, you would proceed to the next step, but here we'll just save the initial draft
    createPurchase.mutate({
      data: {
        accountId: parseInt(accountId, 10),
        paymentType: type === "کاش" ? "cash" : "credit",
        currency: "IQD",
        date: new Date(date).toISOString(),
        notes: note,
        lines: [] // Draft state
      } as any // Use as any for draft
    }, {
      onSuccess: () => {
        toast.success("بە سەرکەوتوویی پاشەکەوت کرا");
        setLocation("/purchases");
      },
      onError: (err) => {
        toast.error("هەڵەیەک ڕوویدا لە پاشەکەوتکردن");
      }
    });
  };

  return (
    <div className="">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
        <div></div>
        <h1 className="text-xl font-normal text-gray-800">زیادکردنی پسوولەی کڕین</h1>
      </div>

      <div className="rounded-md border border-gray-100 p-6 bg-white mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">وەرگر</label>
            <div className="flex items-center">
              <button className="flex h-10 w-10 items-center justify-center rounded-l border border-gray-200 bg-white">
                 <X className="h-4 w-4 text-red-500" />
              </button>
              <select 
                className="h-10 flex-1 border-y border-gray-200 px-3 bg-white outline-none"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
              >
                <option value="">ڕاستەوخۆ</option>
              </select>
              <button className="flex h-10 w-10 items-center justify-center rounded-r border border-gray-200 bg-gray-50">
                 <Plus className="h-4 w-4 text-[#0f4c81]" />
              </button>
            </div>
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">شوێنکار</label>
            <select 
              className="h-10 rounded border border-gray-200 px-3 bg-white outline-none"
              value={workplaceId}
              onChange={(e) => setWorkplaceId(e.target.value)}
              disabled={workplacesLoading}
            >
              <option value="">شوێنکار هەڵبژێرە</option>
              {workplaces.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">خاوەن حساب *</label>
            <div className="flex items-center">
              <button className="flex h-10 w-10 items-center justify-center rounded-l border border-gray-200 bg-white">
                 <X className="h-4 w-4 text-red-500" />
              </button>
              <select 
                className="h-10 flex-1 border-y border-gray-200 px-3 bg-white outline-none"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={accountsLoading}
              >
                <option value="">خاوەن حساب هەڵبژێرە</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <button className="flex h-10 w-10 items-center justify-center rounded-r border border-gray-200 bg-gray-50">
                 <Plus className="h-4 w-4 text-[#0f4c81]" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">نرخی دراو (IQD) *</label>
            <input 
              type="text" 
              className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" 
              value={currencyRate}
              onChange={(e) => setCurrencyRate(e.target.value)}
            />
          </div>

          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">جۆر *</label>
            <select 
              className="h-10 rounded border border-gray-200 px-3 bg-white outline-none"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="" disabled>جۆر</option>
              <option value="کاش">کاش</option>
              <option value="قەرز">قەرز</option>
            </select>
          </div>
          
          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">پ. دەستی</label>
            <input 
              type="text" 
              className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" 
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex flex-col text-right md:col-start-2">
            <label className="mb-2 text-sm font-bold text-gray-700">تێبینی</label>
            <input 
              type="text" 
              className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" 
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="flex flex-col text-right">
            <label className="mb-2 text-sm font-bold text-gray-700">بەروار</label>
            <input 
              type="date" 
              className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-start border-t border-gray-100 pt-4 mt-6">
        <button 
          onClick={handleNext}
          disabled={createPurchase.isPending}
          className="flex h-10 items-center gap-2 rounded bg-[#0f4c81] px-6 font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50"
        >
          {createPurchase.isPending ? "لە پرۆسەدایە..." : "دواتر"}
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
