import { Route, useParams } from "wouter";
import Sales from "@/pages/sales";
import SalesNew from "@/pages/sales-new";
import SalesList from "@/pages/sales-list";
import { BusinessDocumentForm, BusinessDocumentList, PaymentPage } from "@/pages/business-documents";
import { stubRoutes } from "./stub";

function SalesEntryRoute() {
  const params = useParams<{ id2?: string }>();
  if (params.id2 === "lqy5q") return <BusinessDocumentForm kind="sale_return" />;
  if (params.id2 === "pbnKq") return <BusinessDocumentForm kind="sale_talaf" />;
  return <SalesNew />;
}

/** Area: sales — sale invoices (all kinds), receipts, offers, damage list, deleted sales. */
export const salesRoutes = [
  <Route key="/sales" path="/sales" component={Sales} />,
  <Route key="/sales/new" path="/sales/new" component={SalesNew} />,
  <Route key="/addsale" path="/addsale/:id1/:id2" component={SalesEntryRoute} />,
  <Route key="/salelist" path="/salelist" component={SalesList} />,
  <Route key="/saletalaflist" path="/saletalaflist"><BusinessDocumentList kind="sale_talaf" /></Route>,
  <Route key="/sellinvoiceclusting" path="/sellinvoiceclusting/:id"><PaymentPage direction="received" title="پسوولەی پارە وەرگرتن" /></Route>,
  <Route key="/addselloffer" path="/addselloffer/:id"><BusinessDocumentForm kind="sale_offer" /></Route>,
  <Route key="/selloffer" path="/selloffer"><BusinessDocumentList kind="sale_offer" /></Route>,
  ...stubRoutes(["/deletedsaleinvoices", "/deletedsaleitems"]),
];
