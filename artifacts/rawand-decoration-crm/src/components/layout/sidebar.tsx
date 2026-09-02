import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home, 
  Grid, 
  Building2, 
  User, 
  Contact, 
  Settings, 
  FileText, 
  Package, 
  ShoppingCart, 
  FileSpreadsheet, 
  LineChart, 
  Trash2 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";

const navigation = [
  { name: "پەڕەی سەرەکی", href: "/home", icon: Home },
  { name: "داشبۆرد", href: "/dashboard", icon: Grid },
  { name: "شوێنکارەکان", href: "/Workplaces", icon: Building2 },
  { name: "بەڕێوەبردنی بەکارهێنەر", href: "/usermanagement", icon: User },
  { name: "زانیارییەکانی خاوەن حساب", href: "/accountinfo", icon: Contact },
  { name: "ڕێکخستنە گشتییەکان", href: "/generalconfigurations", icon: Settings },
  { name: "خەرجی و داهات", href: "/accounting", icon: FileText },
  { name: "کۆگا", href: "/storehouse", icon: Package },
  { name: "کڕین", href: "/purchases", icon: ShoppingCart },
  { name: "فرۆشتن", href: "/sales", icon: FileSpreadsheet },
  { name: "بەراوردکردنی کۆگا", href: "/comparestore", icon: LineChart },
  { name: "ڕاپۆرتەکان", href: "/reports", icon: LineChart },
  { name: "زانیارییە سڕاوەکان", href: "/deletedlogs", icon: Trash2 },
];

interface SidebarProps {
  isSidebarOpen: boolean;
}

export function Sidebar({ isSidebarOpen }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className={cn(
      "flex h-full flex-col bg-[#0f4c81] shrink-0 z-10 border-r border-[#0a365c] transition-all duration-300",
      isSidebarOpen ? "w-[250px] items-center sm:items-stretch" : "w-[48px] items-center py-2 sm:w-[64px]"
    )}>
      <div className={cn("mb-4 flex items-center", isSidebarOpen ? "p-4 justify-start" : "justify-center")}>
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-pink-500 fill-current"><path d="M12 2L2 22h20L12 2z"/></svg>
        </div>
      </div>
      
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col gap-1 w-full px-1 overflow-y-auto overflow-x-hidden sm:px-1.5">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/home" && item.href !== "/" && location.startsWith(item.href));
            
            const content = (
              <Link
                href={item.href}
                className={cn(
                  "flex h-9 w-full items-center rounded-sm text-white/70 hover:text-white transition-colors overflow-hidden shrink-0",
                  isSidebarOpen ? "px-3 justify-start" : "justify-center",
                  isActive ? "bg-white/10 text-white" : "hover:bg-white/5"
                )}
              >
                {/* Due to RTL, flex order naturally goes right-to-left. 
                    In expanded view we want icon on the right, text on left. */}
                <item.icon className={cn("h-4 w-4 shrink-0", isSidebarOpen ? "ml-3" : "")} strokeWidth={1.5} />
                {isSidebarOpen && (
                  <span className="text-[13px] whitespace-nowrap leading-none">{item.name}</span>
                )}
              </Link>
            );

            if (isSidebarOpen) {
              return <div key={item.name}>{content}</div>;
            }

            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  {content}
                </TooltipTrigger>
                <TooltipContent side="left" className="bg-[#0f4c81] text-white border-white/20 text-xs">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
