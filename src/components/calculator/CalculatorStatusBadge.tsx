import { CALCULATOR_STATUS_LABEL, type CalculatorStatus } from "@/data/calculators";
import { Badge } from "@/components/ui/Badge";

export function CalculatorStatusBadge({ status }: { status: CalculatorStatus }) {
  return (
    <Badge tone={status === "available" ? "brand" : "warning"}>
      <span
        aria-hidden="true"
        className={status === "available" ? "size-1.5 rounded-full bg-brand-600" : "size-1.5 rounded-full bg-volt-500"}
      />
      {CALCULATOR_STATUS_LABEL[status]}
    </Badge>
  );
}
