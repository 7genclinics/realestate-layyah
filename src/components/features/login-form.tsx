"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm({
  nextPath = "/dashboard",
  errorMessage,
}: {
  nextPath?: string;
  errorMessage?: string;
}) {
  const router = useRouter();
  const t = useTranslations("auth");
  const tBrand = useTranslations("brand");
  const [formError, setFormError] = useState(errorMessage);
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setFormError(undefined);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setFormError(error.message);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Building2 className="size-5" />
        </div>
        <div>
          <h1 className="font-heading text-lg font-semibold">{tBrand("name")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("societyManagement")}
          </p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@mohkam.com"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-9"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        {formError ? (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        ) : null}

        <Button className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              {t("signingIn")}
            </>
          ) : (
            t("signIn")
          )}
        </Button>
      </form>

      <p className="mt-6 text-xs text-muted-foreground">
        {t("inviteOnly")}
      </p>
    </div>
  );
}
