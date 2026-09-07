import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { PropertyStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const STYLES: Record<PropertyStatus, string> = {
  available: "border-emerald-100 bg-emerald-50 text-emerald-800",
  hold: "border-amber-100 bg-amber-50 text-amber-800",
  booked: "border-sky-100 bg-sky-50 text-sky-800",
  sold: "border-indigo-100 bg-indigo-50 text-indigo-800",
  rented: "border-cyan-100 bg-cyan-50 text-cyan-800",
  transferred: "border-rose-100 bg-rose-50 text-rose-800",
  blocked: "border-rose-200 bg-rose-100 text-rose-800",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  const t = useTranslations("labels.propertyStatus");
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[status])}>
      {t(status)}
    </Badge>
  );
}
