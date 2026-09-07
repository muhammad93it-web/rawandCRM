import { Route } from "wouter";
import AccountInfo from "@/pages/account-info";
import Accounts from "@/pages/accounts";
import AccountsNew from "@/pages/accounts-new";
import ReportAccounts from "@/pages/report-accounts";
import Debt from "@/pages/debt";
import Dashboard from "@/pages/dashboard";
import { stubRoutes } from "./stub";

/** Area: accounts — account owners, opening debts, account reports, dashboard. */
export const accountsRoutes = [
  <Route key="/accountinfo" path="/accountinfo" component={AccountInfo} />,
  <Route key="/accounts" path="/accounts" component={Accounts} />,
  <Route key="/accounts/new" path="/accounts/new" component={AccountsNew} />,
  <Route key="/accounts/:id" path="/accounts/:id" component={AccountsNew} />,
  <Route key="/reportaccounts" path="/reportaccounts" component={ReportAccounts} />,
  <Route key="/AddDebt" path="/AddDebt" component={Debt} />,
  <Route key="/accountolddebitsell" path="/accountolddebitsell" component={Debt} />,
  <Route key="/accountolddebitpurchase" path="/accountolddebitpurchase" component={Debt} />,
  <Route key="/dashboard" path="/dashboard" component={Dashboard} />,
  ...stubRoutes(["/account/:id"]),
];
