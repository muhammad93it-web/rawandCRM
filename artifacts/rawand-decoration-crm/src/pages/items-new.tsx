import { useCreateItem } from "@workspace/api-client-react";
import { Save } from "lucide-react";
import { useLocation } from "wouter";

export default function ItemsNew() {
  const [, setLocation] = useLocation();
  const createItem = useCreateItem();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createItem.mutate({
      data: {
        name: fd.get("name") as string || "Untitled",
        barcode: fd.get("barcode") as string || "",
        category: fd.get("category") as string || "",
        brand: fd.get("brand") as string || "",
        quantity: 0,
        reorderLevel: Number(fd.get("reorderLevel")) || 0,
        purchasePrice: Number(fd.get("purchasePrice")) || 0,
        salePrice: Number(fd.get("salePrice")) || 0,
        unit: fd.get("unit") as string || "",
      }
    }, {
      onSuccess: () => {
        setLocation("/items");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm min-h-[calc(100vh-80px)]">
      <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
        <div></div>
        <h1 className="text-3xl font-bold text-gray-800">زیادکردنی کاڵا</h1>
      </div>

      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col text-right">
          <label className="mb-1 text-sm font-bold text-gray-700">جۆری کاڵا *</label>
          <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
            <option>کاڵای نوێ</option>
          </select>
        </div>
        <div className="flex flex-col text-right">
          <label className="mb-1 text-sm font-bold text-gray-700">وردەکاری (کوردی)</label>
          <input name="name" type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
        </div>
        <div className="flex flex-col text-right">
          <label className="mb-1 text-sm font-bold text-gray-700">وردەکاری (ئینگلیزی)</label>
          <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
        </div>
        <div className="flex flex-col text-right">
          <label className="mb-1 text-sm font-bold text-gray-700">وردەکاری (عەرەبی)</label>
          <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
        </div>
      </div>

      <div className="mb-4 border-b-2 border-[#0f4c81]">
        <h2 className="text-[#0f4c81] font-bold pb-2 text-center w-32 mx-auto">زانیاری کاڵا</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Right side (Main details) - Note: In RTL this will visually be right */}
        <div className="flex-1 rounded-md border border-gray-100 p-4 bg-white">
          <h3 className="text-xl font-bold text-gray-800 text-right mb-4">ئارەزوومەندانە</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">قەبارە</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>قەبارە</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">جۆری لاوەکی ٢</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>جۆری لاوەکی</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">جۆری لاوەکی</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>جۆری لاوەکی</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">جۆر *</label>
              <input name="category" type="text" placeholder="جۆر" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">وەشان</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>وەشان</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">وڵات</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>وڵات</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">مۆدێل</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>مۆدێل</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">مارکەی بازرگانی</label>
              <select name="brand" className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>مارکەی بازرگانی</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">ناونیشانی کاڵا</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">نرخی کڕین</label>
              <input name="purchasePrice" type="number" defaultValue="0" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">بەرواری دەرچوون</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>بەرواری دەرچوون</option>
              </select>
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">سیفەت</label>
              <select className="h-10 rounded border border-gray-200 px-3 bg-white outline-none">
                <option>سیفەت</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
             {/* Left blank or for more fields? Ah, the original has barcode, unit, color on the far right. */}
             <div className="flex flex-col text-right md:col-start-2">
                <label className="mb-1 text-sm font-bold text-gray-700">بارکۆد</label>
                <input name="barcode" type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
             </div>
          </div>

          <div className="flex flex-col text-right mb-4">
            <label className="mb-1 text-sm font-bold text-gray-700">وردەکاری</label>
            <textarea rows={3} className="rounded border border-gray-200 p-3 text-right outline-none focus:border-[#0f4c81]"></textarea>
          </div>
        </div>

        {/* Left side (Extra details) */}
        <div className="w-full lg:w-72 shrink-0 rounded-md border border-gray-100 p-4 bg-white self-start">
          <h3 className="text-xl font-bold text-gray-800 text-right mb-4">زانیاری زیاتر</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">AFM</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">OEM</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">کۆد</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">DSP</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">کێش</label>
              <input type="number" defaultValue="0" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
            <div className="flex flex-col text-right">
              <label className="mb-1 text-sm font-bold text-gray-700">گەڕەنتی</label>
              <input type="text" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
            </div>
          </div>

          <div className="flex flex-col text-right">
            <label className="mb-1 text-sm font-bold text-gray-700">کەمترین بڕ</label>
            <input name="reorderLevel" type="number" defaultValue="0" className="h-10 rounded border border-gray-200 px-3 text-right outline-none focus:border-[#0f4c81]" />
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-start">
        <button 
          type="submit" 
          disabled={createItem.isPending}
          className="flex h-10 items-center gap-2 rounded bg-[#0f4c81] px-6 font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          پاشەکەوت کردن
        </button>
      </div>
    </form>
  );
}
