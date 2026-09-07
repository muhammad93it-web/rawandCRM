import { Link,useLocation } from "wouter";
import { Icon } from "@/components/crm";
import { SECTIONS } from "@/lib/navigation";
export function Sidebar({isSidebarOpen,onNavigate}:{isSidebarOpen:boolean;onNavigate?:()=>void}){
 const [location]=useLocation();
 return <aside className={`sidebar ${isSidebarOpen?"expanded":""}`}><div className="shell-logo" aria-label="Rawand Decoration CRM"><span>R</span>{isSidebarOpen&&<b>Rawand Decoration CRM</b>}</div><nav>{SECTIONS.map(item=>{const active=item.path==="/home"?location.toLowerCase()==="/home":location.toLowerCase().startsWith(item.path.toLowerCase())||item.section!=="home"&&location.toLowerCase().includes(item.section);return <Link key={item.path} href={item.path} title={!isSidebarOpen?item.title:undefined} className={active?"active":""} onClick={onNavigate}><Icon name={item.icon}/>{isSidebarOpen&&<span>{item.title}</span>}</Link>})}</nav></aside>;
}