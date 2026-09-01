import { type LucideIcon } from "lucide-react";
import { Link } from "wouter";

interface MenuCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  className?: string;
}

export function MenuCard({ title, icon: Icon, href, className = "" }: MenuCardProps) {
  return (
    <Link href={href} className={`group block ${className}`}>
      <div className="flex h-12 items-center rounded-sm border border-gray-200 bg-white transition-colors hover:border-[#00b0f0]">
        <div className="flex h-full w-12 shrink-0 items-center justify-center border-l border-gray-100 text-[#00b0f0]">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="flex flex-1 items-center justify-center px-2 text-[13px] font-normal text-gray-800">
          {title}
        </div>
      </div>
    </Link>
  );
}

interface MenuSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function MenuSection({ title, children }: MenuSectionProps) {
  return (
    <div className="mb-6">
      {title && (
        <div className="mb-3 text-right">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}

export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
      <h1 className="text-lg font-normal text-gray-800">{title}</h1>
      <div></div>
    </div>
  );
}
