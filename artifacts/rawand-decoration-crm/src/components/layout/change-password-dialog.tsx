import { useState } from "react";
import { useChangePassword } from "@workspace/api-client-react";
import { AccentButton,CrmDialog,TextField } from "@/components/crm";
export function ChangePasswordDialog({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}){
 const [old,setOld]=useState(""),[next,setNext]=useState(""),[confirm,setConfirm]=useState(""),mutation=useChangePassword();
 return <CrmDialog open={open} onOpenChange={onOpenChange} title="گۆڕینی وشەی نهێنی"><TextField label="وشەی نهێنی کۆن" type="password" value={old} onChange={e=>setOld(e.target.value)}/><TextField label="وشەی نهێنی نوێ" type="password" value={next} onChange={e=>setNext(e.target.value)}/><TextField label="ووشەی نەهێنی بسەلمێنه" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}/><AccentButton disabled={!old||!next||next!==confirm||mutation.isPending} onClick={()=>mutation.mutate({data:{currentPassword:old,newPassword:next}},{onSuccess:()=>onOpenChange(false)})}>گۆڕینی وشەی نهێنی</AccentButton></CrmDialog>;
}