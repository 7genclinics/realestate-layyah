import Image from "next/image";
import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

export async function AuthBackdrop({ children }: { children: ReactNode }) {
  const t = await getTranslations("auth");

  return (
    <main className="relative flex min-h-dvh w-full flex-1 items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src="/society-bg.jpg"
          alt={t("bgMosqueAlt")}
          fill
          preload
          quality={90}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-950/80 via-black/45 to-amber-950/55"
          aria-hidden
        />
      </div>
      {children}
      <p className="pointer-events-none absolute bottom-5 left-5 hidden rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md sm:block">
        {t("locationBadge")}
      </p>
    </main>
  );
}
