import Link from "next/link";
import { useTranslations } from "next-intl";
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
  labelKey: string;
  icon: LucideIcon;
};

const REPORT_LINKS: ReportLink[] = [
  { href: "/reports/sales", labelKey: "salesRegister", icon: Receipt },
  { href: "/reports/aging", labelKey: "installmentAging", icon: CalendarClock },
  { href: "/reports/installments", labelKey: "installmentsDue", icon: Calendar },
  { href: "/reports/customer-ledger", labelKey: "customerLedger", icon: User },
  { href: "/reports/inventory", labelKey: "inventory", icon: Building2 },
  { href: "/reports/cash-book", labelKey: "cashBook", icon: Wallet },
  { href: "/reports/land-bank", labelKey: "landAcquisition", icon: LandPlot },
  { href: "/reports/parties", labelKey: "contractorLedger", icon: Handshake },
  { href: "/reports/development", labelKey: "developmentCost", icon: Hammer },
  { href: "/reports/documents", labelKey: "documents", icon: FileText },
];

export function ReportsNav() {
  const t = useTranslations("reports");
  return (
    <div className="rounded-[10px] border bg-card p-3 shadow-xs print:hidden">
      <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {t("detailedLedgers")}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {REPORT_LINKS.map(({ href, labelKey, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-transparent bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-input hover:bg-muted"
          >
            <Icon className="size-3.5 text-muted-foreground" />
            {t(labelKey)}
          </Link>
        ))}
      </div>
    </div>
  );
}
