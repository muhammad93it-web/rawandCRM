import { useState } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function Transactions() {
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const { data: transactions, isLoading } = useListTransactions({ 
    type: typeFilter === 'all' ? undefined : typeFilter 
  });

  return (
    <div className="space-y-6">
      <PageHeader 
        title="پارە و حیسابات" 
        description="تۆماری خەرجی و داهاتەکان، وەرگرتن و پێدانی پارە لە خاوەن حیسابەکان."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="text-rose-600 border-rose-200 hover:bg-rose-50">
              <ArrowUpRight className="w-4 h-4 me-2" /> خەرجی
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <ArrowDownRight className="w-4 h-4 me-2" /> وەرگرتن
            </Button>
          </div>
        }
      />

      <Card>
        <div className="p-4 border-b flex items-center gap-2 bg-muted/20">
           <Button 
             variant={typeFilter === 'all' ? 'default' : 'ghost'}
             onClick={() => setTypeFilter('all')}
           >
             هەموو
           </Button>
           <Button 
             variant={typeFilter === 'income' ? 'default' : 'ghost'}
             className={typeFilter === 'income' ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
             onClick={() => setTypeFilter('income')}
           >
             داهات (وەرگرتن)
           </Button>
           <Button 
             variant={typeFilter === 'expense' ? 'default' : 'ghost'}
             className={typeFilter === 'expense' ? "bg-rose-600 hover:bg-rose-700 text-white" : ""}
             onClick={() => setTypeFilter('expense')}
           >
             خەرجی (پێدان)
           </Button>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>جۆر</TableHead>
                <TableHead>بەروار</TableHead>
                <TableHead>خاوەن حیساب / پۆل</TableHead>
                <TableHead>تێبینی</TableHead>
                <TableHead className="text-end">بڕ</TableHead>
                <TableHead className="text-center">دۆخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>
                  </TableCell>
                </TableRow>
              ) : transactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                     <div className="flex flex-col items-center justify-center gap-2">
                        <CreditCard className="w-8 h-8 opacity-20" />
                        <p>هیچ تۆمارێک نەدۆزرایەوە</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.map((trx) => (
                  <TableRow key={trx.id}>
                    <TableCell>
                       {trx.type === 'income' ? (
                         <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                           <ArrowDownRight className="w-3 h-3 me-1" /> وەرگرتن
                         </Badge>
                       ) : (
                         <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
                           <ArrowUpRight className="w-3 h-3 me-1" /> پێدان
                         </Badge>
                       )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(trx.date)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{trx.accountName}</div>
                      <div className="text-xs text-muted-foreground">{trx.category}</div>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={trx.description}>{trx.description}</TableCell>
                    <TableCell className="text-end font-bold text-lg" dir="ltr">
                      <span className={trx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}>
                        {trx.type === 'income' ? '+' : '-'} {formatCurrency(trx.amount, trx.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {trx.status === 'posted' ? <Badge variant="success">پەسەندکراو</Badge> : 
                       <Badge variant="secondary">ڕەشنووس</Badge>}
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
