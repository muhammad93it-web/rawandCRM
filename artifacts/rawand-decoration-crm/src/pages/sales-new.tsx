import { format } from "date-fns";
import { Link, useLocation } from "wouter";
import { ChevronRight, Plus, Save, X } from "lucide-react";
import { useListAccounts, useListItems, useListWorkplaces, useCreateSale } from "@workspace/api-client-react";
import { useState } from "react";
import { toast } from "sonner";
import { useUsdRate } from "@/hooks/use-usd-rate";
import { getApiError } from "@/lib/api-error";

export default function SalesNew() {
  const [, setLocation] = useLocation();
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const { data: accounts = [], isLoading: accountsLoading } = useListAccounts();
  const { data: workplaces = [], isLoading: workplacesLoading } = useListWorkplaces();
  const { data: items = [], isLoading: itemsLoading } = useListItems();
  const createSale = useCreateSale();

  const [accountId, setAccountId] = useState("");
  const [workplaceId, setWorkplaceId] = useState("");
  const [type, setType] = useState("کاش");
  const [downPayment, setDownPayment] = useState("");
  const [date, setDate] = useState(todayStr);
  const [driver, setDriver] = useState("");
  const { label: configuredUsdRate } = useUsdRate();
  const [currencyRate, setCurrencyRate] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
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

    createSale.mutate({
      data: {
        accountId: parseInt(accountId, 10),
        workplaceId: workplaceId ? Number(workplaceId) : null,
        paymentType: type === "کاش" ? "cash" : "credit",
        paidAmount: downPayment ? Number(downPayment) : undefined,
        currency: "IQD",
        date: new Date(date).toISOString(),
        notes: note,
        lines: normalizedLines,
      }
    }, {
      onSuccess: () => {
        toast.success("بە سەرکەوتوویی پاشەکەوت کرا");
        setLocation("/sales");
      },
      onError: (err) => {
        toast.error(getApiError(err));
      }
    });
  };

  return (
    <div dir="rtl" className="pb-10 min-h-screen">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">زیادکردنی پسوولەی فرۆشتن</h1>
      </div>

      <div className="crm-dense-panel mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="crm-dense-label">خاوەن حساب *</label>
            <div className="flex items-center h-[28px]">
              <select
                className="w-full border border-gray-300 border-l-0 px-2 text-[13px] outline-none focus:border-[#0f4c81] rounded-r-sm bg-white"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={accountsLoading}
              >
                <option value="">خاوەن حساب هەڵبژێرە</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="crm-dense-label">کۆد</label>
            <input
              type="text"
              className="crm-dense-input text-left"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <div>
            <label className="crm-dense-label">شوێنکار</label>
            <select
              className="crm-dense-select"
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="crm-dense-label">جۆر *</label>
            <select
              className="crm-dense-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="کاش">کاش</option>
              <option value="قەرز">قەرز</option>
            </select>
          </div>

          <div>
            <label className="crm-dense-label">پ. دەستی</label>
            <input
              type="number"
              className="crm-dense-input text-left"
              dir="ltr"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
            />
          </div>

          <div>
            <label className="crm-dense-label">بەروار</label>
            <input
              type="date"
              className="crm-dense-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="crm-dense-label">شۆفێر</label>
            <div className="flex items-center h-[28px]">
              <select
                className="w-full border border-gray-300 border-l-0 px-2 text-[13px] outline-none focus:border-[#0f4c81] rounded-r-sm bg-white"
                value={driver}
                onChange={(e) => setDriver(e.target.value)}
              >
                <option value="">شۆفێر</option>
              </select>
            </div>
          </div>

          <div>
            <label className="crm-dense-label">نرخی دراو (IQD) *</label>
            <input
              type="text"
              className="crm-dense-input text-left"
              dir="ltr"
              value={currencyRate ?? configuredUsdRate ?? ""}
              onChange={(e) => setCurrencyRate(e.target.value)}
            />
          </div>

          <div>
            <label className="crm-dense-label">تێبینی</label>
            <input
              type="text"
              className="crm-dense-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-[#deecf9] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[#0f4c81]">کاڵاکان</span>
            <button type="button" onClick={addLine} className="flex h-[28px] items-center gap-1 border border-gray-200 bg-white px-3 text-xs font-bold text-gray-700 rounded-sm hover:bg-gray-50 transition-colors">
              <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
              زیادکردنی کاڵا
            </button>
          </div>

          <div className="bg-white border border-[#deecf9] rounded-sm p-3">
            {lines.length === 0 ? (
              <div className="text-center text-gray-500 text-xs py-4">هیچ کاڵایەک زیاد نەکراوە</div>
            ) : (
              lines.map((line, index) => (
                <div key={index} className="mb-2 grid gap-2 md:grid-cols-12 items-center">
                  <div className="md:col-span-4">
                    <select value={line.itemId} disabled={itemsLoading} onChange={(event) => updateLine(index, "itemId", event.target.value)} className="crm-dense-select w-full">
                      <option value="">کاڵا هەڵبژێرە</option>
                      {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" min="0.001" value={line.quantity} onChange={(event) => updateLine(index, "quantity", event.target.value)} placeholder="بڕ" className="crm-dense-input w-full text-left" dir="ltr" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" min="0" value={line.unitPrice} onChange={(event) => updateLine(index, "unitPrice", event.target.value)} placeholder="نرخی یەکە" className="crm-dense-input w-full text-left" dir="ltr" />
                  </div>
                  <div className="md:col-span-2">
                    <input type="number" min="0" value={line.discount} onChange={(event) => updateLine(index, "discount", event.target.value)} placeholder="داشکاندن" className="crm-dense-input w-full text-left" dir="ltr" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <button type="button" onClick={() => removeLine(index)} className="flex h-[28px] w-[28px] items-center justify-center border border-red-200 text-red-500 rounded-sm hover:bg-red-50 transition-colors">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={createSale.isPending}
          className="flex h-[32px] items-center gap-2 rounded-sm bg-[#0f4c81] px-6 text-xs font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {createSale.isPending ? "لە پرۆسەدایە..." : "پاشەکەوت کردن"}
        </button>
      </div>
    </div>
  );
}
