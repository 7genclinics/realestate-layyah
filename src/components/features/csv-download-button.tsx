"use client";

import { Download } from "lucide-react";
import { toCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";

export function CsvDownloadButton({
  filename,
  headers,
  rows,
}: {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
}) {
  function download() {
    const csv = toCsv(headers, rows);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={download}>
      <Download className="size-4" />
      Excel / CSV
    </Button>
  );
}
