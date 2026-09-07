import { Route } from "wouter";
import Reports from "@/pages/reports";
import ReportSuitePage, { reportDefinitions } from "@/pages/report-suite";

/** Area: reports — the reports index and every report page. */
export const reportsRoutes = [
  <Route key="/reports" path="/reports" component={Reports} />,
  ...reportDefinitions.map(({ path }) => <Route key={`/${path}`} path={`/${path}`} component={ReportSuitePage} />),
];
