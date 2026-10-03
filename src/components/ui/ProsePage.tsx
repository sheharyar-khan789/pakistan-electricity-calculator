import type { ReactNode } from "react";
import { routes } from "@/config/routes";
import { formatDate } from "@/lib/format";
import { Container } from "./Layout";
import { PageHeader } from "./PageHeader";

type ProsePageProps = {
  title: string;
  path: string;
  lead?: ReactNode;
  /** ISO date shown as "Last updated". */
  lastUpdated?: string;
  /** Intermediate breadcrumb, e.g. Guides. */
  parent?: { name: string; path: string };
  /** Optional content beside the article on large screens. */
  aside?: ReactNode;
  children: ReactNode;
};

/** Layout for long-form pages: about, methodology, legal pages. */
export function ProsePage({ title, path, lead, lastUpdated, parent, aside, children }: ProsePageProps) {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          ...(parent ? [parent] : []),
          { name: title, path },
        ]}
        title={title}
        lead={lead}
      />
      <Container className="py-10 sm:py-14">
        <div className={aside ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14" : undefined}>
          <article className="prose-content max-w-3xl">
            {lastUpdated ? (
              <p className="text-sm text-ink-500">
                Last updated: <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
              </p>
            ) : null}
            {children}
          </article>
          {aside ? <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">{aside}</aside> : null}
        </div>
      </Container>
    </>
  );
}
