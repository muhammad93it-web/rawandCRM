import { useListAccounts } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Filter, Settings, RefreshCcw, Search, FileWarning, ArrowDownUp } from "lucide-react";
import { useState } from "react";

export default function Accounts() {
  const { data: accounts = [], isLoading, refetch } = useListAccounts();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAccounts = accounts.filter(account => 
    account.name.includes(searchTerm) || 
    account.phone.includes(searchTerm) ||
    (account.city && account.city.includes(searchTerm))
  );

  return (
    <div className="">
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
        <h1 className="text-xl font-normal text-gray-800">خاوەن حسابەکان</h1>
        <div></div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 flex-row">
        {/* Right side */}
        <div className="flex items-center gap-2 order-1 ml-auto">
          <Link href="/accounts/new" className="flex h-8 items-center gap-1.5 rounded-sm bg-[#0f4c81] px-3 text-xs font-medium text-white hover:bg-[#0f4c81]/90">
            <Plus className="h-3.5 w-3.5" />
            زیادکردنی خاوەن حساب
          </Link>
        </div>

        {/* Left side */}
        <div className="flex items-center gap-1.5 order-2 mr-auto">
          <button className="flex h-8 items-center gap-1.5 rounded-sm border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 hover:bg-gray-50">
            <Filter className="h-3.5 w-3.5 text-[#00b0f0]" />
            جیاکردنەوە
          </button>
          <div className="relative">
            <input 
              type="text" 
              placeholder="گەڕان" 
              className="h-8 w-48 rounded-sm border border-gray-200 bg-white pl-2 pr-7 text-xs text-right focus:border-[#0f4c81] focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-2 top-2 h-3.5 w-3.5 text-gray-400" />
          </div>
          <button className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
            <Settings className="h-3.5 w-3.5 text-[#00b0f0]" />
          </button>
          <button onClick={() => refetch()} className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
            <RefreshCcw className="h-3.5 w-3.5 text-[#00b0f0]" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-[#0f4c81] mt-4">
        <table className="w-full text-right text-xs">
          <thead className="bg-[#0f4c81] text-white">
            <tr>
              {["باڵانس", "جۆر", "شار", "مۆبایل", "ناوی خاوەن حساب", "زنجیرە"].map((th, i) => (
                <th key={i} className="px-3 py-2 font-medium whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    <ArrowDownUp className="h-3 w-3 opacity-50" />
                    {th}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 bg-white">
                  لە بارکردندایە...
                </td>
              </tr>
            ) : filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-800 font-bold bg-white">
                  <div className="flex items-center justify-center gap-2">
                    هیچ زانیارییەک بەردەست نییە
                    <FileWarning className="h-4 w-4 text-orange-400" />
                  </div>
                </td>
              </tr>
            ) : (
              filteredAccounts.map((account) => (
                <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                  <td className="px-3 py-2" dir="ltr">{account.balance} {account.currency}</td>
                  <td className="px-3 py-2">{account.type === "customer" ? "کڕیار" : account.type === "supplier" ? "فرۆشیار" : "تر"}</td>
                  <td className="px-3 py-2">{account.city}</td>
                  <td className="px-3 py-2">{account.phone}</td>
                  <td className="px-3 py-2">
                    <Link href={`/accounts/${account.id}`} className="text-blue-600 hover:underline">
                      {account.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{account.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Footer */}
      <div className="mt-3 flex items-center justify-between px-2 text-xs text-gray-600 bg-white">
         <div>
            پشاندانی 1 تا {filteredAccounts.length} لە کۆی {filteredAccounts.length} زانیاری
         </div>
         <div className="flex items-center gap-1">
            <button className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 bg-white disabled:opacity-50">پێشوو</button>
            <button className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 bg-white disabled:opacity-50">دواتر</button>
         </div>
      </div>
    </div>
  );
}
