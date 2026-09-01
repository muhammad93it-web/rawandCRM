import { useListPurchases } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus, Truck, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function Purchases() {
  const { data: purchases, isLoading } = useListPurchases();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="پسوولەکانی کڕین" 
        description="لیستی کڕینەکان لە فرۆشیارەکانەوە بۆ زیادکردنی کۆگا."
        actions={
          <Button className="gap-2 bg-orange-600 hover:bg-orange-700 text-white" asChild>
            <Link href="/purchases/new">
              <Plus className="w-4 h-4" /> کڕینی نوێ
            </Link>
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="گەڕان بەدوای ژمارەی پسوولە، فرۆشیار..." 
              className="pe-9 bg-white"
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ژ. پسوولە</TableHead>
                <TableHead>بەروار</TableHead>
                <TableHead>فرۆشیار</TableHead>
                <TableHead className="text-center">جۆری پارەدان</TableHead>
                <TableHead className="text-end">کۆی گشتی</TableHead>
                <TableHead className="text-center">دۆخ</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                  </TableCell>
                </TableRow>
              ) : purchases?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                     <div className="flex flex-col items-center justify-center gap-2">
                        <Truck className="w-8 h-8 opacity-20" />
                        <p>هیچ پسوولەیەک نەدۆزرایەوە</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : (
                purchases?.map((purchase) => (
                  <TableRow key={purchase.id} className="hover:bg-slate-50 cursor-pointer">
                    <TableCell className="font-mono text-sm font-medium text-orange-600">#{purchase.number}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(purchase.date)}</TableCell>
                    <TableCell className="font-medium">{purchase.accountName}</TableCell>
                    <TableCell className="text-center">
                      {purchase.paymentType === 'cash' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">کاش</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">قەرز</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end font-bold text-lg" dir="ltr">
                      {formatCurrency(purchase.total, purchase.currency)}
                    </TableCell>
                    <TableCell className="text-center">
                      {purchase.status === 'completed' ? <Badge variant="success">تەواوبوو</Badge> : 
                       purchase.status === 'draft' ? <Badge variant="secondary">ڕەشنووس</Badge> : 
                       <Badge variant="destructive">هەڵوەشاوە</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Eye className="w-4 h-4" />
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
