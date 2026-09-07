import { useEffect, useState } from "react";
import { Icon } from "@/components/crm";
export function OfflineBanner(){
  const [online,setOnline]=useState(()=>navigator.onLine);
  useEffect(()=>{const update=()=>setOnline(navigator.onLine);addEventListener("online",update);addEventListener("offline",update);return()=>{removeEventListener("online",update);removeEventListener("offline",update)}},[]);
  return online?null:<div className="offline-banner"><Icon name="WifiWarning4"/>ئینتەرنێت بەردەست نیە</div>;
}