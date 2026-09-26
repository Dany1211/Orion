"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Shield,
  Layers,
  FileSearch,
  FolderGit2,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  Video,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Save,
  UserCheck,
  Lock,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { ClientPortalConfig } from "@/lib/supabase/client-portal-types";

interface ClientVisibilityControlsProps {
  projectId: string;
  projectName?: string;
  onPreviewClientView?: () => void;
}

export function ClientVisibilityControls({
  projectId,
  projectName = "Active Project",
  onPreviewClientView,
}: ClientVisibilityControlsProps) {
  const { getPortalConfig, updatePortalConfig } = useClientPortal();
  const config = getPortalConfig(projectId);

  const [formState, setFormState] = React.useState<ClientPortalConfig>(config);
  const [isSaved, setIsSaved] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Sync state when config changes
  React.useEffect(() => {
    setFormState(getPortalConfig(projectId));
  }, [projectId]);

  const handleToggle = (key: keyof ClientPortalConfig) => {
    setFormState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    await updatePortalConfig(projectId, formState);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const copyClientPortalLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const portalUrl = `${origin}/client`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const visibilityToggles = [
    {
      key: "show_overview" as keyof ClientPortalConfig,
      label: "Project Health & Executive Overview",
      description: "Display velocity score, completion percentage ring, and target delivery dates.",
      icon: Layers,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
    {
      key: "show_requirements" as keyof ClientPortalConfig,
      label: "SRS Requirements & Scope Specifications",
      description: "Allow client to inspect confirmed functional and non-functional requirements.",
      icon: FileSearch,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      key: "show_sprints" as keyof ClientPortalConfig,
      label: "Sprint Milestones & Roadmap Timeline",
      description: "Show sprint progress, active sprint tasks, and delivery milestones.",
      icon: Layers,
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      key: "show_github" as keyof ClientPortalConfig,
      label: "GitHub Release Velocity & Deployments",
      description: "Share build status, live staging URL, and sanitized commit milestones.",
      icon: FolderGit2,
      color: "text-zinc-800 bg-zinc-100 border-zinc-200",
    },
    {
      key: "show_risks" as keyof ClientPortalConfig,
      label: "AI Risk Matrix & Technical Bottlenecks",
      description: "Reveal AI-detected architectural risks and mitigation action plans (Optional).",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      key: "show_reports" as keyof ClientPortalConfig,
      label: "Project Deliverables & PDF Reports",
      description: "Give client access to downloadable SRS summaries, architecture specs, and audits.",
      icon: FileSpreadsheet,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      key: "show_budget" as keyof ClientPortalConfig,
      label: "Scope Breakdown & Milestone Invoices",
      description: "Show approved milestone budget allocations and payment statuses.",
      icon: DollarSign,
      color: "text-cyan-600 bg-cyan-50 border-cyan-100",
    },
    {
      key: "show_meetings" as keyof ClientPortalConfig,
      label: "In-Website Video Meetings Suite",
      description: "Enable client to join scheduled or instant video syncs with the Project Manager.",
      icon: Video,
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
    {
      key: "allow_approvals" as keyof ClientPortalConfig,
      label: "Client Sign-off & Milestone Approval Gate",
      description: "Enable client 1-click 'Approve Milestone' and 'Request Revision' capability.",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      key: "allow_direct_chat" as keyof ClientPortalConfig,
      label: "Direct PM-Client Messaging Center",
      description: "Provide a real-time messaging hub between client and project lead.",
      icon: MessageSquare,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Top Header / Quick Action Bar ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-black text-zinc-900">Client Portal Visibility & Permissions</h2>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Choose exactly what information, modules, and collaborative tools are visible to the client for <span className="font-semibold text-zinc-800">{projectName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={copyClientPortalLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-colors shadow-sm"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Portal Link"}</span>
          </button>

          {onPreviewClientView && (
            <button
              onClick={onPreviewClientView}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-100"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Preview Client View</span>
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-md shadow-indigo-600/20"
          >
            {isSaved ? <Check className="h-3.5 w-3.5 text-white" /> : <Save className="h-3.5 w-3.5" />}
            <span>{isSaved ? "Saved Changes!" : "Apply Visibility"}</span>
          </button>
        </div>
      </div>

      {/* ── Client Profile & Welcome Message ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Access Info */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <UserCheck className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-zinc-900">Client Access Profile</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-700">Client Contact Name</label>
              <input
                type="text"
                value={formState.client_name}
                onChange={(e) => setFormState({ ...formState, client_name: e.target.value })}
                className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Sarah Jenkins"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700">Client Organization</label>
              <input
                type="text"
                value={formState.client_company}
                onChange={(e) => setFormState({ ...formState, client_company: e.target.value })}
                className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                placeholder="e.g. Acme FinTech Global"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700">Client Email</label>
              <input
                type="email"
                value={formState.client_email}
                onChange={(e) => setFormState({ ...formState, client_email: e.target.value })}
                className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                placeholder="client@company.com"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700">Portal Access Passcode</label>
              <input
                type="text"
                value={formState.access_passcode || ""}
                onChange={(e) => setFormState({ ...formState, access_passcode: e.target.value })}
                className="mt-1 w-full text-xs font-mono rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                placeholder="ORION-2026-KEY"
              />
            </div>
          </div>
        </div>

        {/* Welcome Greeting Settings */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-zinc-900">Portal Greeting & Headline</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-zinc-700">Welcome Banner Heading</label>
              <input
                type="text"
                value={formState.welcome_heading}
                onChange={(e) => setFormState({ ...formState, welcome_heading: e.target.value })}
                className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-indigo-500"
                placeholder="Welcome to your Project Delivery Portal"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700">Executive Summary & Instructions for Client</label>
              <textarea
                value={formState.welcome_message}
                onChange={(e) => setFormState({ ...formState, welcome_message: e.target.value })}
                rows={3}
                className="mt-1 w-full text-xs rounded-xl border border-zinc-200 p-3 text-zinc-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                placeholder="Write customized guidance for the client on reviewing milestones and deliverables…"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700">Live Staging / Production App URL</label>
              <input
                type="text"
                value={formState.live_preview_url || ""}
                onChange={(e) => setFormState({ ...formState, live_preview_url: e.target.value })}
                className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500 font-mono"
                placeholder="https://staging.yourproject.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Granular Module Visibility Switches ("Choose what to show him") ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Module Visibility Switches</h3>
            <p className="text-xs text-zinc-500 font-medium">
              Toggle ON/OFF specific sections. Disabled modules are completely hidden from the client view.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {Object.values(formState).filter((v) => v === true).length} Modules Enabled
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
          {visibilityToggles.map((item) => {
            const isEnabled = !!formState[item.key];
            const Icon = item.icon;

            return (
              <div
                key={item.key}
                onClick={() => handleToggle(item.key)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isEnabled
                    ? "bg-white border-indigo-200 shadow-sm hover:border-indigo-300"
                    : "bg-zinc-50/60 border-zinc-200/80 opacity-70 hover:opacity-100"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg border flex-shrink-0 ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-zinc-900">{item.label}</p>
                      {isEnabled ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Visible
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 font-medium mt-0.5 leading-normal">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Switch Toggle */}
                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors flex-shrink-0 ${
                    isEnabled ? "bg-indigo-600" : "bg-zinc-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
