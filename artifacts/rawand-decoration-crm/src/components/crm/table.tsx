import { useMemo, useState, type ReactNode } from "react";
import { EmptyState } from "./display";
import { Pager } from "./pager";
import { Icon } from "./icon";
export interface DataColumn<T> { key:string;header:string;sortable?:boolean;align?:"start"|"center"|"end"|"number";render?:(row:T,index:number)=>ReactNode;hidden?:boolean }
export function Toolbar({right,left}:{right?:ReactNode;left?:ReactNode}) { return <div className="crm-toolbar"><div>{right}</div><div>{left}</div></div>; }
export function DataTable<T>({columns,rows,searchable=false,searchText,onFilter,emptyText,footer,rowActions,dense=false,loading=false,pageSize:initialSize=25}:{
  columns:DataColumn<T>[];rows:T[];searchable?:boolean;searchText?:(row:T)=>string;onFilter?:()=>void;emptyText?:string;footer?:ReactNode;rowActions?:(row:T)=>ReactNode;dense?:boolean;loading?:boolean;pageSize?:number;
}) {
  const [sort,setSort]=useState<{key:string;direction:1|-1}|null>(null),[query,setQuery]=useState(""),[page,setPage]=useState(1),[pageSize,setPageSize]=useState(initialSize);
  const [hidden,setHidden]=useState(()=>new Set(columns.filter(c=>c.hidden).map(c=>c.key)));
  const visible=columns.filter(c=>!hidden.has(c.key));
  const prepared=useMemo(()=>{ let result=query&&searchText?rows.filter(row=>searchText(row).toLocaleLowerCase().includes(query.toLocaleLowerCase())):[...rows]; if(sort){result.sort((a,b)=>String((a as Record<string,unknown>)[sort.key]??"").localeCompare(String((b as Record<string,unknown>)[sort.key]??""),undefined,{numeric:true})*sort.direction)} return result;},[rows,query,searchText,sort]);
  const paged=prepared.slice((page-1)*pageSize,page*pageSize);
  return <div className={`crm-data-table ${dense?"dense":""}`}>
    {(searchable||onFilter)&&<Toolbar right={<>{searchable&&<label className="crm-table-search"><Icon name="Search"/><input placeholder="گەڕان" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}}/></label>}<details className="crm-column-picker"><summary>شاردنەوەی کۆڵۆمەکان</summary><div>{columns.map(column=><label key={column.key}><input type="checkbox" checked={!hidden.has(column.key)} onChange={()=>setHidden(current=>{const next=new Set(current);next.has(column.key)?next.delete(column.key):next.add(column.key);return next})}/>{column.header}</label>)}</div></details></>} left={onFilter&&<button className="crm-button crm-outline" onClick={onFilter}><Icon name="Filter"/>جیاکردنەوە</button>}/>}
    <div className="crm-table-scroll"><table><thead><tr>{rowActions&&<th aria-label="کردارەکان"/>}{visible.map(column=><th key={column.key} className={`align-${column.align??"start"}`} onClick={()=>column.sortable&&setSort(current=>({key:column.key,direction:current?.key===column.key&&current.direction===1?-1:1}))}>{column.header}{column.sortable&&<Icon name="Sort"/>}</th>)}</tr></thead>
    <tbody>{loading?Array.from({length:5},(_,i)=><tr key={i}>{Array.from({length:visible.length+(rowActions?1:0)},(_,j)=><td key={j}><span className="crm-skeleton"/></td>)}</tr>):paged.length?paged.map((row,index)=><tr key={index}>{rowActions&&<td className="crm-actions">{rowActions(row)}</td>}{visible.map(column=><td key={column.key} className={`align-${column.align??"start"}`}>{column.render?column.render(row,index):(row as Record<string,ReactNode>)[column.key]}</td>)}</tr>):<tr><td colSpan={visible.length+(rowActions?1:0)}><EmptyState text={emptyText}/></td></tr>}</tbody>
    {footer&&<tfoot><tr><td colSpan={visible.length+(rowActions?1:0)}>{footer}</td></tr></tfoot>}</table></div>
    <Pager page={page} pageSize={pageSize} total={prepared.length} onPageChange={setPage} onPageSizeChange={size=>{setPageSize(size);setPage(1)}}/>
  </div>;
}