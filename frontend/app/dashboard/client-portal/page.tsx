"use client";

import * as React from "react";
import Link from "next/link";
import {
  SlidersHorizontal,
  Eye,
  CheckCircle2,
  Users,
  Sparkles,
  ExternalLink,
  Lock,
  Globe,
  Video,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { ClientVisibilityControls } from "@/components/client/client-visibility-controls";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ClientPortalProvider, useClientPortal } from "@/lib/contexts/client-portal-context";

function ClientPortalManagerContent() {
  const { projects, activeProjectId } = useWorkspace();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(activeProjectId || "default");
  const [showPreviewModal, setShowPreviewModal] = React.useState(false);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || {
    id: "default",
    title: "FinTech Mobile Gateway",
    description: "Enterprise mobile banking platform with biometric auth and real-time ledger.",
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-zinc-900">Client Portal & Visibility Governance</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              Live Configuration
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Control exactly what modules, sprints, requirements, and deliverables are shared with your client.
          </p>
        </div>

        {/* Project Switcher + Live Preview Button */}
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          <Link
            href="/client"
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-100"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Open Client Portal View</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Link>
        </div>
      </div>

      {/* ── Visibility Controls Component ── */}
      <ClientVisibilityControls
        projectId={selectedProjectId}
        projectName={selectedProject.title}
        onPreviewClientView={() => setShowPreviewModal(true)}
      />

      {/* ── Live Interactive Preview Modal ── */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-zinc-200 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-zinc-200">
                  Client View Simulator — Previewing as Client: Sarah Jenkins (Acme FinTech)
                </span>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-xs font-bold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              >
                Close Preview
              </button>
            </div>

            {/* Embedded Preview Frame */}
            <div className="flex-1 bg-zinc-100 p-2 overflow-hidden">
              <iframe
                src="/client"
                className="w-full h-full rounded-2xl border border-zinc-200 bg-white"
                title="Client Portal Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClientPortalManagerPage() {
  return (
    <ClientPortalProvider>
      <ClientPortalManagerContent />
    </ClientPortalProvider>
  );
}
