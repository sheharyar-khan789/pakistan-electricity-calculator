import { routes } from "@/config/routes";

/**
 * Electricity tools listed on the homepage, /calculators and each tool's
 * "related tools" section. One list, so links never drift apart.
 */
export type ToolId = "bill-calculator" | "tou-calculator" | "unit-calculator" | "appliance-calculator" | "ac-calculator";

export type Tool = {
  id: ToolId;
  title: string;
  /** One sentence for cards. */
  summary: string;
  href: string;
  icon: "calculator" | "clock" | "gauge" | "plug" | "snowflake";
};

export const tools: readonly Tool[] = [
  {
    id: "bill-calculator",
    title: "Electricity Bill Calculator",
    summary: "Estimate a monthly bill from your units, using official NEPRA tariff rates and adjustments.",
    href: routes.electricityBillCalculator,
    icon: "calculator",
  },
  {
    id: "tou-calculator",
    title: "TOU Electricity Bill Calculator",
    summary: "Estimate a time-of-use bill for connections of 5 kW and above from peak and off-peak units.",
    href: routes.touCalculator,
    icon: "clock",
  },
  {
    id: "unit-calculator",
    title: "Electricity Unit Calculator",
    summary: "Work out units used from two meter readings, with a daily average and a monthly projection.",
    href: routes.unitCalculator,
    icon: "gauge",
  },
  {
    id: "appliance-calculator",
    title: "Appliance Electricity Calculator",
    summary: "Find how many units your appliances use from their watts and hours, and what that may cost.",
    href: routes.applianceCalculator,
    icon: "plug",
  },
  {
    id: "ac-calculator",
    title: "AC Electricity Cost Calculator",
    summary: "Estimate the units and cost of running an air conditioner from its rated power and your usage.",
    href: routes.acCalculator,
    icon: "snowflake",
  },
];

export function getTool(id: ToolId): Tool {
  const tool = tools.find((t) => t.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}

export function otherTools(id: ToolId): Tool[] {
  return tools.filter((t) => t.id !== id);
}
