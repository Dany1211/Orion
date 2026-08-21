"use client";

import * as React from "react";
import { Search, Bell, Sparkles, Command } from "lucide-react";

interface TopBarProps {
  title?: string;
  subtitle?: string;
}

export function TopBar({ title, subtitle }: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-zinc-100 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Title area */}
      <div className="flex-1 min-w-0">
        {title ? (
          <div>
            <h2 className="text-sm font-black text-zinc-900 leading-none">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-400 font-medium mt-0.5">{subtitle}</p>}
          </div>
        ) : (
          /* Search bar */
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search projects, docs, insights…"
              className="w-full pl-9 pr-10 h-8 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <kbd className="text-[9px] font-bold text-zinc-400 bg-white border border-zinc-200 rounded px-1 py-0.5 leading-none">⌘K</kbd>
            </div>
          </div>
        )}
      </div>

      {/* AI status pill */}
      <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 select-none">
        <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
        <span className="text-[10px] font-bold text-indigo-700">AI Ready</span>
      </div>

      {/* Notifications */}
      <button className="relative h-8 w-8 rounded-lg border border-zinc-100 bg-zinc-50 flex items-center justify-center hover:bg-zinc-100 transition-colors">
        <Bell className="h-4 w-4 text-zinc-500" />
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-indigo-600" />
      </button>

      {/* Avatar */}
      <button className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 hover:ring-2 hover:ring-indigo-300 hover:ring-offset-1 transition-all">
        JD
      </button>
    </header>
  );
}
