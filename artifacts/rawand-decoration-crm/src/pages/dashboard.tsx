import { useGetDashboardSummary, useListActivity } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, Package, Users, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PackageMinus, Clock, ShoppingCart, Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activities, isLoading: isActivityLoading } = useListActivity({ limit: 5 });

  if (isSummaryLoading || isActivityLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p>لە بارکردندایە...</p>
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="داشبۆردی سەرەکی" 
        description="پوختەی کارەکان، فرۆش و کڕینەکان لەم پەڕەیەدا دەبینیت."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">کۆی گشتی فرۆشتنی ئەمڕۆ</CardTitle>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.salesToday)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" /> زیاتر لە دوێنێ
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">کۆی گشتی کڕینی ئەمڕۆ</CardTitle>
            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center dark:bg-orange-900/30">
              <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.purchasesToday)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
               بۆ کۆگا
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">قەرزی وەرنەگیراو</CardTitle>
            <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center dark:bg-emerald-900/30">
              <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.receivables)}</div>
            <p className="text-xs text-muted-foreground mt-1">پێویستە وەربگیرێت</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">قەرزی نەدراو</CardTitle>
            <div className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center dark:bg-rose-900/30">
              <DollarSign className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{formatCurrency(summary.payables)}</div>
            <p className="text-xs text-muted-foreground mt-1">پێویستە بدرێت</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-2">
        <Card className="hover:shadow-md transition-all">
          <CardContent className="p-6 flex items-center gap-4">
             <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center dark:bg-indigo-900/30">
              <Package className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ژمارەی کاڵاکان</p>
              <h3 className="text-2xl font-bold">{summary.itemsCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-all border-orange-200 dark:border-orange-900/50">
          <CardContent className="p-6 flex items-center gap-4">
             <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center dark:bg-orange-900/30">
              <PackageMinus className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">کاڵای کەمبووەوە</p>
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">{summary.lowStockCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all md:col-span-2">
          <CardContent className="p-6 flex items-center justify-between">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ژمارەی خاوەن حیسابەکان</p>
                <h3 className="text-2xl font-bold">{summary.customersCount}</h3>
              </div>
             </div>
             <div className="text-right">
                <p className="text-sm font-medium text-muted-foreground">کۆی باڵانسی گشتی</p>
                <h3 className="text-xl font-bold font-mono" dir="ltr">{formatCurrency(summary.receivables - summary.payables)}</h3>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-lg">پڕفرۆشترین کاڵاکان</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>ناوی کاڵا</TableHead>
                  <TableHead className="text-center">بڕی فرۆشراو</TableHead>
                  <TableHead className="text-end">داهات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      هیچ داتایەک نییە
                    </TableCell>
                  </TableRow>
                ) : (
                  summary.topItems.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">{item.quantity}</Badge>
                      </TableCell>
                      <TableCell className="text-end font-medium" dir="ltr">{formatCurrency(item.revenue)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">دوایین چالاکییەکان</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-border">
                {activities?.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">هیچ چالاکییەک نییە</div>
                ) : (
                  activities?.map((activity) => (
                    <div key={activity.id} className="p-4 flex gap-4 hover:bg-muted/30 transition-colors">
                      <div className="mt-1">
                        {activity.kind === 'sale' && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-blue-600" /></div>}
                        {activity.kind === 'purchase' && <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center"><Truck className="w-4 h-4 text-orange-600" /></div>}
                        {activity.kind === 'income' && <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>}
                        {activity.kind === 'expense' && <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center"><TrendingDown className="w-4 h-4 text-rose-600" /></div>}
                        {activity.kind === 'stock' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center"><Package className="w-4 h-4 text-indigo-600" /></div>}
                        {activity.kind === 'account' && <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><Users className="w-4 h-4 text-slate-600" /></div>}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="font-semibold text-sm">{activity.title}</p>
                          <span className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        {activity.amount > 0 && (
                           <div className="mt-2 text-sm font-medium" dir="ltr">
                             {formatCurrency(activity.amount, activity.currency)}
                           </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
