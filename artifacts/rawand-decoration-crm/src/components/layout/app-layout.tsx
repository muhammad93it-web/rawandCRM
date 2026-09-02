import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useLocation, useRoute } from "wouter";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Mapping of paths to titles to know what to name auto-opened tabs
const routeTitles: Record<string, string> = {
  "/home": "پەڕەی سەرەکی",
  "/dashboard": "داشبۆرد",
  "/Workplaces": "شوێنکارەکان",
  "/usermanagement": "بەڕێوەبردنی بەکارهێنەر",
  "/accountinfo": "زانیارییەکانی خاوەن حساب",
  "/generalconfigurations": "ڕێکخستنە گشتییەکان",
  "/accounting": "خەرجی و داهات",
  "/income": "داهاتەکان",
  "/expense": "خەرجییەکان",
  "/storehouse": "کۆگا",
  "/items": "کاڵاکان",
  "/items/new": "زیادکردنی کاڵا",
  "/purchases": "کڕینەکان",
  "/sales": "فرۆشتن",
  "/salelist": "پسوولەکانی فرۆشتن",
  "/saletalaflist": "پسوولەکانی تەلەف",
  "/purchaseinvoices": "پسوولەکانی کڕین",
  "/purchaseorders": "داواکاری کڕین",
  "/comparestore": "بەراوردکردنی کۆگا",
  "/reports": "ڕاپۆرتەکان",
  "/reportaccounts": "ڕاپۆرتی خاوەن حسابەکان",
  "/deletedlogs": "زانیارییە سڕاوەکان",
  "/users": "بەکارهێنەرەکان",
  "/employeelist": "کارمەندەکان",
  "/profitandlossdashboard": "قازانج و زیانەکان",
  "/AddDebt": "قەرزەکان",
  "/accounts": "خاوەن حسابەکان",
  "/accounts/new": "زیادکردنی خاوەن حساب",
  "/groups": "ڕۆڵەکان و دەسەڵاتەکان",
  "/Storeconfig": "ڕێکخستنی کۆگا",
  "/transferitemlist": "گواستنەوەی کاڵا",
  "/services": "خزمەتگوزاریەکان",
};

export interface Tab {
  title: string;
  href: string;
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tabs, setTabs] = useState<Tab[]>([{ title: "پەڕەی سەرەکی", href: "/home" }]);
  const [showFavorites, setShowFavorites] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleFavorites = () => setShowFavorites(!showFavorites);

  // Sync route changes to tabs
  useEffect(() => {
    const title = routeTitles[location] || "تەپێک";
    if (location !== "/") {
      setTabs(prev => {
        const exists = prev.find(t => t.href === location);
        if (!exists) {
          return [...prev, { href: location, title }];
        }
        return prev;
      });
    }
  }, [location]);

  const closeTab = (href: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.href !== href);
    setTabs(newTabs);
    
    if (location === href) {
      const index = tabs.findIndex(t => t.href === href);
      const newActive = newTabs[Math.max(0, index - 1)].href;
      setLocation(newActive);
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-foreground font-sans overflow-hidden dir-rtl relative" dir="rtl">
      {/* Sticky Favorites Badge */}
      <div className={cn("fixed bottom-4 left-4 z-50 transition-opacity", showFavorites ? "opacity-100" : "opacity-0 pointer-events-none")}>
        <div className="bg-orange-500 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm flex items-center gap-2">
          دڵخوازەکان
        </div>
      </div>

      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header toggleSidebar={toggleSidebar} toggleFavorites={toggleFavorites} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isSidebarOpen={isSidebarOpen} />
          <main className="flex-1 flex flex-col overflow-hidden bg-[#f3f4f6]">
            
            {/* Tabs Bar */}
            <div className="px-3 pt-2 bg-white/50 border-b border-gray-200 shadow-sm flex items-center overflow-x-auto no-scrollbar shrink-0">
              <div className="flex gap-1.5 pb-1">
                {tabs.map((tab) => {
                  const isActive = location === tab.href;
                  return (
                    <div 
                      key={tab.href}
                      onClick={() => setLocation(tab.href)}
                      className={cn(
                        "group flex h-8 items-center gap-2 rounded-sm border px-3 text-xs font-medium cursor-pointer select-none transition-colors max-w-[200px]",
                        isActive 
                          ? "bg-white border-gray-200 text-[#0f4c81] shadow-sm relative after:absolute after:bottom-[-5px] after:left-0 after:right-0 after:h-[2px] after:bg-white" 
                          : "bg-gray-50 border-gray-200/60 text-gray-500 hover:bg-gray-100"
                      )}
                    >
                      <span className="truncate">{tab.title}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          closeTab(tab.href);
                        }}
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm transition-opacity",
                          isActive ? "text-gray-400 hover:bg-gray-100 hover:text-red-500" : "opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-[10px] pt-4 pb-4">
              <div className="bg-white min-h-[calc(100vh-100px)] shadow-sm">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
