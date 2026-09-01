import { useState } from "react";
import { useListAccounts, useCreateAccount, useUpdateAccount, getListAccountsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Phone, MapPin, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Accounts() {
  const [search, setSearch] = useState("");
  const { data: accounts, isLoading } = useListAccounts({ search: search || undefined });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="خاوەن حیسابەکان" 
        description="بەڕێوەبردنی کڕیار و فرۆشیارەکان، باڵانسەکانیان و زانیارییەکانی پەیوەندیکردن."
        actions={
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> زیادکردنی نوێ
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="گەڕان بەدوای ناو، مۆبایل..." 
              className="pe-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
             <Badge variant="secondary" className="px-4 py-1.5 cursor-pointer whitespace-nowrap">هەموو</Badge>
             <Badge variant="outline" className="px-4 py-1.5 cursor-pointer whitespace-nowrap">کڕیارەکان</Badge>
             <Badge variant="outline" className="px-4 py-1.5 cursor-pointer whitespace-nowrap">فرۆشیارەکان</Badge>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ناو</TableHead>
                <TableHead>جۆر</TableHead>
                <TableHead>پەیوەندی</TableHead>
                <TableHead className="text-end">باڵانس</TableHead>
                <TableHead className="text-center">دۆخ</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                  </TableCell>
                </TableRow>
              ) : accounts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    هیچ حیسابێک نەدۆزرایەوە
                  </TableCell>
                </TableRow>
              ) : (
                accounts?.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-semibold text-primary">{account.name}</TableCell>
                    <TableCell>
                      {account.type === 'customer' && <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">کڕیار</Badge>}
                      {account.type === 'supplier' && <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">فرۆشیار</Badge>}
                      {account.type === 'other' && <Badge variant="outline">تر</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {account.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3"/> <span dir="ltr">{account.phone}</span></div>}
                        {account.city && <div className="flex items-center gap-1"><MapPin className="w-3 h-3"/> <span>{account.city}</span></div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-end">
                      <span dir="ltr" className={`font-mono font-medium ${account.balance > 0 ? 'text-green-600' : account.balance < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(account.balance, account.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                       {account.status === 'active' ? (
                         <Badge variant="success">چالاک</Badge>
                       ) : (
                         <Badge variant="secondary">ناچالاک</Badge>
                       )}
                    </TableCell>
                    <TableCell>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                         <Edit className="w-4 h-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
