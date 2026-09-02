import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from '@/components/layout/app-layout';

// Pages
import Home from './pages/home';
import Dashboard from './pages/dashboard';
import Workplaces from './pages/workplaces';
import UserManagement from './pages/user-management';
import AccountInfo from './pages/account-info';
import Accounts from './pages/accounts';
import AccountsNew from './pages/accounts-new';
import GeneralConfigurations from './pages/general-configurations';
import Accounting from './pages/accounting';
import Income from './pages/income';
import Expense from './pages/expense';
import Storehouse from './pages/storehouse';
import Items from './pages/items';
import ItemsNew from './pages/items-new';
import Purchases from './pages/purchases';
import PurchasesNew from './pages/purchases-new';
import Sales from './pages/sales';
import SalesNew from './pages/sales-new';
import CompareStore from './pages/compare-store';
import Reports from './pages/reports';
import ReportAccounts from './pages/report-accounts';
import DeletedLogs from './pages/deleted-logs';
import LandingPreview from './pages/landing-preview';
import Login from './pages/login';
import TransferItemList from './pages/transfer-item-list';
import { CashboxTransactionsReport, DebtReport, InventoryBalanceReport, ProfitLossReport } from './pages/live-reports';
import ServicesList from './pages/services-list';
import StoreConfig from './pages/store-config';
import { EmployeesList, GroupsList, UsersList } from './pages/organization-lists';
import Debt from './pages/debt';
import UnsupportedWorkflow from './pages/unsupported-workflow';
import AccountingConfigurations from './pages/accounting-configurations';

import SalesList from './pages/sales-list';
import PurchasesList from './pages/purchases-list';

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
      <p className="text-lg text-muted-foreground">ئەم پەڕەیە نەدۆزرایەوە.</p>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/home" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/Workplaces" component={Workplaces} />
        <Route path="/usermanagement" component={UserManagement} />
        <Route path="/accountinfo" component={AccountInfo} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/accounts/new" component={AccountsNew} />
        <Route path="/accounts/:id" component={AccountsNew} />
        <Route path="/generalconfigurations" component={GeneralConfigurations} />
        <Route path="/accountingconfigurations" component={AccountingConfigurations} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/income" component={Income} />
        <Route path="/expense" component={Expense} />
        <Route path="/storehouse" component={Storehouse} />
        <Route path="/items" component={Items} />
        <Route path="/items/new" component={ItemsNew} />
        <Route path="/items/:id" component={ItemsNew} />
        <Route path="/purchases" component={Purchases} />
        <Route path="/purchases/new" component={PurchasesNew} />
        <Route path="/addpurchase/:id1/:id2" component={PurchasesNew} />
        <Route path="/purchaseinvoices" component={PurchasesList} />
        <Route path="/purchaseorders" component={PurchasesList} />
        <Route path="/sales" component={Sales} />
        <Route path="/sales/new" component={SalesNew} />
        <Route path="/addsale/:id1/:id2" component={SalesNew} />
        <Route path="/salelist" component={SalesList} />
        <Route path="/saletalaflist" component={SalesList} />
        <Route path="/comparestore" component={CompareStore} />
        <Route path="/transferitemlist" component={TransferItemList} />
        <Route path="/services" component={ServicesList} />
        <Route path="/Storeconfig" component={StoreConfig} />
        <Route path="/reportstockbalancesheet" component={InventoryBalanceReport} />
        <Route path="/boxtransactionreport" component={CashboxTransactionsReport} />
        <Route path="/profitandlossdashboard" component={ProfitLossReport} />
        <Route path="/debt" component={DebtReport} />
        <Route path="/users" component={UsersList} />
        <Route path="/groups" component={GroupsList} />
        <Route path="/employeelist" component={EmployeesList} />
        <Route path="/AddDebt" component={Debt} />
        <Route path="/sellinvoiceclusting/:id" component={UnsupportedWorkflow} />
        <Route path="/addselloffer/:id" component={UnsupportedWorkflow} />
        <Route path="/selloffer" component={UnsupportedWorkflow} />
        <Route path="/accountolddebitsell" component={Debt} />
        <Route path="/addpurchasepayment/:id" component={UnsupportedWorkflow} />
        <Route path="/addpurchaseorder/:id" component={UnsupportedWorkflow} />
        <Route path="/accountolddebitpurchase" component={Debt} />
        <Route path="/purchaseissueconfig" component={UnsupportedWorkflow} />
        <Route component={NotFound} />
        <Route path="/reports" component={Reports} />
        <Route path="/reportaccounts" component={ReportAccounts} />
        <Route path="/deletedlogs" component={DeletedLogs} />
        <Route path="/landing-preview" component={LandingPreview} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="*">
            <Router />
          </Route>
        </Switch>
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
