"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Languages } from "lucide-react";
import { setLocaleCookie } from "@/lib/actions/locale";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleCookie(next);
      router.refresh();
    });
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex h-8 items-center gap-1 rounded-full border border-border/80 bg-card px-1.5 shadow-xs"
    >
      <Languages className="ms-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <button
        type="button"
        disabled={isPending}
        onClick={() => switchTo("en")}
        className={cn(
          "rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide transition-colors disabled:opacity-60",
          locale === "en"
            ? "bg-muted text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => switchTo("ur")}
        className={cn(
          "rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-60",
          locale === "ur"
            ? "bg-muted text-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        aria-pressed={locale === "ur"}
      >
        اردو
      </button>
    </div>
  );
}
