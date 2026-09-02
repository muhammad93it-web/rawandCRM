import { useState } from "react";
import { FileWarning, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useListWarehouses,
  useListWorkplaces,
} from "@workspace/api-client-react";

export default function StoreConfig() {
  const { data: warehouses = [], isLoading, refetch } = useListWarehouses();
  const { data: workplaces = [] } = useListWorkplaces();
  const createWarehouse = useCreateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();
  const [workplaceId, setWorkplaceId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  const add = () => {
    if (!workplaceId || !name.trim() || !code.trim()) {
      toast.error("شوێنکار، ناو و کۆد پێویستن");
      return;
    }
    createWarehouse.mutate({ data: { workplaceId: Number(workplaceId), name: name.trim(), code: code.trim(), address } }, {
      onSuccess: () => { setName(""); setCode(""); setAddress(""); void refetch(); toast.success("کۆگا زیادکرا"); },
      onError: () => toast.error("کۆگا زیاد نەکرا"),
    });
  };

  return <div dir="rtl">
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2"><h1 className="text-xl font-normal text-gray-800">ڕێکخستنی کۆگا</h1><button onClick={() => void refetch()} className="flex h-8 items-center gap-1 border border-gray-200 px-3 text-xs"><RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" /> نوێکردنەوە</button></div>
    <div className="mb-4 grid gap-2 border border-[#0f4c81] bg-white p-3 md:grid-cols-5">
      <select value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)} className="h-8 border border-gray-200 px-2 text-right text-xs"><option value="">شوێنکار *</option>{workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}</select>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="ناوی کۆگا *" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="کۆد *" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="ناونیشان" className="h-8 border border-gray-200 px-2 text-right text-xs" />
      <button onClick={add} disabled={createWarehouse.isPending} className="flex h-8 items-center justify-center gap-1 bg-[#0f4c81] text-xs text-white disabled:opacity-50"><Plus className="h-4 w-4" /> زیادکردن</button>
    </div>
    <div className="overflow-x-auto border border-[#0f4c81] bg-white"><table className="w-full text-right text-xs"><thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ناو</th><th className="p-2">کۆد</th><th className="p-2">شوێنکار</th><th className="p-2">ناونیشان</th><th className="p-2"></th></tr></thead><tbody>{isLoading ? <tr><td colSpan={5} className="p-8 text-center text-gray-500">لە بارکردندایە...</td></tr> : warehouses.length === 0 ? <tr><td colSpan={5} className="p-8 text-center font-bold">هیچ زانیارییەک بەردەست نییە <FileWarning className="mx-auto mt-2 h-4 w-4 text-orange-400" /></td></tr> : warehouses.map((warehouse) => <tr key={warehouse.id} className="border-b border-gray-100"><td className="p-2">{warehouse.name}</td><td className="p-2">{warehouse.code}</td><td className="p-2">{workplaces.find((workplace) => workplace.id === warehouse.workplaceId)?.name ?? `#${warehouse.workplaceId}`}</td><td className="p-2">{warehouse.address}</td><td className="p-2"><button onClick={() => deleteWarehouse.mutate({ id: warehouse.id }, { onSuccess: () => void refetch() })} className="text-red-500"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
  </div>;
}