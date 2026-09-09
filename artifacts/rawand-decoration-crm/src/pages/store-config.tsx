import { useState } from "react";
import { FileWarning, Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiError } from "@/lib/api-error";
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useListWarehouses,
  useListWorkplaces,
} from "@workspace/api-client-react";

export default function StoreConfig() {
  const { data: warehouses = [], isLoading, refetch } = useListWarehouses();
  const { data: workplaces = [], isLoading: workplacesLoading } = useListWorkplaces();
  const createWarehouse = useCreateWarehouse();
  const deleteWarehouse = useDeleteWarehouse();
  const [workplaceId, setWorkplaceId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");

  const add = () => {
    if (!workplaceId) {
      toast.error("تکایە شوێنکار هەڵبژێرە");
      return;
    }
    if (!name.trim() || !code.trim()) {
      toast.error("ناو و کۆدی کۆگا پێویستن");
      return;
    }
    createWarehouse.mutate({ data: { workplaceId: Number(workplaceId), name: name.trim(), code: code.trim(), address } }, {
      onSuccess: () => {
        setName("");
        setCode("");
        setAddress("");
        void refetch();
        toast.success("کۆگا بە سەرکەوتوویی زیادکرا");
      },
      onError: (err) => toast.error(getApiError(err)),
    });
  };

  return <div dir="rtl" className="pb-10">
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
      <h1 className="text-xl font-bold text-gray-800">ڕێکخستنی کۆگا</h1>
      <button onClick={() => void refetch()} className="flex h-[28px] items-center gap-1.5 rounded-sm bg-white border border-gray-200 px-3 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors">
        <RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" />
        نوێکردنەوە
      </button>
    </div>

    <div className="crm-dense-panel mb-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-48">
          <select value={workplaceId} onChange={(event) => setWorkplaceId(event.target.value)} disabled={workplacesLoading} className="crm-dense-select">
            <option value="">شوێنکار *</option>
            {workplaces.map((workplace) => <option key={workplace.id} value={workplace.id}>{workplace.name}</option>)}
          </select>
        </div>
        <div className="w-48">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="ناوی کۆگا *" className="crm-dense-input" />
        </div>
        <div className="w-32">
          <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="کۆد *" className="crm-dense-input text-left" dir="ltr" />
        </div>
        <div className="w-64">
          <input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="ناونیشان" className="crm-dense-input" />
        </div>
        <button onClick={add} disabled={createWarehouse.isPending} className="flex h-[28px] items-center justify-center gap-1.5 bg-[#0f4c81] text-xs font-bold text-white px-4 rounded-sm hover:bg-[#0f4c81]/90 transition-colors disabled:opacity-50">
          <Plus className="h-3.5 w-3.5" />
          زیادکردن
        </button>
      </div>
    </div>

    <div className="overflow-x-auto border border-[#deecf9] bg-white rounded-sm">
      <table className="w-full text-right text-[13px]">
        <thead className="bg-[#0f4c81] text-white">
          <tr>
            <th className="p-2.5 font-bold">ناو</th>
            <th className="p-2.5 font-bold">کۆد</th>
            <th className="p-2.5 font-bold">شوێنکار</th>
            <th className="p-2.5 font-bold">ناونیشان</th>
            <th className="p-2.5 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr><td colSpan={5} className="p-8 text-center text-gray-500">لە بارکردندایە...</td></tr>
          ) : warehouses.length === 0 ? (
            <tr><td colSpan={5} className="p-8 text-center font-bold text-gray-800"><div className="flex items-center justify-center gap-2">هیچ زانیارییەک بەردەست نییە <FileWarning className="h-4 w-4 text-orange-400" /></div></td></tr>
          ) : warehouses.map((warehouse) => (
            <tr key={warehouse.id} className="border-b border-gray-100 hover:bg-[#f8fcff] transition-colors">
              <td className="p-2.5">{warehouse.name}</td>
              <td className="p-2.5" dir="ltr">{warehouse.code}</td>
              <td className="p-2.5">{workplaces.find((workplace) => workplace.id === warehouse.workplaceId)?.name ?? `#${warehouse.workplaceId}`}</td>
              <td className="p-2.5">{warehouse.address}</td>
              <td className="p-2.5 text-center">
                <button onClick={() => deleteWarehouse.mutate({ id: warehouse.id }, { onSuccess: () => void refetch(), onError: (err) => toast.error(getApiError(err)) })} className="text-red-500 hover:text-red-700 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>;
}
