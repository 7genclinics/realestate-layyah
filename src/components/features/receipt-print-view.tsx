import { CUSTOMER_RELATION_LABELS, PAYMENT_MODE_LABELS } from "@/lib/constants";
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
    relation: keyof typeof CUSTOMER_RELATION_LABELS;
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

export function ReceiptPrintView({ receipt }: { receipt: ReceiptPrintData }) {
  return (
    <article className="mx-auto max-w-2xl rounded-xl border bg-white p-8 text-black shadow-sm print:border-0 print:p-0 print:shadow-none">
      <header className="border-b pb-4 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          Payment receipt
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Mohkam Real Estate</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Receipt no. <span className="font-mono">{receipt.code}</span> ·{" "}
          {formatDate(receipt.payment_date)}
        </p>
      </header>

      <section className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-neutral-500">Received from</p>
          <p className="font-medium">{receipt.customer.full_name}</p>
          <p className="text-neutral-600">
            {CUSTOMER_RELATION_LABELS[receipt.customer.relation]}{" "}
            {receipt.customer.guardian_name || "—"}
          </p>
          <p className="text-neutral-600">{receipt.customer.phone}</p>
          <p className="text-neutral-600">{receipt.customer.address || "—"}</p>
          <p className="font-mono text-xs text-neutral-500">
            {receipt.customer.code}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-500">Plot / sale</p>
          <p className="font-medium">{receipt.sale.plot_no}</p>
          <p className="text-neutral-600">Sale {receipt.sale.code}</p>
          <p className="text-neutral-600">
            Balance after receipt: {formatPkr(receipt.sale.remaining_amount)}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border p-4">
        <p className="text-xs uppercase text-neutral-500">Amount received</p>
        <p className="mt-1 text-3xl font-semibold">{formatPkr(receipt.amount)}</p>
        <p className="mt-2 text-sm italic text-neutral-700">
          {receipt.amount_in_words}
        </p>
      </section>

      <section className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-neutral-500">Payment mode</p>
          <p>{PAYMENT_MODE_LABELS[receipt.payment_mode]}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-neutral-500">Reference</p>
          <p>{receipt.reference_no || "—"}</p>
        </div>
        {receipt.receivedBy ? (
          <div>
            <p className="text-xs uppercase text-neutral-500">Received by</p>
            <p>{receipt.receivedBy}</p>
          </div>
        ) : null}
      </section>

      {receipt.allocations.length ? (
        <section className="mt-6">
          <p className="text-xs uppercase text-neutral-500">Applied to EMI</p>
          <ul className="mt-2 space-y-1 text-sm">
            {receipt.allocations.map((row) => (
              <li key={`${row.installment_no}-${row.period_label}`}>
                #{row.installment_no} {row.period_label} · {formatPkr(row.allocated_amount)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {receipt.notes ? (
        <section className="mt-6 text-sm">
          <p className="text-xs uppercase text-neutral-500">Notes</p>
          <p className="mt-1 text-neutral-700">{receipt.notes}</p>
        </section>
      ) : null}

      <footer className="mt-10 grid grid-cols-2 gap-8 border-t pt-6 text-sm">
        <div>
          <div className="h-12 border-b border-dashed" />
          <p className="mt-2 text-neutral-600">Customer signature</p>
        </div>
        <div>
          <div className="h-12 border-b border-dashed" />
          <p className="mt-2 text-neutral-600">Authorized signature</p>
        </div>
      </footer>
    </article>
  );
}
