"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Ruler, Package, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  addMaterialItem,
  addMeasurementEntry,
  deleteMaterialItem,
  deleteMeasurementEntry,
} from "@/lib/actions/contracts";
import { CONTRACT_UNIT_LABELS } from "@/lib/constants";
import type { MaterialItem, MeasurementEntry } from "@/lib/database.types";
import { formatDate, formatPkr } from "@/lib/format";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ContractDepth({
  contractId,
  canManage,
  measurements,
  materials,
}: {
  contractId: string;
  canManage: boolean;
  measurements: MeasurementEntry[];
  materials: MaterialItem[];
}) {
  const t = useTranslations("contracts");
  const tCommon = useTranslations("common");
  const tUnit = useTranslations("labels.contractUnit");
  const measuredTotal = measurements.reduce((s, m) => s + Number(m.amount), 0);
  const materialTotal = materials.reduce((s, m) => s + Number(m.amount), 0);

  return (
    <div className="space-y-6">
      {/* Measurement Book */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Ruler className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("measurementBook")}</h2>
          </div>
          {canManage ? <MeasurementForm contractId={contractId} /> : null}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tCommon("date")}</TableHead>
              <TableHead>{tCommon("description")}</TableHead>
              <TableHead>{tCommon("unit")}</TableHead>
              <TableHead className="text-right">{t("colQty")}</TableHead>
              <TableHead className="text-right">{t("colRate")}</TableHead>
              <TableHead className="text-right">{tCommon("amount")}</TableHead>
              {canManage ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {measurements.length ? (
              measurements.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(m.entry_date)}
                  </TableCell>
                  <TableCell className="font-medium">{m.description}</TableCell>
                  <TableCell className="text-xs">
                    {tUnit(m.unit)}
                  </TableCell>
                  <TableCell className="text-right">{Number(m.quantity).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatPkr(m.rate)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPkr(m.amount)}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <DeleteLineButton
                        onDelete={() => deleteMeasurementEntry(m.id, contractId)}
                        label={t("deleteMeasurement")}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="py-8 text-center text-muted-foreground">
                  {t("emptyMeasurements")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {measurements.length ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-semibold">
                  {t("totalMeasured")}
                </TableCell>
                <TableCell className="text-right font-bold">{formatPkr(measuredTotal)}</TableCell>
                {canManage ? <TableCell /> : null}
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </div>

      {/* Materials */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("materials")}</h2>
          </div>
          {canManage ? <MaterialForm contractId={contractId} /> : null}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("colMaterial")}</TableHead>
              <TableHead>{tCommon("unit")}</TableHead>
              <TableHead className="text-right">{t("colOrdered")}</TableHead>
              <TableHead className="text-right">{t("colReceived")}</TableHead>
              <TableHead className="text-right">{t("colRate")}</TableHead>
              <TableHead className="text-right">{t("colValue")}</TableHead>
              {canManage ? <TableHead className="w-10" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.length ? (
              materials.map((m) => (
                <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    {m.name}
                    {m.notes ? (
                      <span className="block text-xs text-muted-foreground">{m.notes}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs">{m.unit || "—"}</TableCell>
                  <TableCell className="text-right">{Number(m.quantity_ordered).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Number(m.quantity_received).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{formatPkr(m.rate)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatPkr(m.amount)}</TableCell>
                  {canManage ? (
                    <TableCell>
                      <DeleteLineButton
                        onDelete={() => deleteMaterialItem(m.id, contractId)}
                        label={t("deleteMaterial", { name: m.name })}
                      />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="py-8 text-center text-muted-foreground">
                  {t("emptyMaterials")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {materials.length ? (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-semibold">
                  {t("totalMaterial")}
                </TableCell>
                <TableCell className="text-right font-bold">{formatPkr(materialTotal)}</TableCell>
                {canManage ? <TableCell /> : null}
              </TableRow>
            </TableFooter>
          ) : null}
        </Table>
      </div>
    </div>
  );
}

function DeleteLineButton({
  onDelete,
  label,
}: {
  onDelete: () => Promise<{ error: string | null }>;
  label: string;
}) {
  const router = useRouter();
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function handle() {
    if (!window.confirm(label)) return;
    startTransition(async () => {
      const result = await onDelete();
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(tToasts("removed"));
        router.refresh();
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={handle}
      disabled={isPending}
      className="text-muted-foreground hover:text-destructive"
      title={tCommon("delete")}
    >
      <Trash2 className="size-3.5" />
    </Button>
  );
}

function MeasurementForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const t = useTranslations("contracts");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const tUnit = useTranslations("labels.contractUnit");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [entryDate, setEntryDate] = useState(today());
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState<string>("foot");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");

  const amount = (Number(quantity) || 0) * (Number(rate) || 0);

  function submit() {
    startTransition(async () => {
      const result = await addMeasurementEntry({
        contract_id: contractId,
        entry_date: entryDate,
        description,
        unit,
        quantity,
        rate,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tToasts("measurementRecorded"));
      setDescription("");
      setQuantity("");
      setRate("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" className="h-7 text-xs rounded-md" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        {tForms("addMeasurement")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("recordMeasurement")}</DialogTitle>
          <DialogDescription>{t("recordHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-date">{tCommon("date")}</Label>
              <Input id="m-date" type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-unit">{tCommon("unit")}</Label>
              <select id="m-unit" value={unit} onChange={(e) => setUnit(e.target.value)} className={selectClass}>
                {Object.keys(CONTRACT_UNIT_LABELS).map((value) => (
                  <option key={value} value={value}>
                    {tUnit(value)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
              <Label htmlFor="m-desc">{tCommon("description")}</Label>
            <Input
              id="m-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="m-qty">{t("quantity")}</Label>
              <Input id="m-qty" type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="m-rate">{t("ratePkr")}</Label>
              <Input id="m-rate" type="number" min="0" step="any" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("amount", { amount: formatPkr(amount) })}
          </p>
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {tForms("cancel")}
            </Button>
            <Button onClick={submit} disabled={isPending || description.trim().length < 2}>
              {isPending ? tCommon("saving") : tForms("addEntry")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MaterialForm({ contractId }: { contractId: string }) {
  const router = useRouter();
  const t = useTranslations("contracts");
  const tForms = useTranslations("forms");
  const tToasts = useTranslations("toasts");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [ordered, setOrdered] = useState("");
  const [received, setReceived] = useState("");
  const [rate, setRate] = useState("");
  const [notes, setNotes] = useState("");

  const qty = (Number(received) || 0) > 0 ? Number(received) : Number(ordered) || 0;
  const value = qty * (Number(rate) || 0);

  function submit() {
    startTransition(async () => {
      const result = await addMaterialItem({
        contract_id: contractId,
        name,
        unit,
        quantity_ordered: ordered,
        quantity_received: received,
        rate,
        notes,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(tToasts("materialAdded"));
      setName("");
      setUnit("");
      setOrdered("");
      setReceived("");
      setRate("");
      setNotes("");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" variant="outline" className="h-7 text-xs rounded-md" onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        {tForms("addMaterial")}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addMaterialTitle")}</DialogTitle>
          <DialogDescription>{t("addMaterialHint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mat-name">{t("colMaterial")}</Label>
              <Input id="mat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("materialPlaceholder")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-unit">{tCommon("unit")}</Label>
              <Input id="mat-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={t("unitPlaceholder")} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mat-ord">{t("colOrdered")}</Label>
              <Input id="mat-ord" type="number" min="0" step="any" value={ordered} onChange={(e) => setOrdered(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-rec">{t("colReceived")}</Label>
              <Input id="mat-rec" type="number" min="0" step="any" value={received} onChange={(e) => setReceived(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mat-rate">{t("ratePkr")}</Label>
              <Input id="mat-rate" type="number" min="0" step="any" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
              <Label htmlFor="mat-notes">{tCommon("notes")}</Label>
            <Input id="mat-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tCommon("optional")} />
          </div>
          <p className="text-sm text-muted-foreground">
            {t("value", { amount: formatPkr(value) })}
          </p>
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              {tForms("cancel")}
            </Button>
            <Button onClick={submit} disabled={isPending || name.trim().length < 2}>
              {isPending ? tCommon("saving") : tForms("addMaterial")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
