"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ToolId } from "@/data/tools";
import { track } from "@/lib/analytics";

/** Link to an electricity tool that records which tool was picked (nothing else). */
export function ToolLink({
  tool,
  href,
  from,
  className,
  children,
}: {
  tool: ToolId;
  href: string;
  from: "home" | "calculators" | "related-tools";
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => track({ name: "tool_selected", tool, from })}>
      {children}
    </Link>
  );
}
