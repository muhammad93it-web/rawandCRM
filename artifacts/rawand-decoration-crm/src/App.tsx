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
import DeletedLogs from './pages/deleted-logs';

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
        <Route path="/generalconfigurations" component={GeneralConfigurations} />
        <Route path="/accounting" component={Accounting} />
        <Route path="/income" component={Income} />
        <Route path="/expense" component={Expense} />
        <Route path="/storehouse" component={Storehouse} />
        <Route path="/items" component={Items} />
        <Route path="/items/new" component={ItemsNew} />
        <Route path="/purchases" component={Purchases} />
        <Route path="/purchases/new" component={PurchasesNew} />
        <Route path="/sales" component={Sales} />
        <Route path="/sales/new" component={SalesNew} />
        <Route path="/comparestore" component={CompareStore} />
        <Route path="/reports" component={Reports} />
        <Route path="/deletedlogs" component={DeletedLogs} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
