"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  KeyRound,
  CheckCircle2,
  UserCheck,
  ExternalLink,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";

export default function ClientLoginPage() {
  const router = useRouter();
  const { loginAsClient, setClientSession } = useClientPortal();

  const [email, setEmail] = React.useState("");
  const [passcode, setPasscode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    setTimeout(() => {
      loginAsClient(email || "sarah.j@acmefintech.com");
      setIsLoading(false);
      router.push("/client");
    }, 600);
  };

  const handleQuickDemoClient = (clientName: string, company: string, clientEmail: string) => {
    setClientSession({
      client_id: `client-${Date.now()}`,
      client_name: clientName,
      client_company: company,
      client_email: clientEmail,
      project_id: "default",
      avatar_url:
        clientName === "Sarah Jenkins"
          ? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces"
          : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
      is_authenticated: true,
    });
    router.push("/client");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white flex flex-col justify-between p-6 sm:p-10 font-sans">
      {/* ── Top Header ── */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-white text-base">
            O
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-white">Orion</span>
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest ml-1.5 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              Client Portal
            </span>
          </div>
        </Link>

        <Link
          href="/login"
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 px-3.5 py-1.5 rounded-xl border border-zinc-800"
        >
          <span>Project Manager Login</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </header>

      {/* ── Main Login Box ── */}
      <main className="max-w-md w-full mx-auto my-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6"
        >
          {/* Headline */}
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Executive Client Portal</h1>
            <p className="text-xs text-zinc-400 font-medium max-w-xs mx-auto">
              Secure client access to inspect project milestones, sign off on deliverables, and meet with your Project Lead.
            </p>
          </div>

          {/* 1-Click Instant Demo Client Access */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-1">
              <Zap className="h-3 w-3 text-amber-400 fill-amber-400" /> Instant Demo Client Access:
            </p>

            <button
              type="button"
              onClick={() => handleQuickDemoClient("Sarah Jenkins", "Acme FinTech Global", "sarah.j@acmefintech.com")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-indigo-500/60 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white">
                  SJ
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                    Sarah Jenkins (Client Lead)
                  </p>
                  <p className="text-[10px] text-zinc-400">Acme FinTech Global • Mobile Banking SRS</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-indigo-400 transform group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoClient("David Vance", "HealthTech Ventures", "david.v@healthtech.io")}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-cyan-500/60 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-bold text-xs text-white">
                  DV
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    David Vance (VP of Tech)
                  </p>
                  <p className="text-[10px] text-zinc-400">HealthTech Ventures • HIPAA Vault Gateway</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transform group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-800" />
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
              Or sign in with credentials
            </span>
            <div className="flex-grow border-t border-zinc-800" />
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-300">Client Work Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client.lead@company.com"
                className="mt-1 w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-300">Portal Passcode or Access Key</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••••••••"
                className="mt-1 w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authorizing Client Session…</span>
              ) : (
                <>
                  <span>Enter Executive Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-zinc-800/80 pt-6">
        <p>© 2026 Orion Intelligence Platform • End-to-End Client Delivery Portal</p>
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <span>256-Bit TLS Encryption</span>
          <span>•</span>
          <span>WebRTC Video Calling</span>
          <span>•</span>
          <span>Milestone Governance</span>
        </div>
      </footer>
    </div>
  );
}
