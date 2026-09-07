import { useEffect } from "react";
import { Route, useLocation } from "wouter";
import Home from "@/pages/home";
import LandingPreview from "@/pages/landing-preview";
import DeletedLogs from "@/pages/deleted-logs";
import { stubRoutes } from "./stub";

function RootRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation("/home", { replace: true }), [setLocation]);
  return null;
}

/** Area: shell — home, profile, password, deleted-logs index. Owner: shell. */
export const shellRoutes = [
  <Route key="/" path="/" component={RootRedirect} />,
  <Route key="/home" path="/home" component={Home} />,
  <Route key="/deletedlogs" path="/deletedlogs" component={DeletedLogs} />,
  <Route key="/landing-preview" path="/landing-preview" component={LandingPreview} />,
  ...stubRoutes(["/ProfileUser", "/changepassword"]),
];
