import { useState } from "react";
import { useSessionLogin } from "@workspace/api-client-react";
import { AccentButton,TextField } from "@/components/crm";
export function LockScreen({open,username,onUnlock}:{open:boolean;username:string;onUnlock:()=>void}){
 const [password,setPassword]=useState(""),[error,setError]=useState(""),login=useSessionLogin();
 if(!open)return null;
 return <div className="lock-screen"><form onSubmit={e=>{e.preventDefault();setError("");login.mutate({data:{username,password}},{onSuccess:()=>{setPassword("");onUnlock()},onError:()=>setError("وشەی نهێنی هەڵەیە")})}}><h2>{username}</h2><TextField type="password" value={password} onChange={e=>setPassword(e.target.value)}/>{error&&<p>{error}</p>}<AccentButton type="submit" disabled={!password||login.isPending}>چوونەژوورەوە</AccentButton></form></div>;
}