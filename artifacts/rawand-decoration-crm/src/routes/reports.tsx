import { Route } from "wouter";
import Reports from "@/pages/reports";
import { stubRoutes } from "./stub";

const reportPaths = `storereports reportitemexpose reportminqty reportstockbystorename reportstockperstore reportstockandpurchase reportitemsTransfer reportexpenses reportexpensebytype reportincome reportpurchaseaccountstatement reportsaleaccountstatement reportpurchasesaleaccountstatement reportaccountlastactivity reportdebts ReportpurchaseDebts ReportsellDebts reportdebtslateamount reportdebtslatetime reportdailysale reportsaleitemshistory reportsaleitemsreturn reportsellbytotaltypes reportsaleinvoices reportsaleitemshistorysummed ReportEmployeePerSell ReportMostSaleItemByUser ReportSellInvoicePerUser ReportDamageItems reportpurchaseitemshistory reportpurchaseinvoices reportpurchaseitemshistorysummed ReportemployeePerInvoice reportpurchasesellitemsummarize reportprofit reportprofitsummary reportcashboxbalance`.split(" ");

/** Area: reports — the reports index and every report page. */
export const reportsRoutes = [
  <Route key="/reports" path="/reports" component={Reports} />,
  ...stubRoutes(reportPaths.map(path => `/${path}`)),
];
