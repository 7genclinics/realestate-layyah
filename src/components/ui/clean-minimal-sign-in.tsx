"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from "lucide-react";
import { createClient } from "@/lib/client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

type SignIn2Props = {
  nextPath?: string;
  errorMessage?: string;
};

const SignIn2 = ({ nextPath = "/dashboard", errorMessage }: SignIn2Props) => {
  const router = useRouter();
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

  const displayError =
    formError ?? errors.email?.message ?? errors.password?.message;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50 via-white to-white p-8 shadow-sm">
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
        <LogIn className="h-5 w-5" />
      </div>
      <h2 className="font-heading mb-2 text-center text-2xl font-semibold">
        Sign in with email
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        Manage societies, properties, bookings, and customers in one place.
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
              placeholder="Email"
              className="w-full rounded-xl border border-input bg-muted/40 py-2 pr-3 pl-10 text-sm text-foreground focus:ring-2 focus:ring-ring/40 focus:outline-none"
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
              placeholder="Password"
              className="w-full rounded-xl border border-input bg-muted/40 py-2 pr-10 pl-10 text-sm text-foreground focus:ring-2 focus:ring-ring/40 focus:outline-none"
              {...register("password")}
            />
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                setShowPassword((visible) => !visible);
              }}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
              <div className="text-left text-sm text-red-500">{displayError}</div>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="text-xs font-medium hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 mb-4 w-full cursor-pointer rounded-lg bg-primary py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in
            </span>
          ) : (
            "Get Started"
          )}
        </button>
      </form>
    </div>
  );
};

export { SignIn2 };
