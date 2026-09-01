import { MenuCard, MenuSection } from "@/components/ui/menu-card";
import { 
  Grid, 
  UserCog, 
  Building2, 
  Users2, 
  Package, 
  ShoppingCart, 
  FileCheck, 
  Contact, 
  FileSpreadsheet, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  BarChart4, 
  CreditCard, 
  LineChart, 
  Trash2, 
  Settings,
  Users
} from "lucide-react";

export default function Home() {
  return (
    <div className="">
      <div className="mb-6 pb-3 text-right border-b border-gray-100">
        <h1 className="text-[32px] font-bold text-gray-800 tracking-tight inline-block">Rawand Decoration CRM</h1>
      </div>

      <MenuSection title="گشتی">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           {/* In RTL, the first element is on the right visually */}
           <MenuCard title="داشبۆرد" href="/dashboard" icon={Grid} />
           <MenuCard title="بەڕێوەبردنی بەکارهێنەر" href="/usermanagement" icon={UserCog} />
           <MenuCard title="بەکارهێنەرەکان" href="/users" icon={Users} />
           <MenuCard title="شوێنکارەکان" href="/Workplaces" icon={Building2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
           <MenuCard title="کارمەندەکان" href="/employeelist" icon={Users2} />
        </div>
      </MenuSection>
      
      <div className="my-8 border-t border-gray-100"></div>

      <MenuSection title="CRM">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
           <MenuCard title="کاڵاکان" href="/items" icon={Package} />
           <MenuCard title="کڕین" href="/purchases" icon={ShoppingCart} />
           <MenuCard title="فرۆشتن" href="/sales" icon={FileCheck} />
           <MenuCard title="زانیارییەکانی خاوەن حساب" href="/accountinfo" icon={Contact} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
           <MenuCard title="خەرجی و داهات" href="/accounting" icon={FileSpreadsheet} />
           <MenuCard title="داهاتەکان" href="/income" icon={ArrowDownToLine} />
           <MenuCard title="خەرجییەکان" href="/expense" icon={ArrowUpFromLine} />
           <MenuCard title="کۆگا" href="/storehouse" icon={Package} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
           <MenuCard title="قازانج و زیانەکان" href="/profitandlossdashboard" icon={BarChart4} />
           <MenuCard title="قەرزەکان" href="/AddDebt" icon={CreditCard} />
           <MenuCard title="ڕاپۆرتەکان" href="/reports" icon={LineChart} />
           <MenuCard title="زانیارییە سڕاوەکان" href="/deletedlogs" icon={Trash2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
           <MenuCard title="ڕێکخستنە گشتییەکان" href="/generalconfigurations" icon={Settings} />
        </div>
      </MenuSection>
    </div>
  );
}
