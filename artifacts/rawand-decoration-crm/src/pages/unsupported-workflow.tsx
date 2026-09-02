import { useLocation } from "wouter";
import { FileWarning } from "lucide-react";

export default function UnsupportedWorkflow() {
  const [location] = useLocation();
  return <div dir="rtl" className="border border-[#0f4c81] bg-white p-10 text-center">
    <FileWarning className="mx-auto mb-3 h-8 w-8 text-orange-400" />
    <h1 className="text-xl font-normal text-gray-800">ئەم flow ـە هێشتا پشتگیری نەکراوە</h1>
    <p className="mt-2 text-sm text-gray-500">ڕێگاکە: <span dir="ltr">{location}</span></p>
    <p className="mt-2 text-xs text-gray-500">بۆ پاراستنی دروستیی داتا، ئەم کارە تا line و business rule ـە پێویستەکان بەردەست نەبن جێبەجێ ناکرێت.</p>
  </div>;
}