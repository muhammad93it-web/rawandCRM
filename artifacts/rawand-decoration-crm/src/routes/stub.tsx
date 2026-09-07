import { Route, useLocation } from "wouter";
import { EmptyState, PageTitle } from "@/components/crm";
import { findNavItem } from "@/lib/navigation";

/** Placeholder for routes that are not implemented yet (title from the navigation registry). */
export function StubPage() {
  const [location] = useLocation();
  return <><PageTitle>{findNavItem(location)?.title ?? location}</PageTitle><EmptyState /></>;
}

/** Helper: one <Route> per path, all rendering StubPage. */
export const stubRoutes = (paths: string[]) => paths.map(path => <Route key={path} path={path} component={StubPage} />);
