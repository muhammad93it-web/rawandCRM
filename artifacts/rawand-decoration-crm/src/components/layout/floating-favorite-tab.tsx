import { useQueryClient } from "@tanstack/react-query";
import { getListFavoritesQueryKey, useCreateFavorite } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Icon } from "@/components/crm";
import { findNavItem } from "@/lib/navigation";
export function FloatingFavoriteTab(){
  const [location]=useLocation(),create=useCreateFavorite(),client=useQueryClient(),nav=findNavItem(location);
  return <button className="floating-favorite" onClick={()=>create.mutate({data:{path:location,title:nav?.title??location}},{onSuccess:()=>client.invalidateQueries({queryKey:getListFavoritesQueryKey()})})}><Icon name="FavoriteStarFill"/><span>دڵخواز</span></button>;
}