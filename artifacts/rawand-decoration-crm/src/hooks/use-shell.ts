import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useListFavorites } from "@workspace/api-client-react";
import { useUsdRate } from "./use-usd-rate";

export function useFavorites() {
  return useListFavorites();
}

export function useCurrencyRate() {
  return useUsdRate();
}

export function useAuthUser() {
  return useQuery<{ id:number;username:string;displayName:string;status:string }>({
    queryKey: ["/api/session/me"],
    queryFn: async () => {
      const response = await fetch("/api/session/me", { credentials: "same-origin" });
      if (!response.ok) throw new Error("Authentication required");
      return response.json();
    },
    retry: false,
  });
}

export function useUiPrefs() {
  const [language,setLanguage]=useState(()=>localStorage.getItem("rawand-language")??"ku");
  const [fontSize,setFontSize]=useState(()=>localStorage.getItem("rawand-font-scale")??"100");
  const [theme,setTheme]=useState(()=>localStorage.getItem("rawand-theme")??"light");
  useEffect(()=>{localStorage.setItem("rawand-language",language)},[language]);
  useEffect(()=>{localStorage.setItem("rawand-font-scale",fontSize)},[fontSize]);
  useEffect(()=>{localStorage.setItem("rawand-theme",theme);document.documentElement.classList.toggle("dark",theme==="dark")},[theme]);
  return {language,setLanguage,fontSize,setFontSize,theme,setTheme};
}