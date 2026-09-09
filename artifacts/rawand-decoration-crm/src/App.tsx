import { useEffect } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { Toaster } from 'sonner';

import { AppLayout } from '@/components/layout/app-layout';

// Route tables — one file per area (src/routes/<area>.tsx); each area edits only its own file.
import { shellRoutes } from "./routes/shell";
import { configOrgRoutes } from "./routes/config-org";
import { accountsRoutes } from "./routes/accounts";
import { itemsRoutes } from "./routes/items";
import { salesRoutes } from "./routes/sales";
import { purchasesRoutes } from "./routes/purchases";
import { accountingRoutes } from "./routes/accounting";
import { reportsRoutes } from "./routes/reports";
import Login from "./pages/login";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
      <p className="text-lg text-muted-foreground">ئەم پەڕەیە نەدۆزرایەوە.</p>
    </div>
  );
}

const caseInsensitiveParser = (route: string, loose?: boolean) => {
  const keys: string[] = [];
  if (route === "*") return { pattern: /^.*$/i, keys };
  const source = route.split("/").map(segment => {
    if (segment.startsWith(":")) { keys.push(segment.slice(1)); return "([^/]+)"; }
    return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("/");
  return { pattern: new RegExp(`^${source}${loose ? "(?=/|$)" : "/?$"}`, "i"), keys };
};

function Router() {
  return (
    <AppLayout>
      <Switch>
        {shellRoutes}
        {configOrgRoutes}
        {accountsRoutes}
        {itemsRoutes}
        {salesRoutes}
        {purchasesRoutes}
        {accountingRoutes}
        {reportsRoutes}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function ProtectedRouter() {
  const [, setLocation] = useLocation();
  const session = useQuery({
    queryKey: ['/api/session/me'],
    queryFn: async () => {
      const response = await fetch('/api/session/me', { credentials: 'same-origin' });
      if (!response.ok) {
        throw new Error('Authentication required');
      }
      return response.json();
    },
    retry: false,
  });

  useEffect(() => {
    if (session.isError) {
      setLocation('/login');
    }
  }, [session.isError, setLocation]);

  if (session.isPending || session.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] text-sm text-[#0f4c81]">
        {session.isError ? 'دەگەڕێتەوە بۆ login...' : 'لە بارکردنی session ـدایە...'}
      </div>
    );
  }

  return <Router />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')} parser={caseInsensitiveParser}>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="*">
            <ProtectedRouter />
          </Route>
        </Switch>
      </WouterRouter>
      <Toaster position="top-center" richColors dir="rtl" />
    </QueryClientProvider>
  );
}

export default App;
