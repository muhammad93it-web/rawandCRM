import type { ReactNode } from "react";
import { formatDate, formatMoney, formatQty } from "@/lib/format";
import { Icon } from "./icon";
export function StatusChip({children,tone="neutral"}:{children:ReactNode;tone?:"success"|"neutral"|"danger"}) { return <span className={`crm-chip crm-chip-${tone}`}>{children}</span>; }
export function KpiCard({title,value,icon,colour}:{title:string;value:ReactNode;icon:Parameters<typeof Icon>[0]["name"];colour?:string}) { return <div className="crm-kpi" style={{borderColor:colour}}><Icon name={icon}/><span>{title}</span><strong>{value}</strong></div>; }
export function Money({value,currency="IQD"}:{value:number|string|null;currency?:"IQD"|"USD"}) { return <span dir="ltr">{formatMoney(value,{currency})}</span>; }
export function Qty({value}:{value:number|string|null}) { return <span dir="ltr">{formatQty(value)}</span>; }
export function DateText({value}:{value:string|Date|null}) { return <time dir="ltr">{formatDate(value)}</time>; }
export function PrintFrame({children,className=""}:{children:ReactNode;className?:string}) { return <div className={`crm-print-frame ${className}`}>{children}</div>; }
export function EmptyState({text="هیچ زانیاریەک بەردەست نییە"}:{text?:string}) { return <div className="crm-empty"><Icon name="ReportWarning"/><span>{text}</span></div>; }