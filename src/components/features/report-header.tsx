import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CsvDownloadButton } from "@/components/features/csv-download-button";
import { PrintButton } from "@/components/features/print-button";
import { Button } from "@/components/ui/button";

export function ReportHeader({
  title,
  description,
  filename,
  headers,
  rows,
  children,
}: {
  title: string;
  description: string;
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:block">
        <div className="flex items-start gap-3">
          <Button
            render={<Link href="/reports" />}
            variant="outline"
            size="icon"
            className="mt-0.5 shrink-0 print:hidden"
            aria-label="Back to reports"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <CsvDownloadButton filename={filename} headers={headers} rows={rows} />
          <PrintButton />
          <Button render={<Link href="/reports" />} variant="outline">
            All reports
          </Button>
        </div>
      </div>
      {children ? <div className="print:hidden">{children}</div> : null}
    </div>
  );
}


export function ReportTotals({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, index) => {
        const tints = [
          "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
          "border-sky-100 bg-gradient-to-br from-sky-50 to-white",
          "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
          "border-rose-100 bg-gradient-to-br from-rose-50 to-white",
        ];
        return (
          <div
            key={item.label}
            className={`rounded-xl border px-4 py-3 ${tints[index % tints.length]}`}
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="font-heading text-lg font-semibold">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}
