"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Cpu,
  FileText,
  CheckCircle2,
  Check,
  GitBranch,
  ShieldCheck,
  Zap,
} from "lucide-react";

const stats = [
  { label: "Requirements Parsed", value: "1.2M+" },
  { label: "Teams Using Orion", value: "500+" },
  { label: "Accuracy Rate", value: "98%" },
];

const features = [
  {
    icon: <Cpu className="h-5 w-5 text-indigo-600" />,
    title: "AI Requirement Analysis",
    desc: "Parse PRDs, user stories, and docs into structured specs instantly.",
    bg: "bg-indigo-50",
  },
  {
    icon: <GitBranch className="h-5 w-5 text-cyan-600" />,
    title: "Intelligent Planning",
    desc: "Auto-generate sprints, epics, and task dependencies with AI.",
    bg: "bg-cyan-50",
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-emerald-600" />,
    title: "Risk Prediction",
    desc: "Forecast blockers, scope creep, and delivery timelines in advance.",
    bg: "bg-emerald-50",
  },
  {
    icon: <Zap className="h-5 w-5 text-amber-600" />,
    title: "Instant Sync",
    desc: "Push tasks to Jira, Linear, and GitHub Issues in one click.",
    bg: "bg-amber-50",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen w-full flex flex-col bg-white font-sans relative overflow-x-hidden text-zinc-800">
      {/* ── Background ── */}
      <div className="pointer-events-none fixed inset-0 grid-bg-light opacity-60" />
      <div className="pointer-events-none fixed top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-radial from-indigo-500/10 via-cyan-500/5 to-transparent rounded-full blur-[100px]" />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2.5 select-none group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:shadow-indigo-200 transition-all duration-200">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-base font-black tracking-tight text-zinc-900">Orion</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {["Product", "Features", "Pricing", "Docs"].map((item) => (
              <a key={item} href="#" className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors">
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="flex items-center space-x-3">
            <Link href="/login" className="hidden sm:inline-flex text-sm font-bold text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200 active:scale-[0.98] transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-700 select-none">
              <Sparkles className="h-3 w-3 animate-pulse" />
              Workspace 1.0 · Now in Early Access
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-zinc-900 leading-[1.08] max-w-4xl mx-auto">
                Software Requirements,{" "}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                  Intelligently Planned
                </span>
              </h1>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-500 leading-relaxed font-medium">
                Orion transforms raw PRDs, scopes, and user stories into structured epics, sprints, and tasks — powered by AI, in seconds.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-12 rounded-xl bg-indigo-600 px-7 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-12 rounded-xl border border-zinc-200 bg-white px-7 text-sm font-bold text-zinc-700 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
              >
                Sign In to Workspace
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-3 pt-2 select-none">
              <div className="flex -space-x-2">
                {["bg-indigo-400", "bg-cyan-500", "bg-violet-500", "bg-emerald-500"].map((c, i) => (
                  <div key={i} className={`h-7 w-7 rounded-full ${c} ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-white`}>
                    {["A","B","C","D"][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs font-semibold text-zinc-500">
                Trusted by <span className="text-zinc-800 font-bold">500+ engineering teams</span>
              </p>
            </div>
          </motion.div>

          {/* ── Mockup Window ── */}
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="mt-16 mx-auto max-w-5xl rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-300/40 overflow-hidden text-left"
          >
            {/* Window chrome */}
            <div className="bg-zinc-50/80 border-b border-zinc-100 px-5 py-3.5 flex items-center gap-3 select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-md px-3 py-1 text-[11px] font-medium text-zinc-400 min-w-[200px] justify-center">
                  <span className="text-emerald-500">●</span>
                  app.orion.ai / workspace / sprint-planning
                </div>
              </div>
              <div className="w-16" />
            </div>

            {/* Sidebar + Main grid */}
            <div className="flex h-[340px] sm:h-[320px]">
              {/* Sidebar */}
              <div className="hidden sm:flex w-[200px] border-r border-zinc-100 bg-zinc-50/50 flex-col p-4 gap-1 flex-shrink-0">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2 px-2">Navigation</p>
                {[
                  { label: "Dashboard", active: false, icon: "◈" },
                  { label: "Requirements", active: false, icon: "◎" },
                  { label: "Sprint Planner", active: true, icon: "◉" },
                  { label: "Risk Matrix", active: false, icon: "◇" },
                  { label: "Settings", active: false, icon: "◌" },
                ].map(({ label, active, icon }) => (
                  <div key={label} className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors ${active ? "bg-indigo-100 text-indigo-700" : "text-zinc-500 hover:bg-zinc-100"}`}>
                    <span className="text-[11px]">{icon}</span>
                    {label}
                  </div>
                ))}
              </div>

              {/* 3-col mock layout */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 divide-x divide-zinc-100">
                {/* Col 1 */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Source Document</span>
                  </div>
                  <div className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2">
                    <div className="h-3 bg-zinc-200 rounded w-4/5 animate-pulse" />
                    <div className="h-3 bg-zinc-200 rounded w-full animate-pulse" />
                    <div className="h-3 bg-zinc-200 rounded w-3/5 animate-pulse" />
                    <div className="h-3 bg-zinc-200 rounded w-4/6 animate-pulse" />
                    <div className="h-3 bg-zinc-200 rounded w-2/5 animate-pulse" />
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg w-fit">
                    <Sparkles className="h-3 w-3" /> AI Analyzing...
                  </div>
                </div>

                {/* Col 2 */}
                <div className="p-5 flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3.5 w-3.5 text-cyan-500 flex-shrink-0" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">AI Pipeline</span>
                  </div>
                  <div className="space-y-3">
                    {["Structuring Epics", "Mapping Sprints", "Assigning Effort"].map((task, i) => (
                      <div key={task} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-zinc-700">{task}</span>
                          <span className={i < 2 ? "text-emerald-600" : "text-indigo-600"}>{i < 2 ? "Done" : "Running"}</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${i === 0 ? "bg-emerald-500 w-full" : i === 1 ? "bg-emerald-500 w-full" : "bg-indigo-500 w-3/4"}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-400 text-center">14 specs → 3 epics · 8 sprints</div>
                </div>

                {/* Col 3 */}
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Generated Tasks</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Setup OAuth Redirects", done: true },
                      { label: "Build Password Strength Meter", done: true },
                      { label: "Design Sprint Backlog UI", done: true },
                      { label: "Integrate Jira Webhook", done: false },
                    ].map(({ label, done }) => (
                      <div key={label} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold ${done ? "bg-emerald-50 border-emerald-100 text-emerald-800" : "bg-zinc-50 border-zinc-100 text-zinc-500"}`}>
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${done ? "bg-emerald-500" : "bg-zinc-200"}`}>
                          {done && <Check className="h-2.5 w-2.5 text-white stroke-[3]" />}
                        </div>
                        <span className={done ? "line-through opacity-60" : ""}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Stats Strip ── */}
        <section className="relative z-10 border-y border-zinc-100 bg-zinc-50/60 py-10">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
            {stats.map(({ label, value }) => (
              <div key={label} className="space-y-1">
                <p className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">{value}</p>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Cards ── */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900">
              Everything your team needs
            </h2>
            <p className="text-sm text-zinc-500 font-medium max-w-lg mx-auto">
              From raw requirements to structured sprints — Orion handles the entire project intelligence loop.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group p-6 rounded-2xl border border-zinc-100 bg-white shadow-sm hover:shadow-md hover:border-zinc-200 hover:-translate-y-1 transition-all duration-250 space-y-3"
              >
                <div className={`h-10 w-10 rounded-xl ${f.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  {f.icon}
                </div>
                <h3 className="text-sm font-black text-zinc-900">{f.title}</h3>
                <p className="text-xs font-medium text-zinc-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 pb-20">
          <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 p-px overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div className="rounded-[22px] bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-600 px-8 py-14 sm:py-16 text-center text-white space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold select-none">
                <Sparkles className="h-3 w-3" /> Free 14-day trial · No credit card required
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
                Ready to plan your next project with AI?
              </h2>
              <p className="text-sm font-medium text-white/75 max-w-md mx-auto">
                Join 500+ teams using Orion to ship faster with smarter requirement intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center h-12 rounded-xl bg-white px-8 text-sm font-black text-indigo-700 shadow-lg hover:bg-zinc-50 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
                >
                  Create Free Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center h-12 rounded-xl border border-white/25 bg-white/10 px-8 text-sm font-bold text-white hover:bg-white/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 w-full sm:w-auto"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-zinc-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-zinc-400">
          <div className="flex items-center gap-2.5 select-none">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center">
              <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-black text-zinc-700">Orion</span>
            <span className="text-zinc-300">·</span>
            <span>&copy; {new Date().getFullYear()} Orion Intelligence Inc.</span>
          </div>
          <div className="flex items-center gap-6">
            {["Security", "Privacy Policy", "Terms"].map((item) => (
              <a key={item} href="#" className="hover:text-zinc-700 transition-colors">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
