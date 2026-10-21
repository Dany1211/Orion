"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen,
  BrainCircuit,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  Plus,
  Video,
  ShieldCheck,
} from "lucide-react";

import { useWorkspace } from "@/lib/contexts/workspace-context";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/dashboard/projects", icon: FolderOpen },
  { label: "AI Analysis", href: "/dashboard/analysis", icon: BrainCircuit },
  { label: "Client Portal", href: "/dashboard/client-portal", icon: ShieldCheck },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Meetings", href: "/dashboard/meetings", icon: Video },
];

const secondaryNav = [
  { label: "Team", href: "/dashboard/team", icon: Users },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, organization, projects } = useWorkspace();

  return (
    <aside className="flex flex-col h-full w-full bg-white border-r border-zinc-100/80">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3 select-none group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-900 leading-none tracking-tight">Orion</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">Intelligence Platform</p>
          </div>
        </Link>
      </div>

      {/* Workspace pill */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100">
          <div className="h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-800 truncate leading-none">
              {organization?.name || "Loading…"}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 capitalize">
              {organization?.plan || "free"} plan
            </p>
          </div>
        </div>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative",
                active
                  ? "bg-indigo-50 text-indigo-700 font-semibold"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 font-medium"
              )}
            >
              <Icon className={cn("h-4 w-4 flex-shrink-0 transition-colors", active ? "text-indigo-600" : "text-zinc-400 group-hover:text-zinc-600")} />
              <span className="flex-1 truncate">{label}</span>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r-full" />}
            </Link>
          );
        })}

        {/* Recent Projects */}
        {projects.length > 0 && (
          <div className="pt-5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Recent</p>
            <div className="space-y-0.5">
              {projects.slice(0, 4).map((p) => {
                const active = pathname === `/dashboard/projects/${p.id}`;
                const dot = p.color ? p.color.split(" ")[0].replace("from-", "bg-") : "bg-indigo-500";
                return (
                  <Link
                    key={p.id}
                    href={`/dashboard/projects/${p.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 group",
                      active
                        ? "bg-zinc-100 text-zinc-900 font-semibold"
                        : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 font-medium"
                    )}
                  >
                    <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dot)} />
                    <span className="flex-1 truncate">{p.name}</span>
                    {active && <ChevronRight className="h-3 w-3 text-zinc-400" />}
                  </Link>
                );
              })}
              <Link
                href="/dashboard/projects/new"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-all duration-150"
              >
                <Plus className="h-3.5 w-3.5" />
                New Project
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Secondary Nav */}
      <div className="px-3 pb-3 pt-2 border-t border-zinc-100 space-y-0.5">
        {secondaryNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-150",
                active ? "bg-zinc-50 text-zinc-900 font-semibold" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 font-medium"
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
            </Link>
          );
        })}

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2.5 mt-1 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer group">
          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {user?.email ? user.email.slice(0, 2).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-800 leading-none truncate">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{user?.email || ""}</p>
          </div>
          <Link href="/login" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <LogOut className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-600" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
