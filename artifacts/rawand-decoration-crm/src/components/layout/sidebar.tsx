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

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-[48px] flex-col items-center bg-[#0f4c81] py-2 shrink-0 z-10 border-r border-[#0a365c]">
      <div className="mb-4 flex items-center justify-center">
        <div className="w-8 h-8 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-pink-500 fill-current"><path d="M12 2L2 22h20L12 2z"/></svg>
        </div>
      </div>
      
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-col gap-1 w-full px-1.5">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/home" && item.href !== "/" && location.startsWith(item.href));
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex h-9 w-full items-center justify-center rounded-sm text-white/70 hover:text-white transition-colors",
                      isActive ? "bg-white/10 text-white" : "hover:bg-white/5"
                    )}
                  >
                    <item.icon className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
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
