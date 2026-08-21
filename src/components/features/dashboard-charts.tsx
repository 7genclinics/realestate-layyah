"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactPkr, formatPkr } from "@/lib/format";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";

export type CashflowPoint = {
  date: string;
  label: string;
  collections: number;
  expenses: number;
};

export type InventorySlice = {
  key: string;
  label: string;
  value: number;
  fill: string;
};

const cashflowConfig = {
  collections: { label: "Collections", color: "var(--chart-1)" },
  expenses: { label: "Expenses", color: "var(--chart-2)" },
} satisfies ChartConfig;

const inventoryConfig = {
  value: { label: "Units" },
} satisfies ChartConfig;

function MoneyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm">
      <p className="mb-1.5 text-xs font-medium">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name === "collections" ? "Collections" : "Expenses"}
            </span>
            <span className="tabular-nums">
              {formatPkr(Number(item.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardCharts({
  cashflow,
  inventory,
}: {
  cashflow: CashflowPoint[];
  inventory: InventorySlice[];
}) {
  const hasCashflow = cashflow.some(
    (row) => row.collections > 0 || row.expenses > 0,
  );
  const inventoryTotal = inventory.reduce((sum, row) => sum + row.value, 0);
  const pieData =
    inventoryTotal > 0 ? inventory.filter((row) => row.value > 0) : inventory;

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <section className="overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 via-white to-white xl:col-span-3">
        <div className="border-b border-sky-100/80 px-5 py-4">
          <h2 className="text-base font-semibold">Collections vs expenses</h2>
          <p className="text-sm text-muted-foreground">Last 14 days</p>
        </div>
        <div className="relative px-2 py-4">
          <ChartContainer
            config={cashflowConfig}
            className="aspect-auto h-[260px] w-full"
          >
            <BarChart data={cashflow} accessibilityLayer barGap={2}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(value) => formatCompactPkr(Number(value))}
              />
              <ChartTooltip content={<MoneyTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="collections"
                fill="var(--color-collections)"
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
              <Bar
                dataKey="expenses"
                fill="var(--color-expenses)"
                radius={[2, 2, 0, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ChartContainer>
          {!hasCashflow ? (
            <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-muted-foreground">
              No receipts or expenses in this period
            </p>
          ) : null}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-white xl:col-span-2">
        <div className="border-b border-emerald-100/80 px-5 py-4">
          <h2 className="text-base font-semibold">Inventory mix</h2>
          <p className="text-sm text-muted-foreground">By unit status</p>
        </div>
        <ChartContainer
          config={inventoryConfig}
          className="mx-auto aspect-square max-h-[220px]"
        >
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="label"
              innerRadius={54}
              outerRadius={80}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            >
              {pieData.map((entry) => (
                <Cell key={entry.key} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) {
                  return null;
                }
                const item = payload[0];
                return (
                  <div className="rounded-md border bg-background px-3 py-2 text-xs shadow-sm">
                    <p className="font-medium">{String(item.name)}</p>
                    <p className="text-muted-foreground">
                      {Number(item.value)} units
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ChartContainer>
        <div className="space-y-2 px-5 pb-5">
          {inventory.map((slice) => (
            <div key={slice.key} className="flex items-center gap-2 text-xs">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: slice.fill }}
              />
              <span className="text-muted-foreground">{slice.label}</span>
              <span className="ml-auto tabular-nums">{slice.value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
