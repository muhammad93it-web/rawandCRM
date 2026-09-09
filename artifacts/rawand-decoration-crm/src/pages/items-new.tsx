import { Link, useLocation, useParams } from "wouter";
import { Save } from "lucide-react";
import { useCreateItem, useUpdateItem, useListItems } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getApiError } from "@/lib/api-error";

export default function ItemsNew() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEdit = !params.id ? false : params.id !== "new";
  const id = isEdit ? parseInt(params.id!, 10) : undefined;

  const createItem = useCreateItem();
  const updateItem = useUpdateItem();
  const { data: items } = useListItems();

  const [category, setCategory] = useState("کاڵای نوێ");
  const [nameKu, setNameKu] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameAr, setNameAr] = useState("");

  const [barcode, setBarcode] = useState("");
  const [type, setType] = useState("");
  const [subtype, setSubtype] = useState("");
  const [subtype2, setSubtype2] = useState("");
  const [size, setSize] = useState("");

  const [color, setColor] = useState("");
  const [unit, setUnit] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [country, setCountry] = useState("");
  const [version, setVersion] = useState("");

  const [attribute, setAttribute] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [address, setAddress] = useState("");

  const [details, setDetails] = useState("");

  const [oem, setOem] = useState("");
  const [afm, setAfm] = useState("");
  const [dsp, setDsp] = useState("");
  const [code, setCode] = useState("");
  const [warranty, setWarranty] = useState("");
  const [weight, setWeight] = useState("");
  const [minQty, setMinQty] = useState("");

  useEffect(() => {
    if (isEdit && items && id) {
      const item = items.find(i => i.id === id);
      if (item) {
        const attributes = item.attributes ?? {};
        setNameKu(item.name);
        setBarcode(item.barcode);
        setCategory(item.category);
        setBrand(item.brand);
        setPurchasePrice(item.purchasePrice.toString());
        setUnit(item.unit);
        setMinQty(item.reorderLevel.toString());
        setNameEn(String(attributes.nameEn ?? ""));
        setNameAr(String(attributes.nameAr ?? ""));
        setType(String(attributes.type ?? ""));
        setSubtype(String(attributes.subtype ?? ""));
        setSubtype2(String(attributes.subtype2 ?? ""));
        setSize(String(attributes.size ?? ""));
        setColor(String(attributes.color ?? ""));
        setModel(String(attributes.model ?? ""));
        setCountry(String(attributes.country ?? ""));
        setVersion(String(attributes.version ?? ""));
        setAttribute(String(attributes.attribute ?? ""));
        setReleaseDate(String(attributes.releaseDate ?? ""));
        setAddress(String(attributes.address ?? ""));
        setDetails(String(attributes.details ?? ""));
        setOem(String(attributes.oem ?? ""));
        setAfm(String(attributes.afm ?? ""));
        setDsp(String(attributes.dsp ?? ""));
        setCode(String(attributes.code ?? ""));
        setWarranty(String(attributes.warranty ?? ""));
        setWeight(String(attributes.weight ?? ""));
      }
    }
  }, [isEdit, items, id]);

  const handleSave = () => {
    if (!nameKu.trim() || !barcode.trim() || !unit.trim() || !category.trim()) {
      toast.error("ناوی کاڵا (کوردی)، بارکۆد، یەکە، و جۆری کاڵا پێویستن");
      return;
    }

    const data = {
      name: nameKu.trim(),
      barcode: barcode.trim(),
      unit: unit.trim(),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
      category: category.trim(),
      brand: brand.trim() || "N/A",
      reorderLevel: minQty ? parseFloat(minQty) : 0,
      attributes: {
        nameEn: nameEn.trim(),
        nameAr: nameAr.trim(),
        type: type.trim(),
        subtype: subtype.trim(),
        subtype2: subtype2.trim(),
        size: size.trim(),
        color: color.trim(),
        model: model.trim(),
        country: country.trim(),
        version: version.trim(),
        attribute: attribute.trim(),
        releaseDate,
        address: address.trim(),
        details: details.trim(),
        oem: oem.trim(),
        afm: afm.trim(),
        dsp: dsp.trim(),
        code: code.trim(),
        warranty: warranty.trim(),
        weight: weight.trim(),
      },
    };

    if (isEdit && id) {
      updateItem.mutate({ id, data }, {
        onSuccess: () => {
          toast.success("بە سەرکەوتوویی نوێکرایەوە");
          setLocation("/items");
        },
        onError: (err) => toast.error(getApiError(err))
      });
    } else {
      createItem.mutate({ data: { ...data, quantity: 0, salePrice: 0 } }, {
        onSuccess: () => {
          toast.success("بە سەرکەوتوویی پاشەکەوت کرا");
          setLocation("/items");
        },
        onError: (err) => toast.error(getApiError(err))
      });
    }
  };

  const isPending = createItem.isPending || updateItem.isPending;

  return (
    <div dir="rtl" className="pb-10 min-h-screen">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{isEdit ? "دەستکاریکردنی کاڵا" : "زیادکردنی کاڵا"}</h1>
      </div>

      <div className="crm-dense-panel mb-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="crm-dense-label">جۆری کاڵا *</label>
            <select className="crm-dense-select text-right" value={category} onChange={e => setCategory(e.target.value)}>
              <option value=""></option>
              <option value="کاڵای نوێ">کاڵای نوێ</option>
              <option value="کاڵای بەکارهاتوو">کاڵای بەکارهاتوو</option>
            </select>
          </div>
          <div>
            <label className="crm-dense-label">وردەکاری (کوردی) *</label>
            <input className="crm-dense-input text-right" value={nameKu} onChange={e => setNameKu(e.target.value)} />
          </div>
          <div>
            <label className="crm-dense-label">وردەکاری (ئینگلیزی)</label>
            <input className="crm-dense-input text-right" value={nameEn} onChange={e => setNameEn(e.target.value)} />
          </div>
          <div>
            <label className="crm-dense-label">وردەکاری (عەرەبی)</label>
            <input className="crm-dense-input text-right" value={nameAr} onChange={e => setNameAr(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-[#0f4c81]"></div>
        <h2 className="px-4 text-[#0f4c81] font-bold text-[13px]">زانیاری کاڵا</h2>
        <div className="flex-1 h-px bg-[#0f4c81]"></div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Right Panel (75%) */}
        <div className="flex-[3] crm-dense-panel">
          <h3 className="crm-dense-label text-[14px] mb-4 text-[#0f4c81]">ئارەزوومەندانە</h3>

          <div className="grid grid-cols-5 gap-3 mb-3">
            <div>
              <label className="crm-dense-label">بارکۆد *</label>
              <input className="crm-dense-input text-left" dir="ltr" value={barcode} onChange={e => setBarcode(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">جۆر</label>
              <input className="crm-dense-input" value={type} onChange={e => setType(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">جۆری لاوەکی</label>
              <input className="crm-dense-input" value={subtype} onChange={e => setSubtype(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">جۆری لاوەکی ٢</label>
              <input className="crm-dense-input" value={subtype2} onChange={e => setSubtype2(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">قەبارە</label>
              <input className="crm-dense-input" value={size} onChange={e => setSize(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-6 gap-3 mb-3">
            <div>
              <label className="crm-dense-label">ڕەنگ</label>
              <input className="crm-dense-input" value={color} onChange={e => setColor(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">یەکەی پێوانە *</label>
              <select className="crm-dense-select" value={unit} onChange={e => setUnit(e.target.value)}>
                 <option value=""></option>
                 <option value="دانە">دانە</option>
                 <option value="کارتۆن">کارتۆن</option>
                 <option value="کیلۆگرام">کێلۆگرام</option>
              </select>
            </div>
            <div>
              <label className="crm-dense-label">مارکەی بازرگانی</label>
              <select className="crm-dense-select" value={brand} onChange={e => setBrand(e.target.value)}>
                 <option value=""></option>
                 <option value="Samsung">Samsung</option>
                 <option value="Apple">Apple</option>
                 <option value="Sony">Sony</option>
              </select>
            </div>
            <div>
              <label className="crm-dense-label">مۆدێل</label>
              <input className="crm-dense-input" value={model} onChange={e => setModel(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">وڵات</label>
              <input className="crm-dense-input" value={country} onChange={e => setCountry(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">وەشان</label>
              <input className="crm-dense-input" value={version} onChange={e => setVersion(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <label className="crm-dense-label">سیفەت</label>
              <input className="crm-dense-input" value={attribute} onChange={e => setAttribute(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">بەرواری دەرچوون</label>
              <input type="date" className="crm-dense-input" value={releaseDate} onChange={e => setReleaseDate(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">نرخی کڕین</label>
              <input type="number" className="crm-dense-input text-left" dir="ltr" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">ناونیشانی کاڵا</label>
              <input className="crm-dense-input text-right" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="mb-3 mt-4">
            <label className="crm-dense-label">وردەکاری</label>
            <textarea
              className="w-full border border-gray-300 p-2 text-[13px] outline-none focus:border-[#0f4c81] rounded-sm min-h-[60px] text-right bg-white"
              value={details}
              onChange={e => setDetails(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Left Panel (25%) */}
        <div className="flex-1 crm-dense-panel flex flex-col justify-start">
          <h3 className="crm-dense-label text-[14px] mb-4 text-[#0f4c81]">زانیاری زیاتر</h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="crm-dense-label">OEM</label>
              <input className="crm-dense-input text-left" dir="ltr" value={oem} onChange={e => setOem(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">AFM</label>
              <input className="crm-dense-input text-left" dir="ltr" value={afm} onChange={e => setAfm(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="crm-dense-label">DSP</label>
              <input className="crm-dense-input text-left" dir="ltr" value={dsp} onChange={e => setDsp(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">کۆد</label>
              <input className="crm-dense-input text-left" dir="ltr" value={code} onChange={e => setCode(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="crm-dense-label">گەرەنتی</label>
              <input className="crm-dense-input text-right" value={warranty} onChange={e => setWarranty(e.target.value)} />
            </div>
            <div>
              <label className="crm-dense-label">کێش</label>
              <div className="flex h-[28px]">
                <input className="w-full border border-gray-300 border-l-0 px-2 text-[13px] outline-none focus:border-[#0f4c81] text-left rounded-r-sm" dir="ltr" value={weight} onChange={e => setWeight(e.target.value)} />
                <span className="bg-gray-100 border border-gray-300 px-2 text-[11px] flex items-center text-gray-500 rounded-l-sm">0</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-start-2">
              <label className="crm-dense-label">کەمترین بڕ</label>
              <div className="flex h-[28px]">
                <input type="number" className="w-full border border-gray-300 border-l-0 px-2 text-[13px] outline-none focus:border-[#0f4c81] text-left rounded-r-sm" dir="ltr" value={minQty} onChange={e => setMinQty(e.target.value)} />
                <span className="bg-gray-100 border border-gray-300 px-2 text-[11px] flex items-center text-gray-500 rounded-l-sm">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex h-[32px] items-center gap-2 rounded bg-[#0f4c81] px-6 text-xs font-bold text-white hover:bg-[#0f4c81]/90 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" />
          {isPending ? "لە پرۆسەدایە..." : "پاشەکەوت کردن"}
        </button>
      </div>
    </div>
  );
}
