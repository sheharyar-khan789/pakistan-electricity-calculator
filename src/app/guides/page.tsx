import Link from "next/link";
import { routes } from "@/config/routes";
import { guides } from "@/data/guides";
import { formatDate } from "@/lib/format";
import { buildMetadata } from "@/lib/seo/metadata";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Layout";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/States";
import { BookIcon } from "@/components/icons";

export const metadata = buildMetadata({
  title: "Electricity Bill Guides",
  description:
    "Plain-language guides to electricity bills, units, tariffs and charges in Pakistan.",
  path: routes.guides,
  // An empty directory is thin content; index it once guides exist.
  indexable: guides.length > 0,
});

export default function GuidesPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[
          { name: "Home", path: routes.home },
          { name: "Guides", path: routes.guides },
        ]}
        title="Electricity Bill Guides"
        lead="Plain-language explanations of electricity bills, units, tariffs and charges in Pakistan."
      />
      <Container className="py-8 sm:py-12">
        {guides.length === 0 ? (
          <EmptyState
            icon={<BookIcon />}
            title="Guides are being written"
            description="Each guide will be checked against official sources before it is published. In the meantime, the methodology explains how bill estimates will work."
            action={
              <ButtonLink href={routes.methodology} variant="secondary">
                Read the methodology
              </ButtonLink>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {guides.map((guide) => (
              <li key={guide.slug}>
                <Link
                  href={`${routes.guides}/${guide.slug}`}
                  className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-[var(--shadow-raised)]"
                >
                  <h2 className="text-lg font-semibold text-ink-950">{guide.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{guide.description}</p>
                  <p className="mt-auto pt-4 text-xs text-ink-500">Reviewed {formatDate(guide.reviewedOn)}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
