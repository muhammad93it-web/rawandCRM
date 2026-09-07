import { IconButton } from "./buttons";
export function Pager({page,pageSize,total,onPageChange,onPageSizeChange}:{page:number;pageSize:number;total:number;onPageChange:(page:number)=>void;onPageSizeChange?:(size:number)=>void}) {
  const pages=Math.max(1,Math.ceil(total/pageSize));
  return <div className="crm-pager">
    {onPageSizeChange&&<label>Row/Page <select value={pageSize} onChange={e=>onPageSizeChange(Number(e.target.value))}>{[25,50,75,100].map(size=><option key={size}>{size}</option>)}</select></label>}
    <IconButton aria-label="کۆتایی" onClick={()=>onPageChange(pages)} disabled={page>=pages}>»</IconButton>
    <IconButton aria-label="دواتر" onClick={()=>onPageChange(Math.min(pages,page+1))} disabled={page>=pages}>‹</IconButton>
    <span>{page}</span>
    <IconButton aria-label="پێشتر" onClick={()=>onPageChange(Math.max(1,page-1))} disabled={page<=1}>›</IconButton>
    <IconButton aria-label="سەرەتا" onClick={()=>onPageChange(1)} disabled={page<=1}>«</IconButton>
  </div>;
}