import type { ReactNode } from "react";
import { Link } from "wouter";
import { Icon } from "./icon";
import type { Mdl2IconName } from "./icons";
export interface CardLink { href: string; title: string; icon: Mdl2IconName }
export function NavTile({ href, title, icon }: CardLink) {
  return <Link href={href} className="crm-nav-tile"><span className="crm-tile-icon"><Icon name={icon} /></span><span>{title}</span></Link>;
}
export function TileGrid({ children, className="" }: { children: ReactNode; className?: string }) { return <div className={`crm-tile-grid ${className}`}>{children}</div>; }
export function LinkCard({ href, title, icon }: CardLink) {
  return <Link href={href} className="crm-link-card"><span className="crm-tile-icon"><Icon name={icon} /></span><span>{title}</span><Icon name="ChevronLeftSmall" /></Link>;
}
export function LinkCardList({ links }: { links: CardLink[] }) {
  return <div className="crm-link-list">{links.map(link => <LinkCard key={link.href} {...link} />)}</div>;
}