"use server";

import { cookies } from "next/headers";
import { localeCookieName, resolveLocale, type Locale } from "@/i18n/config";

export async function setLocaleCookie(nextLocale: Locale): Promise<void> {
  const locale = resolveLocale(nextLocale);
  const store = await cookies();
  store.set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
