import { Search, ChevronLeft, ChevronRight, Star, Maximize, RefreshCcw, Menu, User, Settings, LogOut, Heart, Key, Globe, Type, Sun, Moon } from "lucide-react";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleFavorites: () => void;
}

export function Header({ toggleSidebar, toggleFavorites }: HeaderProps) {
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

  const currentBreadcrumb = breadcrumbs[location] || breadcrumbs["/home"] || "پەڕەی سەرەکی";

  return (
    <header className="flex h-[42px] items-center justify-between bg-[#0f4c81] px-3 text-white shrink-0 border-b border-[#0a365c] z-20">
      
      {/* Right side in RTL: Hamburger + Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-white/90">
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
        <button onClick={() => window.location.reload()} className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-gray-600 hover:bg-gray-100">
          <RefreshCcw className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => !document.fullscreenElement ? document.documentElement.requestFullscreen() : document.exitFullscreen()} className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-gray-600 hover:bg-gray-100">
          <Maximize className="h-3.5 w-3.5" />
        </button>
        <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-orange-400 hover:bg-gray-100">
          <Star className="h-3.5 w-3.5" fill="currentColor" />
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-sm bg-white text-[#0f4c81] hover:bg-gray-100">
              <span className="font-bold text-xs">A</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 dir-rtl text-right">
            <div className="px-2 py-1.5 text-sm font-medium text-gray-900 border-b border-gray-100 mb-1">
              admin / ProfileUser
            </div>
            
            <DropdownMenuItem className="flex flex-row-reverse items-center justify-start gap-2 cursor-pointer">
              <span>گۆڕینی وشەی نهێنی</span>
              <Key className="h-4 w-4" />
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={toggleFavorites} className="flex flex-row-reverse items-center justify-start gap-2 cursor-pointer">
              <span>دڵخوازکردن</span>
              <Heart className="h-4 w-4" />
            </DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex flex-row-reverse items-center justify-start gap-2 cursor-pointer text-right">
                <Globe className="h-4 w-4" />
                <span>گۆڕینی زمان</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="text-right">
                <DropdownMenuItem className="cursor-pointer">کوردی</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">English</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">عربي</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex flex-row-reverse items-center justify-start gap-2 cursor-pointer text-right">
                <Type className="h-4 w-4" />
                <span>قەبارەی فۆنت</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="text-right">
                <DropdownMenuItem className="cursor-pointer">100%</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">110%</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">120%</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex flex-row-reverse items-center justify-start gap-2 cursor-pointer text-right">
                <Sun className="h-4 w-4" />
                <span>باری ڕووناک / تاریک</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="text-right">
                <DropdownMenuItem className="cursor-pointer flex flex-row-reverse items-center justify-start gap-2">
                  <span>باری ڕووناک</span>
                  <Sun className="h-4 w-4" />
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex flex-row-reverse items-center justify-start gap-2">
                  <span>باری تاریک</span>
                  <Moon className="h-4 w-4" />
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => { window.location.href = "/login" }} className="flex flex-row-reverse items-center justify-start gap-2 text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer">
              <span>چوونە دەرەوە</span>
              <LogOut className="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

    </header>
  );
}
