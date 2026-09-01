import { LayoutDashboard, Users, Package, ShoppingCart, Truck, CreditCard, Settings, LogOut, Menu, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "داشبۆرد", href: "/", icon: LayoutDashboard },
  { name: "کڕیار و فرۆشیار", href: "/accounts", icon: Users },
  { name: "کۆگا", href: "/items", icon: Package },
  { name: "فرۆشتن", href: "/sales", icon: ShoppingCart },
  { name: "کڕین", href: "/purchases", icon: Truck },
  { name: "پارە و حیسابات", href: "/transactions", icon: CreditCard },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 shadow-xl z-20 sticky top-0 border-l border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center justify-center px-6 border-b border-sidebar-border/50">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center shadow-inner">
            <span className="text-white font-bold text-lg leading-none">R</span>
          </div>
          ڕەوەند دیکۆرات
        </h1>
      </div>
      
      <div className="flex flex-1 flex-col overflow-y-auto pt-6 px-3">
        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "me-3 h-5 w-5 shrink-0 transition-transform duration-200",
                    isActive ? "text-white" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground/80 group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border/50 mt-auto">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center overflow-hidden border border-sidebar-border shadow-sm">
             <User className="w-5 h-5 text-sidebar-foreground/70" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">بەڕێوەبەر</span>
            <span className="text-xs text-sidebar-foreground/60">سیستەم</span>
          </div>
        </div>
      </div>
    </div>
  );
}
