"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Building2,
  Calendar,
  CalendarClock,
  CheckCircle,
  Coins,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Handshake,
  LandPlot,
  PieChart,
  Printer,
  Receipt,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AREA_UNIT_LABELS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  CUSTOMER_STAGE_LABELS,
  INSTALLMENT_STATUS_LABELS,
  LAND_STATUS_LABELS,
  PAYMENT_MODE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  SALE_STATUS_LABELS,
} from "@/lib/constants";
import { deriveInstallmentStatus } from "@/lib/permissions";
import { formatDate, formatNumber, formatPkr } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToCsv } from "@/lib/csv";

export type AllInOneReportsProps = {
  sales: any[];
  receipts: any[];
  transactions: any[];
  installments: any[];
  properties: any[];
  contracts: any[];
  landParcels: any[];
  devExpenses: any[];
  societies: any[];
  customers: any[];
};

type PeriodPreset = "all" | "today" | "week" | "month" | "last_month" | "year" | "custom";

export function AllInOneReports({
  sales,
  receipts,
  transactions,
  installments,
  properties,
  contracts,
  landParcels,
  devExpenses,
  societies,
  customers,
}: AllInOneReportsProps) {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");
  const tStage = useTranslations("labels.customerStage");
  const tInst = useTranslations("labels.installmentStatus");
  const tPropType = useTranslations("labels.propertyType");
  const tPropStatus = useTranslations("labels.propertyStatus");
  const tArea = useTranslations("labels.areaUnit");
  const tContractType = useTranslations("labels.contractType");
  const tContractStatus = useTranslations("labels.contractStatus");
  const tLandStatus = useTranslations("labels.landStatus");
  const tTxn = useTranslations("labels.cashTransactionType");
  const [activeTab, setActiveTab] = useState<
    "executive" | "customers" | "installments" | "cashbook" | "inventory" | "contracts" | "land"
  >("executive");

  const [period, setPeriod] = useState<PeriodPreset>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [selectedSociety, setSelectedSociety] = useState<string>("all");

  // Date range calculation
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (period === "today") {
      return { from: todayStr, to: todayStr };
    }
    if (period === "week") {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return { from: monday.toISOString().slice(0, 10), to: todayStr };
    }
    if (period === "month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
    }
    if (period === "last_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: firstDay.toISOString().slice(0, 10), to: lastDay.toISOString().slice(0, 10) };
    }
    if (period === "year") {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
    }
    if (period === "custom") {
      return { from: fromDate, to: toDate };
    }
    return { from: "", to: "" };
  }, [period, fromDate, toDate]);

  // Filter datasets by date range and selected society
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const date = r.payment_date || r.created_at?.slice(0, 10);
      if (dateRange.from && date < dateRange.from) return false;
      if (dateRange.to && date > dateRange.to) return false;
      if (selectedSociety !== "all" && r.sales?.society_id !== selectedSociety) return false;
      return true;
    });
  }, [receipts, dateRange, selectedSociety]);

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const date = s.agreement_date || s.created_at?.slice(0, 10);
      if (dateRange.from && date < dateRange.from) return false;
      if (dateRange.to && date > dateRange.to) return false;
      if (selectedSociety !== "all" && s.society_id !== selectedSociety) return false;
      return true;
    });
  }, [sales, dateRange, selectedSociety]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const date = t.transaction_date;
      if (dateRange.from && date < dateRange.from) return false;
      if (dateRange.to && date > dateRange.to) return false;
      return true;
    });
  }, [transactions, dateRange]);

  const filteredInstallments = useMemo(() => {
    return installments.map((row) => {
      const status = deriveInstallmentStatus(
        row.due_date,
        Number(row.scheduled_amount),
        Number(row.received_amount),
      );
      const sale = Array.isArray(row.sales) ? row.sales[0] : row.sales;
      const cust = Array.isArray(sale?.customers) ? sale?.customers[0] : sale?.customers;
      return { ...row, status, sale, cust };
    }).filter((row) => {
      if (selectedSociety !== "all" && row.sale?.society_id !== selectedSociety) return false;
      if (dateRange.from && row.due_date < dateRange.from) return false;
      if (dateRange.to && row.due_date > dateRange.to) return false;
      return true;
    });
  }, [installments, dateRange, selectedSociety]);

  // Financial aggregates
  const totalSalesRevenue = filteredSales.reduce((s, row) => s + Number(row.sale_amount || 0), 0);
  const totalCollections = filteredReceipts.reduce((s, row) => s + Number(row.amount || 0), 0);

  const totalInflows = filteredTransactions
    .filter((t) => t.transaction_type === "income" || t.transfer_side === "in")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const totalOutflows = filteredTransactions
    .filter((t) => t.transaction_type === "expense" || t.transfer_side === "out")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const netCashFlow = totalInflows - totalOutflows;

  const totalCustomerReceivables = sales
    .filter((s) => s.status !== "cancelled")
    .reduce((s, row) => s + Number(row.remaining_amount || 0), 0);

  const overdueInstallments = installments.map((i) => ({
    ...i,
    status: deriveInstallmentStatus(i.due_date, Number(i.scheduled_amount), Number(i.received_amount), {
      statusOverride: (i as { status_override?: string | null }).status_override ?? null,
    }),
  })).filter((i) => i.status === "overdue");

  const totalOverdueAmount = overdueInstallments.reduce(
    (s, i) => s + (Number(i.scheduled_amount) - Number(i.received_amount)),
    0,
  );

  const totalInventoryValue = properties.reduce((s, p) => s + Number(p.asking_price || 0), 0);
  const availablePlotsCount = properties.filter((p) => p.status === "available").length;

  // Chart Data Preparation
  const societyChartData = useMemo(() => {
    return (societies || []).map((soc) => {
      const socSales = sales.filter((s) => s.society_id === soc.id);
      const socProps = properties.filter((p) => p.society_id === soc.id);
      const rev = socSales.reduce((s, row) => s + Number(row.sale_amount || 0), 0);
      const available = socProps.filter((p) => p.status === "available").length;
      const booked = socProps.filter((p) => p.status === "booked" || p.status === "sold").length;
      return {
        name: soc.name,
        Revenue: rev,
        AvailablePlots: available,
        BookedPlots: booked,
      };
    });
  }, [societies, sales, properties]);

  const paymentModeData = useMemo(() => {
    const modes: Record<string, number> = { cash: 0, bank_transfer: 0, cheque: 0, other: 0 };
    filteredReceipts.forEach((r) => {
      const m = r.payment_mode || "cash";
      modes[m] = (modes[m] || 0) + Number(r.amount || 0);
    });
    return [
      { name: "Cash Drawer", value: modes.cash || 0, color: "#10b981" },
      { name: "Bank Transfer", value: modes.bank_transfer || 0, color: "#0ea5e9" },
      { name: "Cheque Clearance", value: modes.cheque || 0, color: "#f59e0b" },
      { name: "Online / Other", value: modes.other || 0, color: "#8b5cf6" },
    ].filter((item) => item.value > 0);
  }, [filteredReceipts]);

  // Aging breakdown
  const agingData = useMemo(() => {
    const now = new Date();
    let b1_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90_plus = 0;

    overdueInstallments.forEach((item) => {
      const due = new Date(item.due_date);
      const diffDays = Math.floor((now.getTime() - due.getTime()) / (1000 * 3600 * 24));
      const amount = Number(item.scheduled_amount) - Number(item.received_amount);

      if (diffDays <= 30) b1_30 += amount;
      else if (diffDays <= 60) b31_60 += amount;
      else if (diffDays <= 90) b61_90 += amount;
      else b90_plus += amount;
    });

    return [
      { bucket: "1–30 Days", amount: b1_30, color: "#38bdf8" },
      { bucket: "31–60 Days", amount: b31_60, color: "#fbbf24" },
      { bucket: "61–90 Days", amount: b61_90, color: "#f97316" },
      { bucket: "90+ Days", amount: b90_plus, color: "#ef4444" },
    ];
  }, [overdueInstallments]);

  // CSV Export Handler for Active Tab
  const handleExportCsv = () => {
    if (activeTab === "customers") {
      const headers = ["Code", "Customer Name", "Phone", "Bookings", "Gross Sales", "Paid Receipts", "Outstanding Balance", "Stage"];
      const rows = customers.map((c) => {
        const cSales = sales.filter((s) => s.customer_id === c.id);
        const saleVal = cSales.reduce((s, row) => s + Number(row.sale_amount || 0), 0);
        const remVal = cSales.reduce((s, row) => s + Number(row.remaining_amount || 0), 0);
        const paidVal = receipts.filter((r) => r.customer_id === c.id).reduce((s, r) => s + Number(r.amount || 0), 0);
        return [c.code, c.full_name, c.phone, cSales.length, saleVal, paidVal, remVal, c.stage];
      });
      exportToCsv("customer_ledger_statement.csv", headers, rows);
    } else if (activeTab === "installments") {
      const headers = ["Milestone", "Customer", "Plot", "Due Date", "Scheduled Amount", "Received Amount", "Balance Due", "Status"];
      const rows = filteredInstallments.map((i) => [
        i.period_label,
        i.cust?.full_name || "—",
        i.sale?.plot_no || "—",
        i.due_date,
        i.scheduled_amount,
        i.received_amount,
        Number(i.scheduled_amount) - Number(i.received_amount),
        i.status,
      ]);
      exportToCsv("installments_schedule_report.csv", headers, rows);
    } else if (activeTab === "cashbook") {
      const headers = ["Date", "Type", "Category", "Society", "Inflow", "Outflow", "Description"];
      const rows = filteredTransactions.map((t) => [
        t.transaction_date,
        t.transaction_type,
        t.cash_categories?.name || "General",
        t.societies?.name || "—",
        t.transaction_type === "income" || t.transfer_side === "in" ? t.amount : 0,
        t.transaction_type === "expense" || t.transfer_side === "out" ? t.amount : 0,
        t.description,
      ]);
      exportToCsv("cash_book_statement.csv", headers, rows);
    } else if (activeTab === "inventory") {
      const headers = ["Code", "Plot No", "Society", "Block", "Type", "Area", "Asking Price", "Status"];
      const rows = properties.map((p) => [
        p.code,
        p.plot_no,
        p.societies?.name || "—",
        p.society_blocks?.name || "General",
        p.property_type,
        `${p.area} ${p.area_unit}`,
        p.asking_price,
        p.status,
      ]);
      exportToCsv("inventory_status_report.csv", headers, rows);
    } else {
      const headers = ["Metric", "Amount / Value"];
      const rows = [
        ["Total Sales Revenue", totalSalesRevenue],
        ["Total Collections Cleared", totalCollections],
        ["Net Cash Flow", netCashFlow],
        ["Total Outstanding Customer Receivables", totalCustomerReceivables],
        ["Overdue Installments Amount", totalOverdueAmount],
        ["Total Inventory Valuation", totalInventoryValue],
      ];
      exportToCsv("executive_analytics_summary.csv", headers, rows);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Global Period Filter Bar */}
      <div className="flex flex-col gap-5 border-b pb-6 print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
              {t("masterTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("masterSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="rounded-md">
              <Download className="size-3.5 mr-1.5" />
              {t("exportCsv")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-md">
              <Printer className="size-3.5 mr-1.5" />
              {t("printStatement")}
            </Button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="rounded-[10px] border bg-card p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1 bg-muted/60 p-1 rounded-[8px]">
            <PresetButton label={t("allTime")} active={period === "all"} onClick={() => setPeriod("all")} />
            <PresetButton label={t("today")} active={period === "today"} onClick={() => setPeriod("today")} />
            <PresetButton label={t("thisWeek")} active={period === "week"} onClick={() => setPeriod("week")} />
            <PresetButton label={t("thisMonth")} active={period === "month"} onClick={() => setPeriod("month")} />
            <PresetButton label={t("lastMonth")} active={period === "last_month"} onClick={() => setPeriod("last_month")} />
            <PresetButton label={t("thisYear")} active={period === "year"} onClick={() => setPeriod("year")} />
            <PresetButton label={t("customDates")} active={period === "custom"} onClick={() => setPeriod("custom")} />
          </div>

          {/* Date Pickers (if custom) & Society Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {period === "custom" && (
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-8 text-xs rounded-md w-36"
                  placeholder="From Date"
                />
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-8 text-xs rounded-md w-36"
                  placeholder="To Date"
                />
              </div>
            )}

            <select
              value={selectedSociety}
              onChange={(e) => setSelectedSociety(e.target.value)}
              className="h-8 rounded-md border border-input bg-transparent px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">{t("allSocieties")}</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title={t("kpiGrossSales")}
          value={formatPkr(totalSalesRevenue)}
          hint={t("kpiPlotDeals", { count: filteredSales.length })}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title={t("kpiCollections")}
          value={formatPkr(totalCollections)}
          hint={t("kpiReceipts", { count: filteredReceipts.length })}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard
          title={t("kpiOutflows")}
          value={formatPkr(totalOutflows)}
          hint={t("kpiOutflowsHint")}
          icon={ArrowDownRight}
          variant="warning"
        />
        <StatCard
          title={t("kpiNetCash")}
          value={formatPkr(netCashFlow)}
          hint={netCashFlow >= 0 ? t("kpiSurplus") : t("kpiNegative")}
          icon={Wallet}
          variant={netCashFlow >= 0 ? "sky" : "danger"}
        />
        <StatCard
          title={t("kpiOverdue")}
          value={formatPkr(totalOverdueAmount)}
          hint={t("kpiPendingInst", { count: overdueInstallments.length })}
          icon={Coins}
          variant="danger"
        />
        <StatCard
          title={t("kpiInventory")}
          value={formatPkr(totalInventoryValue)}
          hint={t("kpiPlotsOpen", { count: availablePlotsCount })}
          icon={Building2}
          variant="indigo"
        />
      </div>

      {/* Interactive Tabs Navigation */}
      <div className="border-b">
        <div className="flex flex-wrap items-center gap-2 pb-px overflow-x-auto">
          <TabButton
            active={activeTab === "executive"}
            onClick={() => setActiveTab("executive")}
            icon={BarChart3}
            label={t("tabExecutive")}
          />
          <TabButton
            active={activeTab === "customers"}
            onClick={() => setActiveTab("customers")}
            icon={Users}
            label={t("tabCustomers")}
            count={customers.length}
          />
          <TabButton
            active={activeTab === "installments"}
            onClick={() => setActiveTab("installments")}
            icon={CalendarClock}
            label={t("tabInstallments")}
            count={filteredInstallments.length}
          />
          <TabButton
            active={activeTab === "cashbook"}
            onClick={() => setActiveTab("cashbook")}
            icon={Receipt}
            label={t("tabCashbook")}
            count={filteredTransactions.length}
          />
          <TabButton
            active={activeTab === "inventory"}
            onClick={() => setActiveTab("inventory")}
            icon={Building2}
            label={t("tabInventory")}
            count={properties.length}
          />
          <TabButton
            active={activeTab === "contracts"}
            onClick={() => setActiveTab("contracts")}
            icon={Handshake}
            label={t("tabContracts")}
            count={contracts.length}
          />
          <TabButton
            active={activeTab === "land"}
            onClick={() => setActiveTab("land")}
            icon={LandPlot}
            label={t("tabLand")}
            count={landParcels.length}
          />
        </div>
      </div>

      {/* TAB 1: EXECUTIVE DASHBOARD & VISUAL CHARTS */}
      {activeTab === "executive" && (
        <div className="space-y-8">
          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Society Revenue Bar Chart */}
            <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  <h2 className="font-semibold text-base">{t("salesBySociety")}</h2>
                </div>
                <span className="text-xs text-muted-foreground">{societies.length} projects</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={societyChartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} />
                    <YAxis fontSize={11} tickFormatter={(val) => `${val / 1000000}M`} />
                    <Tooltip
                      formatter={(val: any) => [formatPkr(Number(val)), "Revenue"]}
                      contentStyle={{ backgroundColor: "var(--card)", borderRadius: "8px", border: "1px solid var(--border)" }}
                    />
                    <Bar dataKey="Revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Collections by Payment Mode Donut / Pie */}
            <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <PieChart className="size-4 text-emerald-500" />
                  <h2 className="font-semibold text-base">{t("collectionMethods")}</h2>
                </div>
                <span className="text-xs text-muted-foreground">{formatPkr(totalCollections)}</span>
              </div>
              <div className="h-72 w-full flex items-center justify-center">
                {paymentModeData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={paymentModeData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        innerRadius={50}
                        paddingAngle={4}
                        label={(entry) => `${entry.name}: ${Math.round((entry.value / totalCollections) * 100)}%`}
                      >
                        {paymentModeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: any) => [formatPkr(Number(val)), "Amount"]} />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("noPaymentData")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Aging Funnel & Stock Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Installment Aging Breakdown */}
            <div className="rounded-[10px] border bg-card p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-amber-500" />
                  <h2 className="font-semibold text-base">{t("agingBuckets")}</h2>
                </div>
                <span className="text-xs font-semibold text-rose-600">{formatPkr(totalOverdueAmount)}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {agingData.map((item) => (
                  <div key={item.bucket} className="rounded-[8px] border p-3.5 bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground uppercase">{item.bucket}</p>
                    <p className="text-lg font-bold text-foreground mt-1">{formatPkr(item.amount)}</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${totalOverdueAmount > 0 ? (item.amount / totalOverdueAmount) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Summary: Top Recent Collections */}
            <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
              <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("recentReceipts")}</h2>
                </div>
                <Link href="/receipts" className="text-xs text-primary hover:underline">
                  {t("viewAllReceipts")}
                </Link>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.slice(0, 5).map((r) => {
                    const cust = Array.isArray(r.customers) ? r.customers[0] : r.customers;
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono text-xs font-semibold text-primary">
                          <Link href={`/receipts/${r.id}`}>{r.code}</Link>
                        </TableCell>
                        <TableCell className="font-medium text-xs">{cust?.full_name ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(r.payment_date)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatPkr(r.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER LEDGERS STATEMENT */}
      {activeTab === "customers" && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("customerMaster")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{customers.length} total customer accounts</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Code</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Units Booked</TableHead>
                <TableHead>Total Booking Value</TableHead>
                <TableHead>Total Paid</TableHead>
                <TableHead>Outstanding Balance</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => {
                const cSales = sales.filter((s) => s.customer_id === c.id);
                const totalSaleVal = cSales.reduce((s, row) => s + Number(row.sale_amount || 0), 0);
                const totalRemVal = cSales.reduce((s, row) => s + Number(row.remaining_amount || 0), 0);
                const totalPaidVal = receipts
                  .filter((r) => r.customer_id === c.id)
                  .reduce((s, r) => s + Number(r.amount || 0), 0);

                return (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {c.code}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {c.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.phone}</TableCell>
                    <TableCell className="font-semibold">{cSales.length}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(totalSaleVal)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(totalPaidVal)}
                    </TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatPkr(totalRemVal)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tStage(c.stage)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-md"
                        render={<Link href={`/customers/${c.id}`} />}
                      >
                        <Eye className="size-3 mr-1" />
                        Ledger
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4}>Ledger Grand Totals</TableCell>
                <TableCell>{formatPkr(sales.reduce((s, row) => s + Number(row.sale_amount || 0), 0))}</TableCell>
                <TableCell className="text-emerald-600 dark:text-emerald-400">
                  {formatPkr(receipts.reduce((s, r) => s + Number(r.amount || 0), 0))}
                </TableCell>
                <TableCell className="text-amber-600 dark:text-amber-400">
                  {formatPkr(totalCustomerReceivables)}
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* TAB 3: INSTALLMENTS & AGING RECOVERY */}
      {activeTab === "installments" && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("installmentPipeline")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{filteredInstallments.length} installment records</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Plot &amp; Booking</TableHead>
                <TableHead>Milestone Description</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Scheduled Amount</TableHead>
                <TableHead>Received to Date</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInstallments.map((row) => {
                const openAmount = Number(row.scheduled_amount) - Number(row.received_amount);
                return (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      {row.cust ? (
                        <Link href={`/customers/${row.sale?.customer_id}`} className="text-primary hover:underline">
                          {row.cust.full_name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{row.sale?.plot_no ?? "—"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{row.sale?.code}</div>
                    </TableCell>
                    <TableCell className="text-xs">{row.period_label}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(row.due_date)}</TableCell>
                    <TableCell className="font-semibold">{formatPkr(row.scheduled_amount)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(row.received_amount)}
                    </TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatPkr(openAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={row.status === "overdue" ? "destructive" : "secondary"}
                        className="rounded-md font-normal"
                      >
                        {tInst(row.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {openAmount > 0 && row.sale_id ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs rounded-md"
                          render={<Link href={`/receipts/new?sale=${row.sale_id}&installment=${row.id}`} />}
                        >
                          {t("receive")}
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600">{tCommon("cleared")}</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 4: CASH BOOK & INCOME / EXPENSE STATEMENT */}
      {activeTab === "cashbook" && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("cashJournal")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{filteredTransactions.length} vouchers</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Voucher / Category</TableHead>
                <TableHead>Society Tag</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Inflow (Credit)</TableHead>
                <TableHead className="text-right">Outflow (Debit)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((t) => {
                const isInflow = t.transaction_type === "income" || t.transfer_side === "in";
                const isOutflow = t.transaction_type === "expense" || t.transfer_side === "out";
                return (
                  <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="text-xs text-muted-foreground">{formatDate(t.transaction_date)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-xs">{t.cash_categories?.name || "General"}</div>
                      <div className="font-mono text-[11px] text-muted-foreground">{t.transaction_type}</div>
                    </TableCell>
                    <TableCell className="text-xs">{t.societies?.name ?? "—"}</TableCell>
                    <TableCell className="text-xs max-w-sm truncate">{t.description || "—"}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {isInflow ? formatPkr(t.amount) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-amber-600 dark:text-amber-400">
                      {isOutflow ? formatPkr(t.amount) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4}>Statement Total Inflows &amp; Outflows</TableCell>
                <TableCell className="text-right text-emerald-600 dark:text-emerald-400">
                  {formatPkr(totalInflows)}
                </TableCell>
                <TableCell className="text-right text-amber-600 dark:text-amber-400">
                  {formatPkr(totalOutflows)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}

      {/* TAB 5: INVENTORY & TURNOVER */}
      {activeTab === "inventory" && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("inventoryStock")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{properties.length} plot units</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plot Code</TableHead>
                <TableHead>Plot No</TableHead>
                <TableHead>Society &amp; Block</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Area Size</TableHead>
                <TableHead>Asking Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((p) => {
                const soc = Array.isArray(p.societies) ? p.societies[0] : p.societies;
                const blk = Array.isArray(p.society_blocks) ? p.society_blocks[0] : p.society_blocks;
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      <Link href={`/inventory/${p.id}`} className="hover:underline">
                        {p.code}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold">{p.plot_no}</TableCell>
                    <TableCell>
                      {soc?.name ?? "—"} {blk?.name ? `· Block ${blk.name}` : ""}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tPropType(p.property_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatNumber(p.area)} {tArea(p.area_unit)}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(p.asking_price)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "available" ? "secondary" : p.status === "hold" ? "outline" : "default"}
                        className="rounded-md"
                      >
                        {tPropStatus(p.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-md"
                        render={<Link href={`/inventory/${p.id}`} />}
                      >
                        <Eye className="size-3 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 6: DEVELOPMENT & CONTRACTORS */}
      {activeTab === "contracts" && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <Handshake className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("workOrders")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{contracts.length} work orders</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>WO Number</TableHead>
                <TableHead>Contractor / Vendor</TableHead>
                <TableHead>Project Title</TableHead>
                <TableHead>Contract Type</TableHead>
                <TableHead>Agreed Value</TableHead>
                <TableHead>Paid to Date</TableHead>
                <TableHead>Remaining Payable</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => {
                const party = Array.isArray(c.parties) ? c.parties[0] : c.parties;
                return (
                  <TableRow key={c.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">{c.code}</TableCell>
                    <TableCell className="font-semibold">
                      {party ? (
                        <Link href={`/parties/${party.id}`} className="text-primary hover:underline">
                          {party.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md font-normal">
                        {tContractType(c.contract_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(c.contract_value)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(c.paid_amount)}
                    </TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatPkr(c.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-md">
                        {tContractStatus(c.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* TAB 7: LAND BANK & LANDLORDS */}
      {activeTab === "land" && (
        <div className="overflow-hidden rounded-[10px] border bg-card shadow-xs">
          <div className="flex items-center justify-between border-b px-5 py-3.5 bg-muted/20">
            <div className="flex items-center gap-2">
              <LandPlot className="size-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{t("landStatement")}</h2>
            </div>
            <span className="text-xs text-muted-foreground">{landParcels.length} parcels</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Land Code</TableHead>
                <TableHead>Parcel Title</TableHead>
                <TableHead>Landlord Seller</TableHead>
                <TableHead>Society</TableHead>
                <TableHead>Area Size</TableHead>
                <TableHead>Purchase Value</TableHead>
                <TableHead>Paid to Date</TableHead>
                <TableHead>Balance Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {landParcels.map((parcel) => {
                const party = Array.isArray(parcel.parties) ? parcel.parties[0] : parcel.parties;
                const soc = Array.isArray(parcel.societies) ? parcel.societies[0] : parcel.societies;
                return (
                  <TableRow key={parcel.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      <Link href={`/land-bank/${parcel.id}`} className="hover:underline">
                        {parcel.code}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{parcel.title}</TableCell>
                    <TableCell className="font-semibold">
                      {party ? (
                        <Link href={`/parties/${party.id}`} className="text-primary hover:underline">
                          {party.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{soc?.name ?? "—"}</TableCell>
                    <TableCell className="font-medium">
                      {parcel.area} {tArea(parcel.area_unit)}
                    </TableCell>
                    <TableCell className="font-semibold">{formatPkr(parcel.purchase_value)}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatPkr(parcel.paid_amount)}
                    </TableCell>
                    <TableCell className="font-semibold text-amber-600 dark:text-amber-400">
                      {formatPkr(parcel.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-md">
                        {tLandStatus(parcel.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
        active
          ? "bg-background text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function TabButton({
  label,
  icon: Icon,
  active,
  onClick,
  count,
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
        active
          ? "border-primary text-primary font-bold"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
      }`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] ${
            active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
