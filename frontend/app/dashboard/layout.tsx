"use client";

import * as React from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { WorkspaceProvider } from "@/lib/contexts/workspace-context";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  return (
    <WorkspaceProvider>
      <div className="flex h-screen w-full bg-zinc-50 font-sans overflow-hidden">
      {/* ── Desktop Sidebar ── */}
      <div className="hidden lg:flex w-[240px] xl:w-[260px] h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <div className={cn(
        "lg:hidden fixed left-0 top-0 h-full w-[260px] z-50 transition-transform duration-300 ease-out",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="absolute top-4 right-4 h-7 w-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar with mobile menu button */}
        <div className="flex items-center gap-3 bg-white border-b border-zinc-100 px-4 lg:px-0">
          <button
            className="lg:hidden h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 transition-colors flex-shrink-0"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <TopBar />
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
    </WorkspaceProvider>
  );
}
