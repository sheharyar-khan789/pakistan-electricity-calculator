import type { SourceReference } from "@/lib/calculator/types";
import { formatDate } from "@/lib/format";
import { DocumentIcon, ExternalLinkIcon } from "@/components/icons";

type SourceBlockProps = {
  title?: string;
  sources: readonly SourceReference[];
  /** Shown when `sources` is empty, explaining why. */
  emptyMessage?: string;
  lastVerifiedOn?: string;
};

/** Lists the official documents behind a piece of data, or says none apply yet. */
export function SourceBlock({
  title = "Sources",
  sources,
  emptyMessage = "No tariff sources are attached yet. Sources will be listed here, with publication and verification dates, when verified tariff data is connected.",
  lastVerifiedOn,
}: SourceBlockProps) {
  return (
    <aside aria-label={title} className="rounded-xl border border-line bg-ink-50/70 p-4 sm:p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
        <DocumentIcon className="size-4 text-ink-500" />
        {title}
      </div>
      {sources.length === 0 ? (
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{emptyMessage}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {sources.map((source) => (
            <li key={source.url} className="text-sm">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-start gap-1 font-medium text-brand-700 underline-offset-2 hover:underline"
              >
                {source.reference ? `${source.reference}: ` : ""}
                {source.title}
                <ExternalLinkIcon className="mt-0.5 size-3.5 shrink-0" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
              <p className="text-ink-500">
                {source.publisher}
                {source.publishedOn ? ` · Published ${formatDate(source.publishedOn)}` : null}
              </p>
            </li>
          ))}
        </ul>
      )}
      {lastVerifiedOn ? (
        <p className="mt-3 border-t border-line pt-3 text-xs text-ink-500">
          Last verified {formatDate(lastVerifiedOn)}
        </p>
      ) : null}
    </aside>
  );
}
