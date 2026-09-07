import Link from "next/link";
import {
  Building2,
  CalendarClock,
  DollarSign,
  Eye,
  Plus,
  Receipt,
  Search,
  Wallet,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getBookingsList } from "@/lib/bookings";
import { formatPkr, formatDate } from "@/lib/format";
import { SALE_STATUS_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const allBookings = await getBookingsList();
  const locale = await getLocale();
  const t = await getTranslations("pages.bookings");
  const tSale = await getTranslations("labels.saleStatus");
  const tCommon = await getTranslations("common");

  const totalSalesValue = allBookings.reduce(
    (sum: number, b: any) => sum + Number(b.total_amount || 0),
    0,
  );
  const totalCollected = allBookings.reduce(
    (sum: number, b: any) => sum + Number(b.total_received_amount || 0),
    0,
  );
  const totalOutstanding = totalSalesValue - totalCollected;
  const activeBookingsCount = allBookings.filter(
    (b: any) => b.status === "active_emi" || b.status === "booked",
  ).length;
  const collectionPercent =
    totalSalesValue > 0
      ? ((totalCollected / totalSalesValue) * 100).toFixed(1)
      : "0";

  // Filter bookings based on search & status params
  const bookings = allBookings.filter((b: any) => {
    if (status && b.status !== status) {
      return false;
    }
    if (q?.trim()) {
      const term = q.trim().toLowerCase();
      const customerName = (b.customers?.full_name || "").toLowerCase();
      const customerPhone = (b.customers?.phone || "").toLowerCase();
      const plotNo = String(b.plot_no || b.properties?.plot_no || "").toLowerCase();
      const code = (b.code || "").toLowerCase();
      const society = (b.properties?.societies?.name || b.external_location || "").toLowerCase();

      return (
        customerName.includes(term) ||
        customerPhone.includes(term) ||
        plotNo.includes(term) ||
        code.includes(term) ||
        society.includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button render={<Link href="/bookings/new" />}>
          <Plus className="size-4" />
          {t("newBooking")}
        </Button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalSales")}
          value={formatPkr(totalSalesValue, locale)}
          hint={t("dealsBooked", { count: allBookings.length })}
          icon={DollarSign}
          variant="indigo"
        />
        <StatCard
          title={t("totalCollections")}
          value={formatPkr(totalCollected, locale)}
          hint={t("recovered", { percent: collectionPercent })}
          icon={Receipt}
          variant="success"
        />
        <StatCard
          title={t("outstanding")}
          value={formatPkr(totalOutstanding, locale)}
          hint={t("pendingBalances")}
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title={t("activeEmi")}
          value={activeBookingsCount}
          hint={t("activeHint")}
          icon={CalendarClock}
          variant="sky"
          href="/installments"
        />
      </div>

      {/* Search & Filter Bar */}
      <form className="flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="h-9 max-w-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">{t("allStatuses")}</option>
          {Object.keys(SALE_STATUS_LABELS).map((val) => (
            <option key={val} value={val}>
              {tSale(val)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm" className="h-9">
          <Search className="size-3.5 mr-1" />
          {tCommon("filter")}
        </Button>
        {(q || status) && (
          <Button
            render={<Link href="/bookings" />}
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
          >
            {tCommon("reset")}
          </Button>
        )}
      </form>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">{t("allBookings")}</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("countOf", { shown: bookings.length, total: allBookings.length })}
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-base font-medium text-foreground">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {q || status
                ? t("emptyFilter")
                : t("emptyCreate")}
            </p>
            {!q && !status && (
              <Button
                render={<Link href="/bookings/new" />}
                size="sm"
                className="mt-4"
              >
                <Plus className="size-4 mr-1.5" />
                {t("createBooking")}
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tCommon("customer")}</TableHead>
                <TableHead>{t("propertyPlot")}</TableHead>
                <TableHead>{t("saleDate")}</TableHead>
                <TableHead>{t("saleAmount")}</TableHead>
                <TableHead>{t("collected")}</TableHead>
                <TableHead>{t("remaining")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking: any) => {
                const isCancelled = booking.status === "cancelled";
                const isCompleted =
                  booking.status === "fully_paid" || booking.status === "closed";

                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      <div>{booking.customers?.full_name || tCommon("dash")}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customers?.phone || booking.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">
                          {t("plotHash", { plot: booking.plot_no || booking.properties?.plot_no || tCommon("dash") })}
                        </span>
                        {booking.is_external ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {t("external")}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.is_external
                          ? booking.external_location || booking.seller_name || t("offSociety")
                          : booking.properties?.societies?.name || t("societyPlot")}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(booking.booking_date, locale)}</TableCell>
                    <TableCell className="font-semibold font-heading">
                      {formatPkr(booking.total_amount, locale)}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatPkr(booking.total_received_amount, locale)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPkr(booking.remaining_balance, locale)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          isCancelled
                            ? "destructive"
                            : isCompleted
                              ? "default"
                              : "secondary"
                        }
                      >
                        {tSale(booking.status as keyof typeof SALE_STATUS_LABELS)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.customers?.id ? (
                        <Button
                          variant="outline"
                          size="sm"
                          render={
                            <Link href={`/customers/${booking.customers.id}`} />
                          }
                        >
                          <Eye className="size-3.5 mr-1" />
                          {t("ledger")}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
