"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  FileSearch,
  BrainCircuit,
  BarChart3,
  Users,
  Settings,
  ChevronDown,
  Plus,
  ChevronsUpDown,
  LogOut,
  HelpCircle,
  Bell,
} from "lucide-react";

import { useWorkspace } from "@/lib/contexts/workspace-context";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderKanban, badge: 4 },
  { label: "Requirements", href: "/dashboard/requirements", icon: FileSearch },
  { label: "AI Analysis", href: "/dashboard/analysis", icon: BrainCircuit, badge: 2, badgeColor: "bg-indigo-100 text-indigo-700" },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

const secondaryNav = [
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Help & Docs", href: "/dashboard/help", icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [projectsOpen, setProjectsOpen] = React.useState(true);
  const { user, organization, projects, isLoading } = useWorkspace();

  return (
    <aside className="flex flex-col h-full w-full bg-white border-r border-zinc-100">
      {/* ── Logo & Workspace ── */}
      <div className="px-4 pt-5 pb-4 border-b border-zinc-100">
        <Link href="/dashboard" className="flex items-center gap-2.5 select-none group mb-4">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-zinc-900 leading-none">Orion</p>
            <p className="text-[10px] font-semibold text-zinc-400 mt-0.5 truncate">Intelligence Platform</p>
          </div>
        </Link>

        {/* Workspace switcher */}
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-zinc-150 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left group">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-800 truncate">
              {organization?.name || "Loading Workspace…"}
            </p>
            <p className="text-[10px] text-zinc-400 font-medium">
              {organization?.plan ? `${organization.plan.charAt(0).toUpperCase()}${organization.plan.slice(1)} Plan` : ""}
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-zinc-400 flex-shrink-0" />
        </button>
      </div>

      {/* ── Primary Nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, badge, badgeColor }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 group",
                active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", active ? "text-indigo-600" : "text-zinc-400 group-hover:text-zinc-700")} />
              <span className="flex-1 truncate">{label}</span>
              {badge && (
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", badgeColor ?? "bg-zinc-100 text-zinc-600")}>
                  {badge}
                </span>
              )}
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-600 rounded-r-full" />}
            </Link>
          );
        })}

        {/* Recent Projects section */}
        <div className="pt-4 pb-1">
          <button
            onClick={() => setProjectsOpen(!projectsOpen)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <span>Recent Projects</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", projectsOpen ? "" : "-rotate-90")} />
          </button>
        </div>
        {projectsOpen && (
          <div className="space-y-0.5">
            {projects.slice(0, 3).map((p) => {
              const colorClass = p.color ? p.color.split(" ")[0] : "bg-indigo-500";
              return (
                <Link
                  key={p.id}
                  href={`/dashboard/projects/${p.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all duration-150 group"
                >
                  <div className={cn("h-2 w-2 rounded-full flex-shrink-0", colorClass)} />
                  <span className="flex-1 truncate text-xs">{p.name}</span>
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
            >
              <Plus className="h-3.5 w-3.5" />
              New Project
            </Link>
          </div>
        )}

        {/* Secondary Nav */}
        <div className="pt-4 pb-1">
          <span className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Workspace</span>
        </div>
        {secondaryNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-150 group",
                active ? "bg-indigo-50 text-indigo-700" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0", active ? "text-indigo-600" : "text-zinc-400 group-hover:text-zinc-700")} />
              <span className="flex-1 truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── User Profile ── */}
      <div className="px-3 pb-4 pt-2 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            {user?.email ? user.email.slice(0, 2).toUpperCase() : "JD"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-800 leading-none truncate">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "John Doe"}
            </p>
            <p className="text-[10px] font-medium text-zinc-400 mt-0.5 truncate">
              {user?.email || "john@acme.com"}
            </p>
          </div>
          <Link href="/login" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <LogOut className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-700 transition-colors" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
