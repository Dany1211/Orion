"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, FlaskConical, AlertCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SocialLogin } from "@/components/auth/social-login";

// ─── Toggle: set to true for instant dashboard access without Supabase ────────
const MOCK_LOGIN = false;
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").min(8, "Must be at least 8 characters"),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);

    if (MOCK_LOGIN) {
      // ── Mock mode: skip Supabase, go straight to dashboard ──
      await new Promise((r) => setTimeout(r, 800));
      router.push("/dashboard");
      return;
    }

    // ── Real Supabase auth (activate when ready) ──
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    setIsLoading(false);
    if (error) {
      console.error("Login error:", error.message);
      return;
    }
    setIsSuccess(true);
    router.push("/dashboard");
  };

  const fillMockCredentials = () => {
    setValue("email", "demo@orion.ai");
    setValue("password", "Password123!");
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-zinc-100 shadow-xl p-12 text-center space-y-5"
      >
        <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
          <CheckCircle2 className="h-7 w-7 stroke-[2]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-zinc-900">Signed in successfully</h3>
          <p className="text-sm text-zinc-500 font-medium">Loading your Orion workspace…</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="space-y-5 w-full"
    >
      {/* No-organization error banner */}
      {errorParam === "no_org" && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-800">Account setup incomplete</p>
            <p className="text-[11px] font-medium text-red-700 mt-0.5">
              Your account is not linked to any organization. Please contact your administrator or sign up to create a workspace.
            </p>
          </div>
        </div>
      )}

      {/* Mock login banner */}
      {MOCK_LOGIN && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <FlaskConical className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-800">Mock Mode Active</p>
            <p className="text-[11px] font-medium text-amber-700 mt-0.5">
              Any credentials will log you in.{" "}
              <button
                type="button"
                onClick={fillMockCredentials}
                className="underline font-bold hover:text-amber-900 transition-colors"
              >
                Fill demo credentials
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Client Portal Quick Switcher Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
            CP
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900">Are you a Client Partner?</p>
            <p className="text-[11px] text-zinc-500 font-medium">
              Access your project dashboard, meeting room & milestone approvals.
            </p>
          </div>
        </div>
        <Link
          href="/client/login"
          className="flex-shrink-0 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-1"
        >
          <span>Client Portal</span>
          <span>→</span>
        </Link>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-zinc-50">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Project Manager Sign In</h1>
          <p className="mt-1.5 text-sm font-medium text-zinc-500">
            Sign in to manage projects, AI analysis & client delivery
          </p>
        </div>

        <div className="px-8 py-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />

            <div className="flex items-center justify-between">
              <Checkbox label="Remember me" {...register("rememberMe")} />
              <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-bold rounded-xl" isLoading={isLoading}>
              {MOCK_LOGIN ? "Sign In (Mock)" : "Sign In"}
            </Button>

            <div className="relative flex items-center gap-3 select-none">
              <div className="flex-1 h-px bg-zinc-100" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">or</span>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>

            <SocialLogin />
          </form>
        </div>
      </div>

      <p className="text-center text-xs font-semibold text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-black text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-4 transition-colors">
          Create Account
        </Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-zinc-400 text-xs">Loading…</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
