import { AuthBackdrop } from "@/components/features/auth-backdrop";
import { SignIn2 } from "@/components/ui/clean-minimal-sign-in";

const ERROR_MESSAGES: Record<string, string> = {
  inactive:
    "This account is not active yet. Ask an owner to activate it before signing in.",
};

export default async function Home({
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
    <AuthBackdrop>
      <SignIn2
        nextPath={nextPath}
        errorMessage={errorKey ? ERROR_MESSAGES[errorKey] : undefined}
      />
    </AuthBackdrop>
  );
}
