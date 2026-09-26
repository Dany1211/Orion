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
  AlertCircle,
  Mail,
  UserPlus,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { createClient } from "@/lib/supabase/client";

function ClientLoginContent() {
  const router = useRouter();
  const { authenticateClient, registerClientAccount } = useClientPortal();

  const [activeTab, setActiveTab] = React.useState<"signin" | "register">("signin");
  const [email, setEmail] = React.useState("");
  const [passcode, setPasscode] = React.useState("");
  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [availableProjects, setAvailableProjects] = React.useState<{ id: string; name: string }[]>([]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  // Load available projects dynamically for registration
  React.useEffect(() => {
    async function loadProjects() {
      try {
        const supabase = createClient() as any;
        const { data, error } = await supabase.from("projects").select("id, name, title");
        if (!error && data && data.length > 0) {
          setAvailableProjects(
            data.map((p: any) => ({
              id: p.id,
              name: p.name || p.title || "Project",
            }))
          );
          setProjectId(data[0].id);
        }
      } catch (e) {}
    }
    loadProjects();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    const result = await authenticateClient(email, passcode);
    setIsLoading(false);

    if (result.success) {
      setSuccessMsg("Signed in successfully! Loading project portal…");
      setTimeout(() => {
        router.push("/client");
      }, 500);
    } else {
      setErrorMsg(result.error || "Invalid client credentials. Please check your email and passcode.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    const result = await registerClientAccount({
      name,
      email,
      company,
      passcode,
      projectId: projectId || "default",
    });

    setIsLoading(false);

    if (result.success) {
      setSuccessMsg("Client account registered successfully! Redirecting…");
      setTimeout(() => {
        router.push("/client");
      }, 500);
    } else {
      setErrorMsg(result.error || "Failed to register account.");
    }
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

      {/* ── Main Auth Card ── */}
      <main className="max-w-md w-full mx-auto my-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Executive Client Portal</h1>
            <p className="text-xs text-zinc-400 font-medium max-w-xs mx-auto">
              Sign in to monitor milestone delivery, sign off on specifications, and meet with your Project Lead.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => {
                setActiveTab("signin");
                setErrorMsg("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "signin"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Client Sign In
            </button>
            <button
              onClick={() => {
                setActiveTab("register");
                setErrorMsg("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "register"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Register Account
            </button>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-xs font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ── Tab 1: Sign In Form ── */}
          {activeTab === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300">Client Email Address</label>
                <div className="mt-1 relative">
                  <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Portal Passcode / Password</label>
                <div className="mt-1 relative">
                  <KeyRound className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter assigned passcode"
                    className="w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 pl-9 pr-3.5 py-2.5 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Authenticating Client Session…</span>
                ) : (
                  <>
                    <span>Enter Client Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Tab 2: Register Client Account Form ── */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-300">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="mt-1 w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@company.com"
                  className="mt-1 w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Company / Organization</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Global"
                  className="mt-1 w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {availableProjects.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-zinc-300">Select Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="mt-1 w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    {availableProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-300">Choose Passcode / Password</label>
                <input
                  type="password"
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Create your portal passcode"
                  className="mt-1 w-full text-xs rounded-xl bg-zinc-950 border border-zinc-800 px-3.5 py-2 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>Registering Client Account…</span>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create & Link Account</span>
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </main>

      {/* ── Footer ── */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-zinc-800/80 pt-6">
        <p>© 2026 Orion Intelligence Platform • Dynamic Client Delivery Portal</p>
        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
          <span>TLS 256-Bit Encrypted</span>
          <span>•</span>
          <span>In-Website Video Meetings</span>
          <span>•</span>
          <span>Milestone Governance</span>
        </div>
      </footer>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white text-xs">Loading…</div>}>
      <ClientLoginContent />
    </React.Suspense>
  );
}
