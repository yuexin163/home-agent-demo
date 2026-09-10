import Link from "next/link";

interface BreadcrumbItem { label: string; href?: string }

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-stone-500" aria-label="面包屑">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true" className="text-stone-300">/</span>}
          {item.href ? <Link href={item.href} className="hover:text-emerald-800">{item.label}</Link> : <span className="text-stone-800">{item.label}</span>}
        </span>
      ))}
    </nav>
  );
}
