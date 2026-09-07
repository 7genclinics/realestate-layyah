export const locales = ["en", "ur"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookieName = "locale";

export const localeDir: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  ur: "rtl",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "ur";
}

export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : defaultLocale;
}
