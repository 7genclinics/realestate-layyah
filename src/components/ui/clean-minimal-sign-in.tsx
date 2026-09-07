"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

type SignIn2Props = {
  nextPath?: string;
  errorMessage?: string;
};

const SignIn2 = ({ nextPath = "/dashboard", errorMessage }: SignIn2Props) => {
  const t = useTranslations("auth");
  const [formError, setFormError] = useState(errorMessage);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const isPending = loading || isSubmitting;

  async function onSubmit(values: LoginFormValues) {
    setFormError(undefined);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword(values);

      if (error) {
        // Map known auth errors to friendly messages
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("invalid_credentials")
        ) {
          setFormError(t("incorrectCredentials"));
        } else if (error.message.includes("Email not confirmed")) {
          setFormError(t("verifyEmail"));
        } else if (error.message.includes("Too many requests")) {
          setFormError(t("tooMany"));
        } else {
          setFormError(t("signInFailed"));
        }
        setLoading(false);
        return;
      }

      window.location.href = nextPath;
    } catch {
      // Never expose raw SDK or network errors to the user
      setFormError(t("unableToConnect"));
      setLoading(false);
    }
  }

  const displayError =
    formError ??
    (errors.email ? t("invalidEmail") : errors.password ? t("passwordMin") : undefined);

  return (
    <div className="w-full max-w-sm rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50 via-white to-white p-8 shadow-sm">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
        <LogIn className="h-5 w-5" />
      </div>
      <h2 className="font-heading mb-2 text-center text-2xl font-semibold">
        {t("signInTitle")}
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        {t("signInSubtitle")}
      </p>

      <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-2 flex w-full flex-col gap-3">
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              autoComplete="email"
              placeholder={t("email")}
              disabled={isPending}
              className="w-full rounded-xl border border-input bg-muted/40 py-2 pr-3 pl-10 text-sm text-foreground focus:ring-2 focus:ring-ring/40 focus:outline-none disabled:opacity-60"
              {...register("email")}
            />
          </div>
          <div className="relative">
            <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("password")}
              disabled={isPending}
              className="w-full rounded-xl border border-input bg-muted/40 py-2 pr-10 pl-10 text-sm text-foreground focus:ring-2 focus:ring-ring/40 focus:outline-none disabled:opacity-60"
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              disabled={isPending}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                setShowPassword((visible) => !visible);
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-gray-700 focus:outline-none disabled:opacity-50"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <div className="flex w-full items-start justify-between gap-2">
            {displayError ? (
              <div className="text-start text-sm text-red-500">{displayError}</div>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="text-xs font-medium hover:underline"
            >
              {t("forgotPassword")}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 mb-4 w-full cursor-pointer rounded-lg bg-primary py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("signingIn")}
            </span>
          ) : (
            t("getStarted")
          )}
        </button>
      </form>
    </div>
  );
};

export { SignIn2 };
