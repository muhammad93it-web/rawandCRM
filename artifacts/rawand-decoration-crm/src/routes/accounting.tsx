import { Route } from "wouter";
import Accounting from "@/pages/accounting";
import Income from "@/pages/income";
import Expense from "@/pages/expense";
import { CashboxTransactionsReport, DebtReport, ProfitLossReport } from "@/pages/live-reports";
import { stubRoutes } from "./stub";

/** Area: accounting — income, expenses, profit & loss, cash-box report, deleted income/expenses. */
export const accountingRoutes = [
  <Route key="/accounting" path="/accounting" component={Accounting} />,
  <Route key="/income" path="/income" component={Income} />,
  <Route key="/expense" path="/expense" component={Expense} />,
  <Route key="/boxtransactionreport" path="/boxtransactionreport" component={CashboxTransactionsReport} />,
  <Route key="/profitandlossdashboard" path="/profitandlossdashboard" component={ProfitLossReport} />,
  <Route key="/debt" path="/debt" component={DebtReport} />,
  ...stubRoutes(["/profitsAndLosses", "/profitAndLossesbalance", "/addProfitAndLoss/:id", "/addProfitAndLossbalance/:id", "/deletedexpenses", "/deletedincomes"]),
];
