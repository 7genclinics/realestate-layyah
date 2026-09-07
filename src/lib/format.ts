import { format, parseISO } from "date-fns";
import { enUS, ur } from "date-fns/locale";

function intlLocale(locale?: string) {
  return locale === "ur" ? "ur-PK" : "en-PK";
}

function dateLocale(locale?: string) {
  return locale === "ur" ? ur : enUS;
}

export function formatPkr(value: number | null | undefined, locale?: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactPkr(value: number | null | undefined, locale?: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "PKR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, locale?: string) {
  if (value === null || value === undefined) {
    return "—";
  }

  return new Intl.NumberFormat(intlLocale(locale), {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(value: string | null | undefined, locale?: string) {
  if (!value) {
    return "—";
  }

  const date = value.length <= 10 ? parseISO(value) : new Date(value);
  return format(date, "dd MMM yyyy", { locale: dateLocale(locale) });
}

export function formatDateTime(value: string | null | undefined, locale?: string) {
  if (!value) {
    return "—";
  }

  return format(new Date(value), "dd MMM yyyy, h:mm a", { locale: dateLocale(locale) });
}
