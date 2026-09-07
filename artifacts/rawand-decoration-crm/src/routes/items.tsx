import { Route } from "wouter";
import Storehouse from "@/pages/storehouse";
import Items from "@/pages/items";
import ItemsNew from "@/pages/items-new";
import CompareStore from "@/pages/compare-store";
import TransferItemList from "@/pages/transfer-item-list";
import ServicesList from "@/pages/services-list";
import { InventoryBalanceReport } from "@/pages/live-reports";
import { stubRoutes } from "./stub";

/** Area: items-store — items, services, transfers, stock-taking (comparestore), stock balance. */
export const itemsRoutes = [
  <Route key="/storehouse" path="/storehouse" component={Storehouse} />,
  <Route key="/items" path="/items" component={Items} />,
  <Route key="/items/new" path="/items/new" component={ItemsNew} />,
  <Route key="/items/:id" path="/items/:id" component={ItemsNew} />,
  <Route key="/comparestore" path="/comparestore" component={CompareStore} />,
  <Route key="/transferitemlist" path="/transferitemlist" component={TransferItemList} />,
  <Route key="/services" path="/services" component={ServicesList} />,
  <Route key="/reportstockbalancesheet" path="/reportstockbalancesheet" component={InventoryBalanceReport} />,
  ...stubRoutes(["/item/:id", "/serviceitem/:id", "/transferitem/:id", "/storeregister/:id", "/storeregistrylist", "/reportcheckinventory"]),
];
