import { Route } from "wouter";
import Purchases from "@/pages/purchases";
import PurchasesNew from "@/pages/purchases-new";
import PurchasesList from "@/pages/purchases-list";
import { BusinessDocumentForm, BusinessDocumentList, PaymentPage } from "@/pages/business-documents";
import { stubRoutes } from "./stub";

/** Area: purchases — purchase invoices, returns, orders, supplier payments, deleted purchases. */
export const purchasesRoutes = [
  <Route key="/purchases" path="/purchases" component={Purchases} />,
  <Route key="/purchases/new" path="/purchases/new" component={PurchasesNew} />,
  <Route key="/addpurchase" path="/addpurchase/:id1/:id2" component={PurchasesNew} />,
  <Route key="/purchaseinvoices" path="/purchaseinvoices" component={PurchasesList} />,
  <Route key="/purchaseorders" path="/purchaseorders"><BusinessDocumentList kind="purchase_order" /></Route>,
  <Route key="/addpurchasepayment" path="/addpurchasepayment/:id"><PaymentPage direction="paid" title="پارەدانەکانی کڕین" /></Route>,
  <Route key="/addpurchaseorder" path="/addpurchaseorder/:id"><BusinessDocumentForm kind="purchase_order" /></Route>,
  ...stubRoutes(["/deletedpurchaseinvoices", "/deletedpurchaseitems"]),
];
