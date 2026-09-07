import { useQueryClient } from "@tanstack/react-query";
import { useDeleteFavorite, useListFavorites, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { Icon, IconButton, EmptyState } from "@/components/crm";
import { Link } from "wouter";
export function FavoritesDrawer({open,onClose}:{open:boolean;onClose:()=>void}){
  const query=useListFavorites(),remove=useDeleteFavorite(),client=useQueryClient();
  if(!open)return null;
  return <div className="crm-drawer-overlay" onMouseDown={onClose}><aside className="shell-drawer" onMouseDown={e=>e.stopPropagation()}><header><h3>دڵخوازەکان</h3><IconButton icon="ChromeClose" onClick={onClose}/></header><div className="shell-drawer-body">{query.data?.length?query.data.map(favorite=><div className="favorite-card" key={favorite.id}><Link href={favorite.path} onClick={onClose}><Icon name="FavoriteStar"/><span>{favorite.title}</span></Link><button aria-label="سڕینەوە" onClick={()=>remove.mutate({id:favorite.id},{onSuccess:()=>client.invalidateQueries({queryKey:getListFavoritesQueryKey()})})}><Icon name="FavoriteStarFill"/></button></div>):<EmptyState/>}</div></aside></div>;
}