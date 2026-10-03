import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { ChevronRightIcon } from "@/components/icons";
import { breadcrumbListSchema, type BreadcrumbItem } from "@/lib/seo/schema";

/**
 * Visible breadcrumb trail plus matching BreadcrumbList structured data.
 * The last item is the current page and is not a link.
 */
export function Breadcrumbs({ items }: { items: readonly BreadcrumbItem[] }) {
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-ink-500">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.path} className="flex items-center gap-1.5">
                {isLast ? (
                  <span aria-current="page" className="font-medium text-ink-700">
                    {item.name}
                  </span>
                ) : (
                  <>
                    <Link
                      href={item.path}
                      className="rounded-sm transition-colors hover:text-brand-700 hover:underline hover:underline-offset-2"
                    >
                      {item.name}
                    </Link>
                    <ChevronRightIcon className="size-3.5 text-ink-400" />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={breadcrumbListSchema(items)} />
    </>
  );
}
