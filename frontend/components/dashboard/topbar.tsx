"use client";

import * as React from "react";
import { Search, Bell, Sparkles } from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";

export function TopBar() {
  const { user } = useWorkspace();
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  return (
    <header className="h-14 bg-white border-b border-zinc-100 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
        <input
          type="text"
          placeholder="Search projects, docs…"
          className="w-full pl-9 pr-12 h-8 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-semibold text-zinc-400 bg-white border border-zinc-200 rounded px-1 py-0.5">⌘K</kbd>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* AI status */}
        <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5 select-none">
          <Sparkles className="h-3 w-3 text-indigo-500" />
          <span className="text-[11px] font-medium text-indigo-600">AI Ready</span>
        </div>

        {/* Notifications */}
        <button className="relative h-8 w-8 rounded-lg border border-zinc-100 bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-colors">
          <Bell className="h-4 w-4 text-zinc-500" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        </button>

        {/* Avatar */}
        <button className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-semibold hover:ring-2 hover:ring-indigo-300 hover:ring-offset-1 transition-all">
          {initials}
        </button>
      </div>
    </header>
  );
}
