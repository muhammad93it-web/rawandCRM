import { useState } from "react";
import { FileWarning, Move, Plus, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  useCancelStockTransfer,
  useCreateStockTransfer,
  useListItems,
  useListStockTransfers,
  useListWarehouses,
  useUpdateStockTransfer,
} from "@workspace/api-client-react";

type DraftLine = { itemId: string; quantity: string };

const today = () => new Date().toISOString().slice(0, 10);

export default function TransferItemList() {
  const { data: transfers = [], isLoading, refetch } = useListStockTransfers();
  const { data: warehouses = [] } = useListWarehouses();
  const { data: items = [] } = useListItems();
  const createTransfer = useCreateStockTransfer();
  const updateTransfer = useUpdateStockTransfer();
  const cancelTransfer = useCancelStockTransfer();
  const [fromWarehouseId, setFromWarehouseId] = useState("");
  const [toWarehouseId, setToWarehouseId] = useState("");
  const [transferDate, setTransferDate] = useState(today);
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([{ itemId: "", quantity: "" }]);

  const reset = () => {
    setFromWarehouseId("");
    setToWarehouseId("");
    setTransferDate(today());
    setNote("");
    setLines([{ itemId: "", quantity: "" }]);
  };

  const save = () => {
    const parsedLines = lines.map((line) => ({
      itemId: Number(line.itemId),
      quantity: Number(line.quantity),
    }));
    if (!fromWarehouseId || !toWarehouseId || fromWarehouseId === toWarehouseId || !transferDate
      || parsedLines.some((line) => !Number.isInteger(line.itemId) || line.itemId < 1
        || !Number.isFinite(line.quantity) || line.quantity <= 0)) {
      toast.error("تکایە خانەکان بە دروستی پڕبکەرەوە");
      return;
    }
    createTransfer.mutate({
      data: {
        fromWarehouseId: Number(fromWarehouseId),
        toWarehouseId: Number(toWarehouseId),
        transferDate,
        note,
        lines: parsedLines,
      },
    }, {
      onSuccess: () => {
        toast.success("گواستنەوەکە دروستکرا");
        reset();
        void refetch();
      },
      onError: () => toast.error("گواستنەوەکە پاشەکەوت نەکرا"),
    });
  };

  const complete = (id: number) => {
    updateTransfer.mutate({ id, data: { status: "completed" } }, {
      onSuccess: () => {
        toast.success("گواستنەوەکە تەواو کرا");
        void refetch();
      },
      onError: () => toast.error("گواستنەوەکە تەواو نەکرا؛ stock ـی بەردەست بپشکنە"),
    });
  };

  const cancel = (id: number) => {
    cancelTransfer.mutate({ id }, {
      onSuccess: () => {
        toast.success("گواستنەوەکە هەڵوەشێنرایەوە");
        void refetch();
      },
      onError: () => toast.error("تەنها گواستنەوەی draft دەتوانرێت هەڵبوەشێنرێتەوە"),
    });
  };

  const warehouseName = (id: number) => warehouses.find((warehouse) => warehouse.id === id)?.name ?? `#${id}`;
  const itemName = (id: number) => items.find((item) => item.id === id)?.name ?? `#${id}`;

  return (
    <div dir="rtl">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">گواستنەوەی کاڵا</h1>
        <Move className="h-5 w-5 text-[#00b0f0]" />
      </div>

      <div className="mb-4 border border-[#0f4c81] bg-white p-4">
        <div className="mb-3 grid gap-3 md:grid-cols-4">
          <label className="text-xs text-gray-700">لە کۆگا
            <select value={fromWarehouseId} onChange={(event) => setFromWarehouseId(event.target.value)} className="mt-1 h-9 w-full rounded-sm border border-gray-200 px-2 text-right">
              <option value="">هەڵبژێرە</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-700">بۆ کۆگا
            <select value={toWarehouseId} onChange={(event) => setToWarehouseId(event.target.value)} className="mt-1 h-9 w-full rounded-sm border border-gray-200 px-2 text-right">
              <option value="">هەڵبژێرە</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-gray-700">بەروار
            <input type="date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} className="mt-1 h-9 w-full rounded-sm border border-gray-200 px-2 text-right" />
          </label>
          <label className="text-xs text-gray-700">تێبینی
            <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 h-9 w-full rounded-sm border border-gray-200 px-2 text-right" />
          </label>
        </div>

        <div className="overflow-x-auto border border-gray-100">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">کاڵا</th><th className="p-2">بڕ</th><th className="p-2"></th></tr></thead>
            <tbody>
              {lines.map((line, index) => <tr key={index} className="border-b border-gray-100">
                <td className="p-2">
                  <select value={line.itemId} onChange={(event) => setLines((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, itemId: event.target.value } : entry))} className="h-8 w-full rounded-sm border border-gray-200 px-2">
                    <option value="">هەڵبژێرە</option>
                    {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </td>
                <td className="p-2"><input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => setLines((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: event.target.value } : entry))} className="h-8 w-full rounded-sm border border-gray-200 px-2 text-right" /></td>
                <td className="p-2 text-left"><button type="button" onClick={() => setLines((current) => current.length === 1 ? current : current.filter((_, entryIndex) => entryIndex !== index))} className="text-red-500"><X className="h-4 w-4" /></button></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" onClick={() => setLines((current) => [...current, { itemId: "", quantity: "" }])} className="flex h-9 items-center gap-1 rounded-sm border border-[#00b0f0] px-3 text-xs text-[#00b0f0]"><Plus className="h-4 w-4" /> زیادکردنی کاڵا</button>
          <div className="flex gap-2">
            <button type="button" onClick={reset} className="flex h-9 items-center gap-1 rounded-sm border border-gray-200 px-3 text-xs text-gray-600"><X className="h-4 w-4" /> پاککردنەوە</button>
            <button type="button" onClick={save} disabled={createTransfer.isPending} className="flex h-9 items-center gap-1 rounded-sm bg-[#0f4c81] px-3 text-xs text-white disabled:opacity-50"><Save className="h-4 w-4" /> پاشەکەوتکردن</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-[#0f4c81] bg-white">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#0f4c81] text-white"><tr><th className="p-2">ژمارە</th><th className="p-2">لە کۆگا</th><th className="p-2">بۆ کۆگا</th><th className="p-2">بەروار</th><th className="p-2">دۆخ</th><th className="p-2">کردار</th></tr></thead>
          <tbody>
            {isLoading ? <tr><td colSpan={6} className="p-8 text-center text-gray-500">لە بارکردندایە...</td></tr> : transfers.length === 0 ? <tr><td colSpan={6} className="p-8 text-center font-bold text-gray-800"><span className="inline-flex items-center gap-2">هیچ زانیارییەک بەردەست نییە <FileWarning className="h-4 w-4 text-orange-400" /></span></td></tr> : transfers.map((transfer) => <tr key={transfer.id} className="border-b border-gray-100">
              <td className="p-2">{transfer.id}</td>
              <td className="p-2">{warehouseName(transfer.fromWarehouseId)}</td>
              <td className="p-2">{warehouseName(transfer.toWarehouseId)}</td>
              <td className="p-2">{transfer.transferDate}</td>
              <td className="p-2">{transfer.status === "draft" ? "draft" : transfer.status === "completed" ? "تەواوبوو" : "هەڵوەشێنراوە"}</td>
              <td className="p-2">
                {transfer.status === "draft" && <span className="flex gap-2">
                  <button type="button" onClick={() => complete(transfer.id)} className="text-green-600">تەواوکردن</button>
                  <button type="button" onClick={() => cancel(transfer.id)} className="text-red-500">هەڵوەشاندنەوە</button>
                </span>}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-2 text-xs text-gray-500">ناوی کاڵاکان: {transfers.reduce((total, transfer) => total + transfer.lines.length, 0)} line</div>
    </div>
  );
}