import { useState } from "react";
import { useCreatePurchase, getListPurchasesQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Trash2, ArrowRight, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

export default function NewPurchase() {
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createPurchase = useCreatePurchase();
  
  const [accountId, setAccountId] = useState(2); // Default to a supplier
  const [lines, setLines] = useState<{itemId: number, quantity: number, price: number, discount: number, name: string}[]>([]);
  
  const handleAddItem = () => {
    setLines([...lines, { itemId: Math.floor(Math.random() * 100) + 1, quantity: 1, price: 10000, discount: 0, name: "کاڵای نوێ بۆ کۆگا" }]);
  };

  const handleRemoveItem = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };
  
  const updateLine = (index: number, field: string, value: number) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const total = lines.reduce((sum, line) => sum + (line.quantity * line.price) - line.discount, 0);

  const handleSave = () => {
    if (lines.length === 0) return;
    
    createPurchase.mutate({
      data: {
        accountId: accountId,
        date: new Date().toISOString(),
        currency: "IQD",
        paymentType: "cash",
        lines: lines.map(l => ({
          itemId: l.itemId,
          quantity: l.quantity,
          unitPrice: l.price,
          discount: l.discount
        }))
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPurchasesQueryKey() });
        setLocation("/purchases");
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="پسوولەی کڕینی نوێ" 
        breadcrumbs={[
          { name: "کڕینەکان", href: "/purchases" },
          { name: "پسوولەی نوێ" }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/purchases"><ArrowRight className="w-4 h-4 me-2" /> گەڕانەوە</Link>
            </Button>
            <Button onClick={handleSave} disabled={lines.length === 0 || createPurchase.isPending} className="bg-orange-600 hover:bg-orange-700">
              <Save className="w-4 h-4 me-2" /> پاشەکەوتکردن
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-muted/20 border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">کاڵاکان</CardTitle>
                <Button variant="outline" size="sm" onClick={handleAddItem} className="text-orange-600 border-orange-200 hover:bg-orange-50">
                  <Plus className="w-4 h-4 me-2" /> زیادکردنی کاڵا
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>کاڵا</TableHead>
                    <TableHead className="w-[120px] text-center">بڕ</TableHead>
                    <TableHead className="w-[150px] text-end">نرخ</TableHead>
                    <TableHead className="w-[120px] text-end">داشکاندن</TableHead>
                    <TableHead className="w-[150px] text-end">کۆی گشتی</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        هیچ کاڵایەک زیاد نەکراوە
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{line.name} #{line.itemId}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="1" 
                            value={line.quantity} 
                            onChange={(e) => updateLine(idx, 'quantity', Number(e.target.value) || 1)}
                            className="text-center h-8 focus-visible:ring-orange-500"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0" 
                            value={line.price} 
                            onChange={(e) => updateLine(idx, 'price', Number(e.target.value) || 0)}
                            className="text-end h-8 focus-visible:ring-orange-500"
                            dir="ltr"
                          />
                        </TableCell>
                        <TableCell>
                           <Input 
                            type="number" 
                            min="0" 
                            value={line.discount} 
                            onChange={(e) => updateLine(idx, 'discount', Number(e.target.value) || 0)}
                            className="text-end h-8 text-rose-500 focus-visible:ring-orange-500"
                            dir="ltr"
                          />
                        </TableCell>
                        <TableCell className="text-end font-bold" dir="ltr">
                          {formatCurrency((line.quantity * line.price) - line.discount)}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleRemoveItem(idx)}>
                            <Trash2 className="w-4 h-4" />
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

        <div className="space-y-6">
          <Card>
            <CardHeader className="bg-muted/20 border-b">
              <CardTitle className="text-lg">زانیاری پسوولە</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">فرۆشیار (دابینکەر)</label>
                <div className="flex gap-2">
                  <Input value="کۆمپانیای سەرەکی" readOnly className="bg-muted/50" />
                  <Button variant="outline" size="icon"><Search className="w-4 h-4"/></Button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">جۆری پارەدان</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="default" className="w-full bg-orange-600 hover:bg-orange-700 text-white">کاش</Button>
                  <Button variant="outline" className="w-full text-muted-foreground border-border hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200">قەرز</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50/50 border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/50">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>کۆی کاڵاکان</span>
                  <span dir="ltr">{formatCurrency(lines.reduce((s, l) => s + (l.quantity * l.price), 0))}</span>
                </div>
                <div className="flex justify-between text-sm text-rose-500">
                  <span>کۆی داشکاندن</span>
                  <span dir="ltr">-{formatCurrency(lines.reduce((s, l) => s + l.discount, 0))}</span>
                </div>
                <div className="h-px bg-orange-200 dark:bg-orange-900 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">کۆی گشتی</span>
                  <span className="font-bold text-2xl text-orange-600" dir="ltr">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
