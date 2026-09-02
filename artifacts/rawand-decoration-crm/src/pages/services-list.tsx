import { useState } from "react";
import { FileWarning, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateService,
  useDeleteService,
  useListServices,
  useListWorkplaces,
} from "@workspace/api-client-react";

export default function ServicesList() {
  const { data: services = [], isLoading, refetch } = useListServices();
  const { data: workplaces = [] } = useListWorkplaces();
  const createService = useCreateService();
  const deleteService = useDeleteService();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [unit, setUnit] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("IQD");
  const [workplaceId, setWorkplaceId] = useState("");

  const add = () => {
    const amount = Number(price || 0);
    if (!name.trim() || !currency.trim() || !Number.isFinite(amount) || amount < 0) {
      toast.error("ناو و دراو پێویستن");
      return;
    }
    createService.mutate({ data: { name: name.trim(), code, unit, price: amount, currency, workplaceId: workplaceId ? Number(workplaceId) : null } }, {
      onSuccess: () => { setName(""); setCode(""); setUnit(""); setPrice(""); void refetch(); toast.success("خزمەتگوزاری زیادکرا"); },
      onError: () => toast.error("خزمەتگوزاری زیاد نەکرا"),
    });
  };

  return <div dir="rtl">
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h1 className="text-xl font-normal text-gray-800">خزمەتگوزاریەکان</h1><button onClick={() => void refetch()} className="flex h-8 items-center gap-1 border border-gray-200 px-3 text-xs"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></div>
    <div className="mb-4 grid gap-2 border border-[#0f4c81] bg-white p-3 md:grid-cols-6">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="ناو *" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="کۆد" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <input value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="یەکە" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <input value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" placeholder="نرخ" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <select value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-8 border border-gray-200 px-2 text-right text-xs"><option>IQD</option><option>USD</option></select>
      <button onClick={add} disabled={createService.isPending} className="flex h-8 items-center justify-center gap-1 bg-[#0f4c81] text-xs text-white disabled:opacity-50"><Plus className="h-4 w-4" /> زیادکردن</button>
      <select value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)} className="h-8 border border-gray-200 px-2 text-right text-xs md:col-span-2"><option value="">هەموو شوێنکارەکان</option>{workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}</select>
    </div>
    <div className="overflow-x-auto border border-[#0f4c81] bg-white"><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">کۆد</th><th className="p-2">یەکە</th><th className="p-2">نرخ</th><th className="p-2">دراو</th><th className="p-2"></th></tr></thead><tbody>{isLoading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">لە بارکردندایە...</td></tr> : services.length === 0 ? <tr><td colSpan={6} className="p-8 text-center font-bold">هیچ زانیارییەک بەردەست نییە <FileWarning className="mx-auto mt-2 h-4 w-4 text-orange-400" /></td></tr> : services.map((service) => <tr key={service.id} className="border-b border-gray-100"><td className="p-2">{service.name}</td><td className="p-2">{service.code}</td><td className="p-2">{service.unit}</td><td className="p-2">{service.price}</td><td className="p-2">{service.currency}</td><td className="p-2"><button onClick={() => deleteService.mutate({ id: service.id }, { onSuccess: () => void refetch() })} className="text-red-500"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
  </div>;
}