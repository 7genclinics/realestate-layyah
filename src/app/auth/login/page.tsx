import Image from "next/image";
import { SignIn2 } from "@/components/ui/clean-minimal-sign-in";

const ERROR_MESSAGES: Record<string, string> = {
  inactive:
    "This account is not active yet. Ask an owner to activate it before signing in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
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
          alt="Housing society buildings"
          fill
          priority
          quality={90}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/40" aria-hidden />
      </div>
      <SignIn2
        nextPath={nextPath}
        errorMessage={errorKey ? ERROR_MESSAGES[errorKey] : undefined}
      />
    </main>
  );
}
