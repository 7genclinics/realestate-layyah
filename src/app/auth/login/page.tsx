import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SignIn2 } from "@/components/ui/clean-minimal-sign-in";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("auth");
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/")
      ? params.next
      : "/dashboard";
  const errorKey = typeof params.error === "string" ? params.error : undefined;

  return (
    <main className="relative flex min-h-dvh w-full flex-1 items-center justify-center overflow-hidden p-6">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image
          src="/society-bg.jpg"
          alt={t("bgAlt")}
          fill
          priority
          quality={90}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      </div>
      <div className="absolute end-4 top-4 z-10 sm:end-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <SignIn2
        nextPath={nextPath}
        errorMessage={errorKey === "inactive" ? t("inactive") : undefined}
      />
    </main>
  );
}
