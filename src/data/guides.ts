/**
 * Educational guides. Each entry must have a real page at /guides/<slug>,
 * written from verified sources. Do not add placeholder or thin guides.
 */
export type Guide = {
  slug: string;
  title: string;
  description: string;
  /** ISO date first published. */
  publishedOn: string;
  /** ISO date last reviewed for accuracy. */
  reviewedOn: string;
};

export const guides: readonly Guide[] = [
  {
    slug: "electricity-bill-reference-number",
    title: "How to Find Your Electricity Bill Reference Number",
    description:
      "Which number each Pakistani electricity provider’s official bill page accepts: 14-digit reference numbers, Customer IDs and K-Electric account numbers.",
    publishedOn: "2026-10-01",
    reviewedOn: "2026-10-01",
  },
  {
    slug: "understand-your-electricity-bill",
    title: "Understand Your Electricity Bill",
    description:
      "What makes up a Pakistani electricity bill: units, slabs, consumer status, fixed charges, fuel and quarterly adjustments, and taxes.",
    publishedOn: "2026-10-01",
    reviewedOn: "2026-10-01",
  },
];

export function getGuide(slug: string): Guide {
  const guide = guides.find((g) => g.slug === slug);
  if (!guide) throw new Error(`Unknown guide: ${slug}`);
  return guide;
}
