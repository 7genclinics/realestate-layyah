import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { getBookingsList } from "@/lib/bookings";
import { formatPkr, formatDate } from "@/lib/format";
import { SALE_STATUS_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export default async function BookingsPage() {
  const bookings = await getBookingsList();

  const totalSalesValue = bookings.reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0);
  const totalCollected = bookings.reduce((sum: number, b: any) => sum + Number(b.total_received_amount || 0), 0);
  const activeBookingsCount = bookings.filter((b: any) => b.status === "active_emi" || b.status === "booked").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Property Bookings & Sales Overview
          </h1>
          <p className="text-sm text-slate-500">
            Centralized record of all plot bookings, installment sales, and customer purchases.
          </p>
        </div>
        <Link href="/bookings/new">
          <Button className="bg-sky-600 hover:bg-sky-700">
            <Plus className="mr-2 size-4" />
            New Booking
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Sales Volume</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatPkr(totalSalesValue)}</p>
          <p className="mt-1 text-xs text-slate-500">{bookings.length} Total Bookings</p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Collections</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatPkr(totalCollected)}</p>
          <p className="mt-1 text-xs text-slate-500">
            {totalSalesValue > 0 ? ((totalCollected / totalSalesValue) * 100).toFixed(1) : 0}% Collected
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active EMI Sales</p>
          <p className="mt-2 text-2xl font-bold text-sky-600">{activeBookingsCount}</p>
          <p className="mt-1 text-xs text-slate-500">Active customer payment plans</p>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">All Bookings & Sales</h2>
        </div>

        {bookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-medium">No sales or bookings found.</p>
            <p className="text-sm text-slate-400 mt-1">Create your first property booking to get started.</p>
            <Link href="/bookings/new" className="mt-4 inline-block">
              <Button size="sm" className="bg-sky-600 hover:bg-sky-700">
                <Plus className="mr-2 size-4" /> Create Booking
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-medium text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Property / Plot</th>
                  <th className="px-6 py-3">Sale Date</th>
                  <th className="px-6 py-3">Sale Amount</th>
                  <th className="px-6 py-3">Collected</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{booking.customers?.name || "N/A"}</div>
                      <div className="text-xs text-slate-400">{booking.customers?.contact}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>Plot #{booking.properties?.plot_number || "N/A"}</div>
                      <div className="text-xs text-slate-400">
                        {booking.properties?.societies?.name || "Society"}
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatDate(booking.booking_date)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {formatPkr(booking.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-medium">
                      {formatPkr(booking.total_received_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                        {SALE_STATUS_LABELS[booking.status as keyof typeof SALE_STATUS_LABELS] || booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {booking.customers?.id ? (
                        <Link href={`/customers/${booking.customers.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 size-3.5" /> View Ledger
                          </Button>
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
