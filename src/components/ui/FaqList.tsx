import type { FaqEntry } from "@/lib/seo/schema";
import { ChevronDownIcon } from "@/components/icons";

/**
 * Accessible FAQ built on native <details>/<summary>: keyboard and
 * screen-reader support with zero JavaScript. Answers stay in the HTML, so
 * they are crawlable and match any FAQPage structured data exactly.
 */
export function FaqList({ items }: { items: readonly FaqEntry[] }) {
  return (
    <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]">
      {items.map((item) => (
        <details key={item.question} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-left font-semibold text-ink-900 transition-colors hover:bg-ink-50 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
            <span className="text-[0.9375rem] leading-snug sm:text-base">{item.question}</span>
            <ChevronDownIcon className="mt-0.5 size-5 shrink-0 text-ink-500 transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <div className="px-5 pb-5 text-[0.9375rem] leading-relaxed text-ink-600 sm:px-6">
            <p>{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
