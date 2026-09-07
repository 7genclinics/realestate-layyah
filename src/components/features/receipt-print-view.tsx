import { getTranslations } from "next-intl/server";
import { formatDate, formatPkr } from "@/lib/format";
import type { PaymentMode } from "@/lib/database.types";

type ReceiptPrintData = {
  code: string;
  payment_date: string;
  amount: number;
  amount_in_words: string;
  payment_mode: PaymentMode;
  reference_no: string | null;
  notes: string | null;
  customer: {
    full_name: string;
    code: string;
    phone: string;
    address: string | null;
    relation: string;
    guardian_name: string | null;
  };
  sale: {
    code: string;
    plot_no: string;
    remaining_amount: number;
  };
  receivedBy: string | null;
  allocations: {
    allocated_amount: number;
    installment_no: number;
    period_label: string;
  }[];
};

export async function ReceiptPrintView({ receipt }: { receipt: ReceiptPrintData }) {
  const t = await getTranslations("receipt");
  const tBrand = await getTranslations("brand");
  const tCommon = await getTranslations("common");
  const tRelation = await getTranslations("labels.customerRelation");
  const tMode = await getTranslations("labels.paymentMode");

  return (
    <article className="mx-auto max-w-2xl rounded-xl border bg-white p-8 text-black shadow-sm print:border-0 print:p-0 print:shadow-none">
      <header className="border-b pb-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          {t("paymentReceipt")}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{tBrand("fullName")}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {t("receiptNo", { code: receipt.code, date: formatDate(receipt.payment_date) })}
        </p>
      </header>

      <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-neutral-500">{t("receivedFrom")}</p>
          <p className="font-medium">{receipt.customer.full_name}</p>
          <p className="text-neutral-600">
            {tRelation(receipt.customer.relation)}{" "}
            {receipt.customer.guardian_name || tCommon("dash")}
          </p>
          <p className="text-neutral-600">{receipt.customer.phone}</p>
          <p className="text-neutral-600">{receipt.customer.address || tCommon("dash")}</p>
          <p className="font-mono text-xs text-neutral-500">
            {receipt.customer.code}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-500">{t("plotSale")}</p>
          <p className="font-medium">{receipt.sale.plot_no}</p>
          <p className="text-neutral-600">{t("saleCode", { code: receipt.sale.code })}</p>
          <p className="text-neutral-600">
            {t("balanceAfter", { amount: formatPkr(receipt.sale.remaining_amount) })}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <p className="text-xs uppercase text-neutral-500">{t("amountReceived")}</p>
        <p className="mt-1 text-3xl font-semibold">{formatPkr(receipt.amount)}</p>
        <p className="mt-2 text-sm italic text-neutral-700">
          {receipt.amount_in_words}
        </p>
      </section>

      <section className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-neutral-500">{t("paymentMode")}</p>
          <p>{tMode(receipt.payment_mode)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-500">{tCommon("reference")}</p>
          <p>{receipt.reference_no || tCommon("dash")}</p>
        </div>
        {receipt.receivedBy ? (
          <div>
            <p className="text-xs uppercase text-neutral-500">{t("receivedBy")}</p>
            <p>{receipt.receivedBy}</p>
          </div>
        ) : null}
      </section>

      {receipt.allocations.length ? (
        <section className="mt-6">
          <p className="text-xs uppercase text-neutral-500">{t("appliedToEmi")}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {receipt.allocations.map((row) => (
              <li key={`${row.installment_no}-${row.period_label}`}>
                {t("emiLine", {
                  no: row.installment_no,
                  period: row.period_label,
                  amount: formatPkr(row.allocated_amount),
                })}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {receipt.notes ? (
        <section className="mt-6 text-sm">
          <p className="text-xs uppercase text-neutral-500">{tCommon("notes")}</p>
          <p className="mt-1 text-neutral-700">{receipt.notes}</p>
        </section>
      ) : null}

      <footer className="mt-10 grid grid-cols-2 gap-8 border-t pt-6 text-sm">
        <div>
          <div className="h-12 border-b border-dashed" />
          <p className="mt-2 text-neutral-600">{t("customerSignature")}</p>
        </div>
        <div>
          <div className="h-12 border-b border-dashed" />
          <p className="mt-2 text-neutral-600">{t("authorizedSignature")}</p>
        </div>
      </footer>
    </article>
  );
}
