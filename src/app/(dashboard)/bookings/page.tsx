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
            Bookings &amp; Sales
          </h1>
          <p className="text-sm text-muted-foreground">
            Centralized record of all plot bookings, installment sales, and customer purchases.
          </p>
        </div>
        <Button render={<Link href="/bookings/new" />}>
          <Plus className="size-4" />
          New Booking
        </Button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales Value"
          value={formatPkr(totalSalesValue)}
          hint={`${allBookings.length} total deals booked`}
          icon={DollarSign}
          variant="indigo"
        />
        <StatCard
          title="Total Collections"
          value={formatPkr(totalCollected)}
          hint={`${collectionPercent}% recovered revenue`}
          icon={Receipt}
          variant="success"
        />
        <StatCard
          title="Outstanding Balance"
          value={formatPkr(totalOutstanding)}
          hint="Pending installment balances"
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title="Active EMI Sales"
          value={activeBookingsCount}
          hint="Under active payment plans"
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
          placeholder="Search customer, plot #, code..."
          className="h-9 max-w-sm"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="h-9 rounded-[8px] border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          {Object.entries(SALE_STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm" className="h-9">
          <Search className="size-3.5 mr-1" />
          Filter
        </Button>
        {(q || status) && (
          <Button
            render={<Link href="/bookings" />}
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
          >
            Reset
          </Button>
        )}
      </form>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">All Bookings &amp; Sales</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {bookings.length} of {allBookings.length} bookings
          </span>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-base font-medium text-foreground">No bookings found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {q || status
                ? "Try adjusting your search or status filter."
                : "Create your first property booking to get started."}
            </p>
            {!q && !status && (
              <Button
                render={<Link href="/bookings/new" />}
                size="sm"
                className="mt-4"
              >
                <Plus className="size-4 mr-1.5" />
                Create Booking
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Property / Plot</TableHead>
                <TableHead>Sale Date</TableHead>
                <TableHead>Sale Amount</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                      <div>{booking.customers?.full_name || "N/A"}</div>
                      <div className="text-xs text-muted-foreground">
                        {booking.customers?.phone || booking.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">
                          Plot #{booking.plot_no || booking.properties?.plot_no || "—"}
                        </span>
                        {booking.is_external ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            External
                          </Badge>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {booking.is_external
                          ? booking.external_location || booking.seller_name || "Off-society"
                          : booking.properties?.societies?.name || "Society Plot"}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(booking.booking_date)}</TableCell>
                    <TableCell className="font-semibold font-heading">
                      {formatPkr(booking.total_amount)}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatPkr(booking.total_received_amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatPkr(booking.remaining_balance)}
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
                        {SALE_STATUS_LABELS[booking.status as keyof typeof SALE_STATUS_LABELS] ||
                          booking.status}
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
                          Ledger
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
