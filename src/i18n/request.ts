import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, localeCookieName, resolveLocale } from "@/i18n/config";

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveLocale(store.get(localeCookieName)?.value ?? defaultLocale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
