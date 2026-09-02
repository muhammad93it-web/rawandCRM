import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { ChevronRight, Plus, X } from "lucide-react";
import { useListAccounts, useListItems, useListWorkplaces, useCreatePurchase } from "@workspace/api-client-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PurchasesNew() {
  const [, setLocation] = useLocation();
  const todayStr = format(new Date(), "yyyy-MM-dd");
  
  const { data: accounts = [], isLoading: accountsLoading } = useListAccounts();
  const { data: workplaces = [], isLoading: workplacesLoading } = useListWorkplaces();
  const { data: items = [], isLoading: itemsLoading } = useListItems();
  const createPurchase = useCreatePurchase();

  const [accountId, setAccountId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [receiver, setReceiver] = useState("");
  const [type, setType] = useState("کاش");
  const [downPayment, setDownPayment] = useState("");
  const [date, setDate] = useState(todayStr);
  const [currencyRate, setCurrencyRate] = useState("154,000");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Array<{ itemId: string; quantity: string; unitPrice: string; discount: string }>>([]);

  const addLine = () => setLines((current) => [...current, { itemId: "", quantity: "1", unitPrice: "0", discount: "0" }]);
  const updateLine = (index: number, field: keyof (typeof lines)[number], value: string) =>
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));
  const removeLine = (index: number) => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));

  const handleNext = () => {
    if (!accountId) {
      toast.error("تکایە خاوەن حساب هەڵبژێرە");
      return;
    }
    
    const normalizedLines = lines.map((line) => ({
      itemId: Number(line.itemId),
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
      discount: Number(line.discount),
    }));
    if (normalizedLines.length === 0 || normalizedLines.some((line) => !line.itemId || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0 || !Number.isFinite(line.discount) || line.discount < 0)) {
      toast.error("لانیکەم یەک line ـی دروستی کاڵا پێویستە");
      return;
    }
    createPurchase.mutate({
      data: {
        accountId: parseInt(accountId, 10),
        paymentType: type === "کاش" ? "cash" : "credit",
        currency: "IQD",
        date: new Date(date).toISOString(),
        notes: note,
        lines: normalizedLines,
      }
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
        <h1 className="text-xl font-normal text-gray-800">زیادکردنی پسوولەی کڕین</h1>
        <div></div>
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

        <div className="border-t border-gray-100 pt-4">
          <div className="mb-2 flex items-center justify-between"><span className="text-sm font-bold text-gray-700">کاڵاکان</span><button type="button" onClick={addLine} className="flex h-8 items-center gap-1 border border-gray-200 px-3 text-xs"><Plus className="h-3.5 w-3.5 text-[#0f4c81]" /> زیادکردنی کاڵا</button></div>
          {lines.map((line, index) => <div key={index} className="mb-2 grid gap-2 md:grid-cols-5">
            <select value={line.itemId} disabled={itemsLoading} onChange={(event) => updateLine(index, "itemId", event.target.value)} className="h-9 border border-gray-200 px-2 text-right text-xs"><option value="">کاڵا هەڵبژێرە</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            <input type="number" min="0.001" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} placeholder="بڕ" className="h-9 border border-gray-200 px-2 text-right text-xs" />
            <input type="number" min="0" value={line.unitPrice} onChange={(event) => updateLine(index, "unitPrice", event.target.value)} placeholder="نرخی یەکە" className="h-9 border border-gray-200 px-2 text-right text-xs" />
            <input type="number" min="0" value={line.discount} onChange={(event) => updateLine(index, "discount", event.target.value)} placeholder="داشکاندن" className="h-9 border border-gray-200 px-2 text-right text-xs" />
            <button type="button" onClick={() => removeLine(index)} className="h-9 border border-red-100 text-red-500"><X className="mx-auto h-4 w-4" /></button>
          </div>)}
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
