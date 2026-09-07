import { useEffect, useState } from "react";
import { Icon } from "./icon";
import type { Mdl2IconName } from "./icons";
export interface CrmTab { key:string; label:string; icon?:Mdl2IconName }
export function CrmTabs({tabs,value,onChange}:{tabs:CrmTab[];value?:string;onChange?:(key:string)=>void}) {
  const fromHash = () => new URLSearchParams(location.hash.slice(1)).get("tab") ?? tabs[0]?.key ?? "";
  const [internal,setInternal] = useState(fromHash);
  const selected = value ?? internal;
  const choose = (key:string) => { if (value===undefined) setInternal(key); location.hash=`tab=${encodeURIComponent(key)}`; onChange?.(key); };
  useEffect(()=>{ const listener=()=>value===undefined&&setInternal(fromHash()); addEventListener("hashchange",listener); return()=>removeEventListener("hashchange",listener); },[value]);
  return <div className="crm-tabs" role="tablist">{tabs.map(tab=><button role="tab" aria-selected={selected===tab.key} className={selected===tab.key?"active":""} key={tab.key} onClick={()=>choose(tab.key)}>{tab.icon&&<Icon name={tab.icon}/>} {tab.label}</button>)}</div>;
}