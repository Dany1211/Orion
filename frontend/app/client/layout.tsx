"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  FileSearch,
  FileSpreadsheet,
  MessageSquare,
  Video,
  LogOut,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Circle,
  FolderGit2,
} from "lucide-react";
import { ClientPortalProvider, useClientPortal } from "@/lib/contexts/client-portal-context";

function ClientPortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { clientSession, logoutClient, meetings } = useClientPortal();

  // If on login page, render children directly without navbar
  if (pathname === "/client/login") {
    return <>{children}</>;
  }

  const liveMeeting = meetings.find((m) => m.status === "live" || m.status === "scheduled");

  const navItems = [
    { label: "Executive Dashboard", href: "/client", icon: LayoutDashboard },
    { label: "Milestones & Sprints", href: "/client#sprints", icon: Layers },
    { label: "SRS Requirements", href: "/client#requirements", icon: FileSearch },
    { label: "Deliverables & Reports", href: "/client#deliverables", icon: FileSpreadsheet },
    { label: "PM Direct Messages", href: "/client/messages", icon: MessageSquare },
    { label: "Video Meetings", href: "/client/meetings", icon: Video, badge: liveMeeting?.status === "live" ? "LIVE" : undefined },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans">
      {/* ── Client Portal Top Navigation ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Client Badging */}
          <div className="flex items-center gap-4">
            <Link href="/client" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-base shadow-sm">
                O
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-zinc-900 tracking-tight">Orion</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Client Executive Portal
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {clientSession?.client_company || "Acme FinTech Global"}
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href.includes("#") && pathname === "/client");
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pathname === item.href
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="flex items-center gap-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      <Circle className="h-1.5 w-1.5 fill-emerald-500 animate-pulse" />
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Live Meeting Link + User Pill */}
          <div className="flex items-center gap-3">
            {/* Quick 1-Click Meeting Call */}
            <Link
              href="/meetings/orion-sync-789"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/20"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Join PM Meeting</span>
            </Link>

            {/* Client Profile / Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200">
              <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 overflow-hidden flex items-center justify-center font-bold text-xs text-indigo-700">
                {clientSession?.client_name ? clientSession.client_name.charAt(0) : "C"}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-zinc-900 leading-none">
                  {clientSession?.client_name || "Client Lead"}
                </p>
                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                  Client Partner
                </p>
              </div>

              <button
                onClick={() => {
                  logoutClient();
                  router.push("/client/login");
                }}
                className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-zinc-100 transition-colors ml-1"
                title="Sign out of Client Portal"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Content View ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {children}
      </main>

      {/* ── Client Portal Footer ── */}
      <footer className="border-t border-zinc-200/80 bg-white py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Orion • Dedicated Client Delivery Portal</p>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <Link href="/dashboard" className="text-indigo-600 font-semibold hover:underline">
              Switch to Project Manager Workspace →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientPortalProvider>
      <ClientPortalShell>{children}</ClientPortalShell>
    </ClientPortalProvider>
  );
}
