import { Bell, Search, DollarSign, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export function Header() {
  const today = new Date().toISOString();
  
  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card/95 backdrop-blur px-6 shadow-sm">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 items-center">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            گەڕان
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 end-3 h-full w-5 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full max-w-md rounded-md border-0 py-0 ps-10 pe-10 text-foreground placeholder:text-muted-foreground focus:ring-0 sm:text-sm bg-transparent"
            placeholder="گەڕان لە سیستەم..."
            type="search"
            name="search"
          />
        </form>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground font-medium bg-secondary/50 px-3 py-1.5 rounded-full border border-border">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{formatDate(today)}</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 text-sm font-semibold bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-900">
            <DollarSign className="w-4 h-4" />
            <span>1 دۆلار = 1,520 دینار</span>
          </div>

          <div className="h-6 w-px bg-border hidden lg:block" aria-hidden="true" />
          
          <button type="button" className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground relative rounded-full hover:bg-secondary transition-colors">
            <span className="sr-only">بینینی ئاگادارکردنەوەکان</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            <span className="absolute top-2 end-2.5 w-2 h-2 rounded-full bg-destructive border-2 border-card"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
