import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { Container } from "./Layout";
import type { BreadcrumbItem } from "@/lib/seo/schema";

type PageHeaderProps = {
  breadcrumbs: readonly BreadcrumbItem[];
  title: string;
  lead?: ReactNode;
  /** Rendered above the title, e.g. a status badge. */
  meta?: ReactNode;
  /** Rendered below the lead, e.g. buttons. */
  children?: ReactNode;
};

/** Standard inner-page header: breadcrumbs, the page's single H1, and a lead. */
export function PageHeader({ breadcrumbs, title, lead, meta, children }: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden border-b border-line bg-surface">
      <div aria-hidden="true" className="bg-grid-light absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <Container className="relative py-8 sm:py-12">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-6 max-w-3xl">
          {meta ? <div className="mb-4 flex flex-wrap gap-2">{meta}</div> : null}
          <h1 className="text-balance text-3xl font-semibold tracking-tight text-ink-950 sm:text-4xl">
            {title}
          </h1>
          {lead ? (
            <div className="mt-4 text-pretty text-base leading-relaxed text-ink-600 sm:text-lg">{lead}</div>
          ) : null}
          {children ? <div className="mt-6">{children}</div> : null}
        </div>
      </Container>
    </header>
  );
}
