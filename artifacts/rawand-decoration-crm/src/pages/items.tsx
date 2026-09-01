import { useState } from "react";
import { useListItems, useListLowStock } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertTriangle, Layers, Edit } from "lucide-react";

export default function Items() {
  const [search, setSearch] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  
  // Actually the API has useListItems({ lowStock: boolean }) and useListLowStock() separately.
  // We'll use useListItems and just pass the filter.
  const { data: items, isLoading } = useListItems({ search: search || undefined, lowStock: showLowStock || undefined });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="کۆگا و کاڵاکان" 
        description="لیستی هەموو کاڵاکان، نرخەکان و چاودێریکردنی بڕی ماوە لە کۆگا."
        actions={
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4" /> کاڵای نوێ
          </Button>
        }
      />

      <Card>
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="گەڕان بەدوای کاڵا، بارکۆد..." 
              className="pe-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Button 
               variant={showLowStock ? "default" : "outline"} 
               className={showLowStock ? "bg-orange-500 hover:bg-orange-600" : ""}
               onClick={() => setShowLowStock(!showLowStock)}
             >
               <AlertTriangle className="w-4 h-4 me-2" /> کاڵا کەمبووەکان
             </Button>
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>بارکۆد</TableHead>
                <TableHead>ناوی کاڵا</TableHead>
                <TableHead>جۆر / بڕاند</TableHead>
                <TableHead className="text-end">نرخی کڕین</TableHead>
                <TableHead className="text-end">نرخی فرۆشتن</TableHead>
                <TableHead className="text-center">بڕی ماوە</TableHead>
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
              ) : items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-48 text-center flex-col items-center justify-center">
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                       <Layers className="w-8 h-8 opacity-20" />
                       <p>هیچ کاڵایەک نەدۆزرایەوە</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items?.map((item) => {
                  const isLow = item.quantity <= item.reorderLevel;
                  return (
                    <TableRow key={item.id} className={isLow ? "bg-red-50/50 hover:bg-red-50 dark:bg-red-950/10" : ""}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{item.barcode}</TableCell>
                      <TableCell className="font-semibold">{item.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{item.category}</div>
                          <div className="text-muted-foreground text-xs">{item.brand}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-end text-muted-foreground" dir="ltr">{formatCurrency(item.purchasePrice)}</TableCell>
                      <TableCell className="text-end font-medium text-primary" dir="ltr">{formatCurrency(item.salePrice)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isLow ? "destructive" : "secondary"} className="font-mono text-sm px-2">
                          {item.quantity} {item.unit}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                           <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
