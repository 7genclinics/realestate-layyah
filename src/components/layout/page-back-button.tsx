"use client";

import { ArrowLeft } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "@/lib/constants";

const ROOT_PATHS = new Set(NAV_ITEMS.map((item) => item.href));

export function PageBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("common");

  if (ROOT_PATHS.has(pathname)) {
    return null;
  }

  const section = `/${pathname.split("/").filter(Boolean)[0] ?? ""}`;
  const fallback = ROOT_PATHS.has(section) ? section : "/dashboard";

  function goBack() {
    const referrer = document.referrer;
    if (referrer.startsWith(window.location.origin)) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground print:hidden"
    >
      <ArrowLeft className="size-4 rtl:rotate-180" />
      {t("back")}
    </button>
  );
}
