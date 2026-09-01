import { Search, ChevronLeft, ChevronRight, Star, Maximize, RefreshCcw } from "lucide-react";
import { useLocation } from "wouter";

export function Header() {
  const [location] = useLocation();

  const breadcrumbs: Record<string, string> = {
    "/home": "پەڕەی سەرەکی",
    "/dashboard": "پەڕەی سەرەکی > داشبۆرد",
    "/Workplaces": "پەڕەی سەرەکی > شوێنکارەکان",
    "/usermanagement": "پەڕەی سەرەکی > بەڕێوەبردنی بەکارهێنەر",
    "/accountinfo": "پەڕەی سەرەکی > زانیارییەکانی خاوەن حساب",
    "/generalconfigurations": "پەڕەی سەرەکی > ڕێکخستنە گشتییەکان",
    "/accounting": "پەڕەی سەرەکی > خەرجی و داهات",
    "/income": "پەڕەی سەرەکی > خەرجی و داهات > داهاتەکان",
    "/expense": "پەڕەی سەرەکی > خەرجی و داهات > خەرجییەکان",
    "/storehouse": "پەڕەی سەرەکی > کۆگا",
    "/items": "پەڕەی سەرەکی > کۆگا > کاڵاکان",
    "/purchases": "پەڕەی سەرەکی > کڕینەکان",
    "/sales": "پەڕەی سەرەکی > فرۆشتن",
    "/comparestore": "پەڕەی سەرەکی > بەراوردکردنی کۆگا",
    "/reports": "پەڕەی سەرەکی > ڕاپۆرتەکان",
    "/deletedlogs": "پەڕەی سەرەکی > زانیارییە سڕاوەکان",
  };

  const currentBreadcrumb = breadcrumbs[location] || breadcrumbs["/home"];

  return (
    <header className="flex h-[42px] items-center justify-between bg-[#0f4c81] px-3 text-white shrink-0 border-b border-[#0a365c] z-20">
      
      {/* Right side in RTL: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-white/90">
        <div className="flex gap-0.5 ml-2">
          <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"><ChevronRight className="h-4 w-4" /></button>
          <button className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>
        </div>
        <span>{currentBreadcrumb}</span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center max-w-sm mx-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="گەڕان"
            className="h-7 w-full rounded-sm bg-white pl-2 pr-7 text-xs text-gray-800 focus:outline-none"
          />
          <Search className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Left side in RTL: Utilities */}
      <div className="flex items-center gap-1.5">
        <div className="flex h-7 items-center gap-1.5 rounded-sm bg-white px-2 text-gray-800 text-xs font-medium mr-2">
          <span className="text-yellow-500 font-bold">$</span>
          <span>154,000</span>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-gray-600 hover:bg-gray-100">
          <RefreshCcw className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-gray-600 hover:bg-gray-100">
          <Maximize className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-orange-400 hover:bg-gray-100">
          <Star className="h-3.5 w-3.5" fill="currentColor" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-[#0f4c81] hover:bg-gray-100">
          <span className="font-bold text-xs">A</span>
        </button>
      </div>

    </header>
  );
}
