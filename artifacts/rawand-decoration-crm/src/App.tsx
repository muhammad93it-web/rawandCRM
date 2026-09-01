import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { AppLayout } from '@/components/layout/app-layout';

import Dashboard from './pages/dashboard';
import Accounts from './pages/accounts';
import Items from './pages/items';
import Sales from './pages/sales';
import SalesNew from './pages/sales-new';
import Purchases from './pages/purchases';
import PurchasesNew from './pages/purchases-new';
import Transactions from './pages/transactions';

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
        <Route path="/" component={Dashboard} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/items" component={Items} />
        <Route path="/sales" component={Sales} />
        <Route path="/sales/new" component={SalesNew} />
        <Route path="/purchases" component={Purchases} />
        <Route path="/purchases/new" component={PurchasesNew} />
        <Route path="/transactions" component={Transactions} />
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
