import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_Arabic, Poppins, Syne } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { AppProviders } from "@/providers/app-providers";
import { localeDir, type Locale } from "@/i18n/config";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoUrdu = Noto_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urdu",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("brand");
  return {
    title: {
      default: t("metaTitle"),
      template: `%s | ${t("name")}`,
    },
    description: t("metaDescription"),
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = (await getLocale()) as Locale;
  const dir = localeDir[locale];

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${poppins.variable} ${syne.variable} ${geistMono.variable} ${notoUrdu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
