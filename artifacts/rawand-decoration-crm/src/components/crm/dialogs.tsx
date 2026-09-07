import type { ReactNode } from "react";
import { IconButton, AccentButton, OutlineButton } from "./buttons";
export function CrmDialog({open,onOpenChange,title,children,footer,className=""}:{open:boolean;onOpenChange:(open:boolean)=>void;title:string;children:ReactNode;footer?:ReactNode;className?:string}) {
  if(!open)return null;
  return <div className="crm-overlay" role="presentation" onMouseDown={()=>onOpenChange(false)}><section role="dialog" aria-modal="true" aria-label={title} className={`crm-dialog ${className}`} onMouseDown={e=>e.stopPropagation()}><header><h3>{title}</h3><IconButton icon="ChromeClose" aria-label="داخستن" onClick={()=>onOpenChange(false)}/></header><div className="crm-dialog-body">{children}</div>{footer&&<footer>{footer}</footer>}</section></div>;
}
export function ConfirmDialog({open,onOpenChange,onConfirm,title="دڵنیای لە سڕینەوە؟",pending=false}:{open:boolean;onOpenChange:(open:boolean)=>void;onConfirm:()=>void;title?:string;pending?:boolean}) {
  return <CrmDialog open={open} onOpenChange={onOpenChange} title={title} footer={<><AccentButton disabled={pending} onClick={onConfirm}>سڕینەوە</AccentButton><OutlineButton onClick={()=>onOpenChange(false)}>پاشگەزبوونەوە</OutlineButton></>}>{title}</CrmDialog>;
}
export function FilterDrawer({open,onOpenChange,children,onSearch,onClear,title="جیاکردنەوە"}:{open:boolean;onOpenChange:(open:boolean)=>void;children:ReactNode;onSearch?:()=>void;onClear?:()=>void;title?:string}) {
  if(!open)return null;
  return <div className="crm-drawer-overlay" onMouseDown={()=>onOpenChange(false)}><aside className="crm-filter-drawer" onMouseDown={e=>e.stopPropagation()}><header><h3>{title}</h3><IconButton icon="ChromeClose" onClick={()=>onOpenChange(false)}/></header><div className="crm-drawer-body">{children}</div><footer><OutlineButton icon="Clear" onClick={onClear}>پاشگەزبوونەوە</OutlineButton><AccentButton icon="Search" onClick={onSearch}>گەڕان</AccentButton></footer></aside></div>;
}