import Link from "next/link";
import { Plus, CalendarClock, Users, Banknote, Landmark } from "lucide-react";
import { getStaffMembers } from "@/lib/staff";
import { formatPkr, formatDate } from "@/lib/format";
import { STAFF_DEPARTMENT_LABELS, STAFF_STATUS_LABELS } from "@/lib/constants";
import { deleteStaffMember } from "@/lib/actions/staff";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { RowActions } from "@/components/features/row-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  const { data: staffMembers, total } = await getStaffMembers({ page, pageSize: PAGE_SIZE });

  const totalBasicSalary = staffMembers.reduce((s: number, m: any) => s + Number(m.basic_salary || 0), 0);
  const totalAdvances = staffMembers.reduce((s: number, m: any) => s + Number(m.active_advance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Staff &amp; Payroll
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage employee master records, monthly salary disbursements, advances, and payroll vouchers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href="/staff/payroll" />}>
            <CalendarClock className="size-4" />
            Run Payroll
          </Button>
          <Button render={<Link href="/staff/new" />}>
            <Plus className="size-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Active Employees"
          value={total}
          hint="Society & office administration staff"
          icon={Users}
          variant="sky"
        />
        <StatCard
          title="Monthly Payroll Commitment"
          value={formatPkr(totalBasicSalary)}
          hint="Total basic salary budget"
          icon={Banknote}
          variant="primary"
          href="/staff/payroll"
        />
        <StatCard
          title="Outstanding Advances"
          value={formatPkr(totalAdvances)}
          hint="Salary advances to be deducted"
          icon={Landmark}
          variant="warning"
          href="/cash-book"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Employee Master Records</h2>
          </div>
          <span className="text-xs text-muted-foreground">{total} total staff</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Designation / Dept</TableHead>
              <TableHead>Phone / CNIC</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead>Basic Salary</TableHead>
              <TableHead>Active Advance</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staffMembers.length ? (
              staffMembers.map((staff: any) => (
                <TableRow key={staff.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-medium">
                    <Link
                      href={`/staff/${staff.id}`}
                      className="font-semibold text-primary hover:underline underline-offset-4"
                    >
                      {staff.full_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{staff.designation}</div>
                    <div className="text-xs text-muted-foreground">
                      {STAFF_DEPARTMENT_LABELS[staff.department as keyof typeof STAFF_DEPARTMENT_LABELS] ?? staff.department}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{staff.phone}</div>
                    <div className="text-xs text-muted-foreground">{staff.cnic || "—"}</div>
                  </TableCell>
                  <TableCell>{formatDate(staff.joining_date)}</TableCell>
                  <TableCell className="font-semibold">{formatPkr(staff.basic_salary)}</TableCell>
                  <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatPkr(staff.active_advance)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md">
                      {STAFF_STATUS_LABELS[staff.status as keyof typeof STAFF_STATUS_LABELS] ?? staff.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      id={staff.id}
                      viewHref={`/staff/${staff.id}`}
                      editHref={`/staff/${staff.id}`}
                      deleteAction={deleteStaffMember}
                      confirmMessage={`Delete employee "${staff.full_name}"? All payroll and advance records will also be removed.`}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  No employees registered yet. Click &quot;Add Employee&quot; to begin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} total={total} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}
