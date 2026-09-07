import { useState,type ReactNode } from "react";
import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";
import { OfflineBanner } from "./offline-banner";
import { FloatingFavoriteTab } from "./floating-favorite-tab";
export function AppLayout({children}:{children:ReactNode}){
 const [expanded,setExpanded]=useState(false);
 return <div className={`app-shell ${expanded?"sidebar-expanded":""}`} dir="rtl"><Sidebar isSidebarOpen={expanded} onNavigate={()=>innerWidth<768&&setExpanded(false)}/><main><TopBar onToggleSidebar={()=>setExpanded(v=>!v)}/><OfflineBanner/><article className="app-article zoom100">{children}</article></main><FloatingFavoriteTab/></div>;
}