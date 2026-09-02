import { Link, useLocation, useParams } from "wouter";
import { Plus, X, Search } from "lucide-react";
import { useCreateItem, useUpdateItem } from "@workspace/api-client-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ItemsNew() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEdit = !!params.id && params.id !== "new";
  
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  
  const [itemType, setItemType] = useState("جۆری کاڵا");
  const [barcode, setBarcode] = useState("");
  const [detail, setDetail] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [unit, setUnit] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [country, setCountry] = useState("");
  const [version, setVersion] = useState("");
  const [safety, setSafety] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [titleDetails, setTitleDetails] = useState("");
  
  const handleSave = () => {
    const data = {
      name: titleDetails || "کاڵای نوێ",
      barcode,
      unit: unit || "دانە",
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
      salePrice: 0,
      category: itemType !== "جۆری کاڵا" ? itemType : "ئاسایی",
      brand: brand || "N/A",
      quantity: 0,
      reorderLevel: 0
    };

    if (isEdit) {
      updateItem.mutate({ id: parseInt(params.id!, 10), data }, {
        onSuccess: () => {
          toast.success("بە سەرکەوتوویی نوێکرایەوە");
          setLocation("/items");
        },
        onError: () => toast.error("هەڵەیەک ڕوویدا")
      });
    } else {
      createItem.mutate({ data }, {
        onSuccess: () => {
          toast.success("بە سەرکەوتوویی پاشەکەوت کرا");
          setLocation("/items");
        },
        onError: () => toast.error("هەڵەیەک ڕوویدا")
      });
    }
  };
  
  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">{isEdit ? "دەستکاریکردنی کاڵا" : "زیادکردنی کاڵا"}</h1>
        <div></div>
      </div>

      <div className="mb-4 flex border-b border-gray-200 flex-row-reverse">
        <button className="border-b-2 border-[#00b0f0] px-4 py-2 text-[13px] font-bold text-[#00b0f0]">زانیاری کاڵا</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
        {/* Row 1 */}
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">وردەکاری/جۆر/جۆری لاوەکی</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
            >
              <option value=""></option>
            </select>
          </div>
        </div>
        
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">بارکۆد</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Search className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <input 
              type="text" 
              className="h-8 flex-1 border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">کاڵای نوێ/بەکارهاتوو</label>
          <select 
            className="h-8 rounded border border-gray-200 px-2 bg-white text-xs outline-none"
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
          >
            <option value="جۆری کاڵا">جۆری کاڵا</option>
            <option value="کاڵای نوێ">کاڵای نوێ</option>
            <option value="کاڵای بەکارهاتوو">کاڵای بەکارهاتوو</option>
          </select>
        </div>
        <div className="md:col-span-1"></div>

        {/* Row 2 */}
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">براند</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              <option value=""></option>
            </select>
          </div>
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">یەکە</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="دانە">دانە</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ڕەنگ</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            >
              <option value=""></option>
            </select>
          </div>
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">قەبارە</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              <option value=""></option>
            </select>
          </div>
        </div>

        {/* Row 3 */}
        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">سەلامەتی</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={safety}
            onChange={(e) => setSafety(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">ڤێرژن</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">وڵات</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value=""></option>
            </select>
          </div>
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">مۆدێل</label>
          <div className="flex items-center">
            <button className="flex h-8 w-8 items-center justify-center rounded-l border border-gray-200 bg-gray-50 border-r-0">
               <Plus className="h-3.5 w-3.5 text-[#0f4c81]" />
            </button>
            <select 
              className="h-8 flex-1 border border-gray-200 px-2 bg-white text-xs outline-none"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value=""></option>
            </select>
          </div>
        </div>

        {/* Row 4 */}
        <div className="flex flex-col text-right md:col-start-3">
          <label className="mb-1 text-xs font-bold text-gray-700">نرخی کڕین</label>
          <input 
            type="text" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </div>

        <div className="flex flex-col text-right">
          <label className="mb-1 text-xs font-bold text-gray-700">بەرواری دەرچوون</label>
          <input 
            type="date" 
            className="h-8 rounded border border-gray-200 px-2 text-right text-xs outline-none focus:border-[#0f4c81]" 
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>

        {/* Row 5 */}
        <div className="flex flex-col text-right md:col-span-4 mt-2">
          <label className="mb-1 text-xs font-bold text-gray-700">ناونیشان / وردەکاری</label>
          <textarea 
            rows={2} 
            className="rounded border border-gray-200 p-2 text-right text-xs outline-none focus:border-[#0f4c81]"
            value={titleDetails}
            onChange={(e) => setTitleDetails(e.target.value)}
          ></textarea>
        </div>
      </div>

      <div className="flex justify-start pt-4 mt-2 mr-4">
        <button 
          onClick={handleSave}
          disabled={isPending}
          className="h-8 rounded-sm bg-[#0f4c81] px-6 text-xs font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50"
        >
          {isPending ? "لە پرۆسەدایە..." : "پاشەکەوت کردن"}
        </button>
      </div>
    </div>
  );
}
