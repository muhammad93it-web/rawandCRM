import type { ReactNode } from "react";
export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return <div className="crm-page-title"><h3>{children}</h3>{actions}</div>;
}
export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="crm-section-title"><h4>{children}</h4><span /></div>;
}