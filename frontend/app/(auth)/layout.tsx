import * as React from "react";
import Link from "next/link";
import { VisualPanel } from "@/components/auth/visual-panel";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      {/* ── Left Panel (45%) ── Desktop only */}
      <aside className="hidden lg:flex lg:w-[45%] h-screen sticky top-0 flex-shrink-0">
        <VisualPanel />
      </aside>

      {/* ── Right Panel (55%) ── Full scroll area */}
      <div className="flex-1 min-h-screen flex flex-col items-center justify-center bg-zinc-50/60 px-5 sm:px-10 py-14 relative overflow-y-auto">
        {/* Top-left back to home link */}
        <Link
          href="/"
          className="absolute top-6 left-6 text-xs font-bold text-zinc-400 hover:text-zinc-700 flex items-center gap-1.5 transition-colors select-none"
        >
          ← Orion
        </Link>

        {/* Mobile branding (hidden on desktop) */}
        <div className="flex lg:hidden flex-col items-center text-center space-y-3 mb-8 select-none">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-zinc-900">Orion</h1>
            <p className="text-xs text-zinc-500 max-w-[260px] mt-0.5 font-medium">
              AI-powered Project Requirement Intelligence
            </p>
          </div>
        </div>

        {/* Auth card container */}
        <div className="w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}
