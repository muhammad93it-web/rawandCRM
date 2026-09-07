import { iconComponent, type Mdl2IconName } from "./icons";
export function Icon({ name, size = 16, className }: { name: Mdl2IconName; size?: number; className?: string }) {
  const Component = iconComponent(name);
  return <Component aria-hidden fontSize={size} className={className} />;
}