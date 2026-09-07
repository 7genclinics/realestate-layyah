"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileUp, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { importCustomers } from "@/lib/actions/customers";
import { csvRowsToObjects, exportToCsv, parseCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ALIASES: Record<string, string> = {
  name: "full_name",
  customer: "full_name",
  customer_name: "full_name",
  fullname: "full_name",
  full_name: "full_name",
  phone: "phone",
  mobile: "phone",
  cell: "phone",
  contact: "phone",
  contact_no: "phone",
  phone_primary: "phone",
  primary_phone: "phone",
  phone1: "phone",
  relation: "relation",
  guardian: "guardian_name",
  guardian_name: "guardian_name",
  father: "guardian_name",
  father_name: "guardian_name",
  caste: "caste",
  id_type: "id_type",
  cnic: "id_number",
  id_number: "id_number",
  id_no: "id_number",
  nic: "id_number",
  national_id: "id_number",
  phone_secondary: "phone_secondary",
  secondary_phone: "phone_secondary",
  alt_phone: "phone_secondary",
  phone2: "phone_secondary",
  address: "address",
  source: "source",
  stage: "stage",
  status: "stage",
  notes: "notes",
  remarks: "notes",
  comment: "notes",
  comments: "notes",
};

const TEMPLATE_HEADERS = [
  "full_name",
  "phone",
  "relation",
  "guardian_name",
  "id_type",
  "id_number",
  "phone_secondary",
  "address",
  "source",
  "stage",
  "notes",
];

type Row = Record<string, string>;

function isValid(row: Row) {
  return (row.full_name?.length ?? 0) >= 2 && (row.phone?.length ?? 0) >= 7;
}

export function CustomerImportDialog() {
  const router = useRouter();
  const t = useTranslations("customers");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tStage = useTranslations("labels.customerStage");
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter(isValid);
  const invalidCount = rows.length - validRows.length;

  function reset() {
    setRows([]);
    setFileName("");
    setParseError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file: File) {
    setParseError(null);
    try {
      const text = await file.text();
      const matrix = parseCsv(text);
      if (matrix.length < 2) {
        setParseError(t("parseNoRows"));
        setRows([]);
        return;
      }
      const objs = csvRowsToObjects(matrix, ALIASES);
      if (!objs.some((o) => "full_name" in o) || !objs.some((o) => "phone" in o)) {
        setParseError(t("parseColumns"));
      }
      setRows(objs);
      setFileName(file.name);
    } catch {
      setParseError(t("parseRead"));
      setRows([]);
    }
  }

  function downloadTemplate() {
    exportToCsv("customers-template.csv", TEMPLATE_HEADERS, [
      ["Ahmed Ali", "03001234567", "s_o", "Bashir Ahmed", "cnic", "35202-1234567-1", "", "Lahore", "walk_in", "lead", "Interested in 5 marla"],
    ]);
  }

  function handleImport() {
    startTransition(async () => {
      const result = await importCustomers(validRows);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      const skipped = result.failed.length + invalidCount;
      toast.success(
        tToasts("customersImported", {
          count: result.inserted,
          skipped: skipped > 0 ? t("importedSkipped", { count: skipped }) : "",
        }),
      );
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="size-4" />
        {tForms("importCsv")}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("importTitle")}</DialogTitle>
          <DialogDescription>
            {t("importHint")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <Download className="size-3.5" />
              {t("downloadTemplate")}
            </button>
            {fileName ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
                {t("clear")}
              </button>
            ) : null}
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-input bg-muted/30 px-4 py-8 text-center transition-colors hover:bg-muted/50">
            <FileUp className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              {fileName || t("chooseCsv")}
            </span>
            <span className="text-xs text-muted-foreground">
              {fileName ? t("rowsDetected", { count: rows.length }) : t("clickBrowse")}
            </span>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>

          {parseError ? (
            <p className="rounded-[8px] bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {parseError}
            </p>
          ) : null}

          {rows.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs">
                <span className="font-medium text-emerald-600">
                  {t("ready", { count: validRows.length })}
                </span>
                {invalidCount > 0 ? (
                  <span className="text-amber-600">
                    {t("skippedMissing", { count: invalidCount })}
                  </span>
                ) : null}
              </div>
              <div className="max-h-48 overflow-auto rounded-[8px] border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
                    <tr>
                      <th className="px-2 py-1.5 font-medium">{tCommon("name")}</th>
                      <th className="px-2 py-1.5 font-medium">{tCommon("phone")}</th>
                      <th className="px-2 py-1.5 font-medium">{t("stage")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className={isValid(r) ? "" : "bg-amber-50/60"}>
                        <td className="px-2 py-1.5">{r.full_name || tCommon("dash")}</td>
                        <td className="px-2 py-1.5">{r.phone || tCommon("dash")}</td>
                        <td className="px-2 py-1.5">{r.stage ? tStage(r.stage) : tStage("lead")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 50 ? (
                <p className="text-[11px] text-muted-foreground">
                  {t("showingFirst", { count: rows.length })}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              disabled={isPending}
            >
              {tForms("cancel")}
            </Button>
            <Button onClick={handleImport} disabled={isPending || validRows.length === 0}>
              {isPending
                ? tForms("importing")
                : t("importCustomers", { count: validRows.length })}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
