import type { ConsumerCategoryId } from "@/lib/calculator/types";

/**
 * Broad consumer categories used by electricity tariffs in Pakistan.
 *
 * Sub-categories, tariff codes and status options (which differ by tariff
 * revision) are intentionally NOT listed here. They are declared per engine
 * in Phase 2, once verified against the applicable tariff documents.
 */
export type ConsumerCategory = {
  id: ConsumerCategoryId;
  label: string;
  description: string;
};

export const consumerCategories: readonly ConsumerCategory[] = [
  {
    id: "residential",
    label: "Residential",
    description: "Homes and domestic connections.",
  },
  {
    id: "commercial",
    label: "Commercial",
    description: "Shops, offices and other businesses.",
  },
  {
    id: "industrial",
    label: "Industrial",
    description: "Factories and industrial connections.",
  },
  {
    id: "agricultural",
    label: "Agricultural",
    description: "Tube wells and farm connections.",
  },
];

export const DEFAULT_CONSUMER_CATEGORY: ConsumerCategoryId = "residential";

export function isConsumerCategoryId(value: string): value is ConsumerCategoryId {
  return consumerCategories.some((c) => c.id === value);
}

export function getConsumerCategory(id: ConsumerCategoryId): ConsumerCategory {
  const category = consumerCategories.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown consumer category: ${id}`);
  return category;
}
