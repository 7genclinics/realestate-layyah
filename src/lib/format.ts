import { format, parseISO } from "date-fns";

export function formatPkr(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactPkr(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = value.length <= 10 ? parseISO(value) : new Date(value);
  return format(date, "dd MMM yyyy");
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return format(new Date(value), "dd MMM yyyy, h:mm a");
}
