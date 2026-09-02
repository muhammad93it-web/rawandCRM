import { Search, ChevronLeft, ChevronRight, Star, Maximize, RefreshCcw, Menu, LogOut, KeyRound, Globe, Type, Sun, Moon, LockKeyhole, UserRoundCog } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleFavorites: () => void;
}

export function Header({ toggleSidebar, toggleFavorites }: HeaderProps) {
  const [location] = useLocation();
  const [fontScale, setFontScale] = useState(() => window.localStorage.getItem("rawand-font-scale") ?? "100");
  const [language, setLanguage] = useState(() => window.localStorage.getItem("rawand-language") ?? "ku");
  const [theme, setTheme] = useState<"light" | "dark">(() => window.localStorage.getItem("rawand-theme") === "dark" ? "dark" : "light");

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.lang = language === "en" ? "en" : language === "ar" ? "ar" : "ku";
    window.localStorage.setItem("rawand-font-scale", fontScale);
    window.localStorage.setItem("rawand-language", language);
    window.localStorage.setItem("rawand-theme", theme);
  }, [fontScale, language, theme]);

  const changeFontScale = (value: string) => {
    setFontScale(value);
    toast.success(`قەبارەی نووسین بووە ${value}%`);
  };

  const changeLanguage = (value: string, label: string) => {
    setLanguage(value);
    toast.success(`زمان گۆڕدرا بۆ ${label}`);
  };

  const breadcrumbs: Record<string, string> = {
    "/home": "پەڕەی سەرەکی",
    "/dashboard": "پەڕەی سەرەکی > داشبۆرد",
    "/Workplaces": "پەڕەی سەرەکی > شوێنکارەکان",
    "/usermanagement": "پەڕەی سەرەکی > بەڕێوەبردنی بەکارهێنەر",
    "/accountinfo": "پەڕەی سەرەکی > زانیارییەکانی خاوەن حساب",
    "/generalconfigurations": "پەڕەی سەرەکی > ڕێکخستنە گشتییەکان",
    "/accountconfiguration": "پەڕەی سەرەکی > زانیارییەکانی خاوەن حساب > ڕێکخستنی پۆلێنەکان",
    "/accountingconfigurations": "پەڕەی سەرەکی > خەرجی و داهات > ڕێکخستنەکان",
    "/accounting": "پەڕەی سەرەکی > خەرجی و داهات",
    "/income": "پەڕەی سەرەکی > خەرجی و داهات > داهاتەکان",
    "/expense": "پەڕەی سەرەکی > خەرجی و داهات > خەرجییەکان",
    "/storehouse": "پەڕەی سەرەکی > کۆگا",
    "/items": "پەڕەی سەرەکی > کۆگا > کاڵاکان",
    "/purchases": "پەڕەی سەرەکی > کڕینەکان",
    "/purchases/new": "پەڕەی سەرەکی > کڕینەکان > زیادکردنی پسوولە",
    "/sales": "پەڕەی سەرەکی > فرۆشتن",
    "/salelist": "پەڕەی سەرەکی > فرۆشتن > پسوولەکان",
    "/saletalaflist": "پەڕەی سەرەکی > فرۆشتن > پسوولەکانی تەلەف",
    "/purchaseinvoices": "پەڕەی سەرەکی > کڕینەکان > پسوولەکان",
    "/purchaseorders": "پەڕەی سەرەکی > کڕینەکان > داواکارییەکان",
    "/comparestore": "پەڕەی سەرەکی > بەراوردکردنی کۆگا",
    "/transferitemlist": "پەڕەی سەرەکی > کۆگا > گواستنەوەی کاڵا",
    "/services": "پەڕەی سەرەکی > کۆگا > خزمەتگوزاریەکان",
    "/Storeconfig": "پەڕەی سەرەکی > کۆگا > ڕێکخستن",
    "/reports": "پەڕەی سەرەکی > ڕاپۆرتەکان",
    "/reportaccounts": "پەڕەی سەرەکی > زانیارییەکانی خاوەن حساب > ڕاپۆرت",
    "/reportstockbalancesheet": "پەڕەی سەرەکی > ڕاپۆرتەکان > باڵانسی مەخزەن",
    "/boxtransactionreport": "پەڕەی سەرەکی > ڕاپۆرتەکان > مامەڵەی سندوق",
    "/profitandlossdashboard": "پەڕەی سەرەکی > ڕاپۆرتەکان > قازانج و زیان",
    "/debt": "پەڕەی سەرەکی > ڕاپۆرتەکان > قەرز",
    "/deletedlogs": "پەڕەی سەرەکی > زانیارییە سڕاوەکان",
  };

  const currentBreadcrumb = breadcrumbs[location] || breadcrumbs["/home"] || "پەڕەی سەرەکی";

  return (
    <header className="flex h-[42px] items-center justify-between bg-[#0f4c81] px-3 text-white shrink-0 border-b border-[#0a365c] z-20">
      
      {/* Right side in RTL: Hamburger + Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-2 text-xs text-white/90">
        <button 
          onClick={toggleSidebar}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/10"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex gap-0.5 ml-2">
          {/* Use window.history for prev/next exactly like original */}
          <button onClick={() => window.history.back()} className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => window.history.forward()} className="flex h-6 w-6 items-center justify-center rounded hover:bg-white/10"><ChevronLeft className="h-4 w-4" /></button>
        </div>
        <span className="max-w-[220px] truncate sm:max-w-none">{currentBreadcrumb}</span>
      </div>

      {/* Center: Search */}
      <div className="mx-2 flex min-w-[52px] flex-1 justify-center sm:mx-4 sm:max-w-sm">
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
        <div className="flex shrink-0 items-center gap-1.5">
        <div className="mr-0 hidden h-7 items-center gap-1.5 rounded-sm bg-white px-2 text-gray-800 text-xs font-medium sm:flex sm:mr-2">
          <span className="text-yellow-500 font-bold">$</span>
          <span>154,000</span>
        </div>
        <button onClick={() => window.location.reload()} className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-gray-600 hover:bg-gray-100">
          <RefreshCcw className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen()} className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-gray-600 hover:bg-gray-100">
          <Maximize className="h-3.5 w-3.5" />
        </button>
        <button className="hidden h-7 w-7 items-center justify-center rounded-sm bg-white text-orange-400 hover:bg-gray-100 sm:flex">
          <Star className="h-3.5 w-3.5" fill="currentColor" />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-[#0f4c81] hover:bg-gray-100">
              <span className="font-bold text-xs">A</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={5} className="rawand-profile-menu w-[184px] rounded-md border border-[#d9e0e7] bg-white p-0 text-right shadow-lg" style={{ direction: "rtl" }}>
            <DropdownMenuLabel className="flex h-10 items-center justify-center gap-2 border-b border-[#d9e0e7] bg-[#f5f8fb] px-2 text-[14px] font-bold text-[#176ca8]">
              <span>admin</span>
              <UserRoundCog className="h-4 w-4 text-[#176ca8]" />
            </DropdownMenuLabel>

            <div className="py-1">
              <DropdownMenuItem onSelect={() => { window.location.href = "/login"; }} className="rawand-profile-item flex h-9 flex-row-reverse items-center justify-start gap-2 px-3 text-[13px] text-gray-800">
                <span>چوونە دەرەوە</span>
                <LogOut className="h-4 w-4 text-[#f5ad28]" />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.info("گۆڕینی وشەی نهێنی لە بەشی بەکارهێنەرەکانەوە بەردەست دەبێت")} className="rawand-profile-item flex h-9 flex-row-reverse items-center justify-start gap-2 px-3 text-[13px] text-gray-800">
                <span>گۆڕینی وشەی نهێنی</span>
                <KeyRound className="h-4 w-4 text-[#178cc3]" />
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.info("پەنجەرەکە داخرا")} className="rawand-profile-item flex h-9 flex-row-reverse items-center justify-start gap-2 px-3 text-[13px] text-gray-800">
                <span>داخستن</span>
                <LockKeyhole className="h-4 w-4 text-[#f1c232]" />
              </DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-0 bg-[#d9e0e7]" />
            <DropdownMenuLabel className="flex h-9 items-center justify-center gap-2 bg-[#f5f8fb] px-2 text-[13px] font-bold text-gray-800">
              <Globe className="h-4 w-4 text-gray-700" />
              گۆڕینی زمان
            </DropdownMenuLabel>
            <div className="py-1">
              <DropdownMenuItem onSelect={() => changeLanguage("en", "English")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${language === "en" ? "rawand-profile-selected" : ""}`}>English</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeLanguage("ku", "کوردی")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${language === "ku" ? "rawand-profile-selected" : ""}`}>کوردی</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeLanguage("ar", "عربي")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${language === "ar" ? "rawand-profile-selected" : ""}`}>عربي</DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-0 bg-[#d9e0e7]" />
            <DropdownMenuLabel className="flex h-9 items-center justify-center gap-2 bg-[#f5f8fb] px-2 text-[13px] font-bold text-gray-800">
              <Type className="h-4 w-4 text-gray-700" />
              گۆڕینی قەبارەی فۆنت
            </DropdownMenuLabel>
            <div className="py-1">
              <DropdownMenuItem onSelect={() => changeFontScale("100")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${fontScale === "100" ? "rawand-profile-selected" : ""}`}>100%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeFontScale("110")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${fontScale === "110" ? "rawand-profile-selected" : ""}`}>110%</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => changeFontScale("120")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${fontScale === "120" ? "rawand-profile-selected" : ""}`}>120%</DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-0 bg-[#d9e0e7]" />
            <DropdownMenuLabel className="flex h-9 items-center justify-center gap-2 bg-[#f5f8fb] px-2 text-[13px] font-bold text-gray-800">
              {theme === "dark" ? <Moon className="h-4 w-4 text-gray-700" /> : <Sun className="h-4 w-4 text-gray-700" />}
              دەرکەوتن
            </DropdownMenuLabel>
            <div className="py-1">
              <DropdownMenuItem onSelect={() => setTheme("light")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${theme === "light" ? "rawand-profile-selected" : ""}`}>باری ڕووناک</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setTheme("dark")} className={`rawand-profile-item flex h-8 justify-end px-4 text-[13px] ${theme === "dark" ? "rawand-profile-selected" : ""}`}>باری تاریک</DropdownMenuItem>
            </div>

            <DropdownMenuSeparator className="my-0 bg-[#d9e0e7]" />
            <DropdownMenuLabel className="flex h-9 items-center justify-center bg-[#f5f8fb] px-2 text-[13px] font-bold text-gray-800">دەربارەی</DropdownMenuLabel>
            <div className="flex items-center justify-between px-4 py-1 text-[12px] text-gray-800"><span className="rounded bg-[#dff2d8] px-1.5 py-0.5 text-[10px] font-bold text-[#31824c]">323D</span><span>بەشدارکردن</span></div>
            <div className="flex items-center justify-between px-4 pb-2 text-[12px] text-gray-800"><span dir="ltr">3.2.0</span><span>وەشان</span></div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}
