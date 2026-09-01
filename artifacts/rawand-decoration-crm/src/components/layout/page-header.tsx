import { Link } from "wouter";
import { ChevronLeft } from "lucide-react";

export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2 space-x-reverse">
        {items.map((item, index) => (
          <li key={item.name}>
            <div className="flex items-center">
              {index > 0 && (
                <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground me-2" aria-hidden="true" />
              )}
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-foreground" aria-current="page">
                  {item.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHeader({ title, description, actions, breadcrumbs }: { title: string; description?: string; actions?: React.ReactNode; breadcrumbs?: { name: string; href?: string }[] }) {
  return (
    <div className="mb-8">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>
        {actions && (
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
