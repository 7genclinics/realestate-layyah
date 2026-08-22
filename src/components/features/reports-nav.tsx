import Link from "next/link";
import {
  Building2,
  Calendar,
  CalendarClock,
  FileText,
  Handshake,
  Hammer,
  LandPlot,
  Receipt,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type ReportLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const REPORT_LINKS: ReportLink[] = [
  { href: "/reports/sales", label: "Sales register", icon: Receipt },
  { href: "/reports/aging", label: "Installment aging", icon: CalendarClock },
  { href: "/reports/installments", label: "Installments due", icon: Calendar },
  { href: "/reports/customer-ledger", label: "Customer ledger", icon: User },
  { href: "/reports/inventory", label: "Inventory", icon: Building2 },
  { href: "/reports/cash-book", label: "Cash book", icon: Wallet },
  { href: "/reports/land-bank", label: "Land acquisition", icon: LandPlot },
  { href: "/reports/parties", label: "Contractor ledger", icon: Handshake },
  { href: "/reports/development", label: "Development cost", icon: Hammer },
  { href: "/reports/documents", label: "Documents", icon: FileText },
];

/**
 * Discoverable jump-bar to the specialized, print-friendly ledgers. The main
 * page renders the interactive analytics; these are the detailed statements.
 */
export function ReportsNav() {
  return (
    <div className="rounded-[10px] border bg-card p-3 shadow-xs print:hidden">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Detailed &amp; Printable Ledgers
      </p>
      <div className="flex flex-wrap gap-1.5">
        {REPORT_LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-transparent bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-input hover:bg-muted"
          >
            <Icon className="size-3.5 text-muted-foreground" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
