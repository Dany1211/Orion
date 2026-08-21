"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { CheckCircle2, User, Mail, Building2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SocialLogin } from "@/components/auth/social-login";
import { PasswordStrength } from "@/components/auth/password-strength";

const signupSchema = z
  .object({
    fullName: z.string().min(2, "Must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    organization: z.string().optional(),
    password: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Needs an uppercase letter")
      .regex(/[a-z]/, "Needs a lowercase letter")
      .regex(/[0-9]/, "Needs a number")
      .regex(/[^A-Za-z0-9]/, "Needs a special character"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeTerms: z.boolean().refine((v) => v === true, {
      message: "You must accept the Terms & Privacy Policy",
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

// ─── Toggle: set to true for instant sign up without Supabase ────────
const MOCK_LOGIN = false;
// ─────────────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [pwFocused, setPwFocused] = React.useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: "", email: "", organization: "",
      password: "", confirmPassword: "", agreeTerms: false,
    },
  });

  const passwordValue = watch("password") ?? "";
  const pwRegister = register("password");

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);

    if (MOCK_LOGIN) {
      await new Promise((r) => setTimeout(r, 800));
      setIsLoading(false);
      setIsSuccess(true);
      return;
    }

    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          organization: data.organization || "",
        },
      },
    });

    setIsLoading(false);
    if (error) {
      console.error("Signup error:", error.message);
      return;
    }
    setIsSuccess(true);
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
          <h3 className="text-lg font-black text-zinc-900">Workspace created!</h3>
          <p className="text-sm text-zinc-500 font-medium">Check your email to verify your account.</p>
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
      {/* Card */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-xl shadow-zinc-200/40 overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-zinc-50">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Create your workspace</h1>
          <p className="mt-1.5 text-sm font-medium text-zinc-500">
            Start building smarter projects with AI.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-7">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Two-column: Name + Organization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="John Doe"
                autoComplete="name"
                icon={<User className="h-4 w-4" />}
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              <Input
                label="Organization"
                placeholder="Acme Inc. (optional)"
                autoComplete="organization"
                icon={<Building2 className="h-4 w-4" />}
                error={errors.organization?.message}
                {...register("organization")}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password with strength */}
            <div className="space-y-2">
              <PasswordInput
                label="Password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                error={errors.password?.message}
                {...pwRegister}
                onFocus={() => setPwFocused(true)}
                onBlur={(e) => { pwRegister.onBlur(e); setPwFocused(false); }}
              />
              <PasswordStrength
                value={passwordValue}
                showRequirements={pwFocused || passwordValue.length > 0}
              />
            </div>

            <PasswordInput
              label="Confirm Password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Checkbox
              label="I agree to the Terms & Privacy Policy"
              error={errors.agreeTerms?.message}
              {...register("agreeTerms")}
            />

            <Button
              type="submit"
              className="w-full h-11 text-sm font-bold rounded-xl"
              isLoading={isLoading}
            >
              Create Account
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 select-none">
              <div className="flex-1 h-px bg-zinc-100" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">or</span>
              <div className="flex-1 h-px bg-zinc-100" />
            </div>

            <SocialLogin />
          </form>
        </div>
      </div>

      {/* Footer link */}
      <p className="text-center text-xs font-semibold text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-black text-indigo-600 hover:text-indigo-700 hover:underline underline-offset-4 transition-colors">
          Sign In
        </Link>
      </p>
    </motion.div>
  );
}
