"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Layers,
  FileSearch,
  FolderGit2,
  AlertTriangle,
  FileSpreadsheet,
  Video,
  MessageSquare,
  CheckCircle2,
  Sparkles,
  Copy,
  Check,
  Save,
  UserCheck,
  UserPlus,
  SlidersHorizontal,
  Mail,
  KeyRound,
  Building,
  Trash2,
  Users,
  Database,
  ArrowRight,
  PhoneCall,
  Circle,
  Calendar,
  Clock,
  ShieldCheck,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
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
  const router = useRouter();
  const {
    getPortalConfig,
    updatePortalConfig,
    clientsDirectory,
    projectClients,
    assignClientToProject,
    removeClientFromProject,
    deleteClient,
    scheduleMeeting,
    sendMessage,
  } = useClientPortal();

  // Navigation tab inside Client Management
  const [activeTab, setActiveTab] = React.useState<"clients" | "visibility" | "meetings">("clients");

  const config = getPortalConfig(projectId);
  const [formState, setFormState] = React.useState<ClientPortalConfig>(config);
  const [isSaved, setIsSaved] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedClientId, setCopiedClientId] = React.useState<string | null>(null);

  // Add Client Modal State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addMode, setAddMode] = React.useState<"select_existing" | "create_new">("select_existing");
  const [selectedClientId, setSelectedClientId] = React.useState("");
  const [newClientName, setNewClientName] = React.useState("");
  const [newClientEmail, setNewClientEmail] = React.useState("");
  const [newClientCompany, setNewClientCompany] = React.useState("");
  const [newClientPasscode, setNewClientPasscode] = React.useState("");
  const [actionSuccess, setActionSuccess] = React.useState(false);
  const [showDirectory, setShowDirectory] = React.useState(false);

  // Project-specific clients
  const currentProjectClients = projectClients.filter((c) => c.project_id === projectId);

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
    setTimeout(() => setIsSaved(false), 2500);
  };

  const copyClientPortalLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const portalUrl = `${origin}/client/login`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const copyClientCredentials = (client: { client_name: string; client_email: string; client_company?: string; passcode: string }) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = `Orion Client Portal Access:\nProject: ${projectName}\nLogin URL: ${origin}/client/login\nEmail: ${client.client_email}\nPasscode: ${client.passcode}`;
    navigator.clipboard.writeText(text);
    setCopiedClientId(client.client_email);
    setTimeout(() => setCopiedClientId(null), 2500);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (addMode === "select_existing") {
      const foundClient = clientsDirectory.find((c) => c.id === selectedClientId);
      if (!foundClient) return;

      await assignClientToProject(projectId, {
        clientId: foundClient.id,
        name: foundClient.name,
        email: foundClient.email,
        company: foundClient.company,
        passcode: newClientPasscode || foundClient.passcode || "ORION-PASS-2026",
      });
    } else {
      if (!newClientName || !newClientEmail || !newClientPasscode) return;

      await assignClientToProject(projectId, {
        name: newClientName,
        email: newClientEmail,
        company: newClientCompany || formState.client_company,
        passcode: newClientPasscode,
      });
    }

    setActionSuccess(true);
    setTimeout(() => {
      setActionSuccess(false);
      setShowAddModal(false);
      setSelectedClientId("");
      setNewClientName("");
      setNewClientEmail("");
      setNewClientPasscode("");
    }, 1000);
  };

  const handleStartInstantLiveMeeting = async () => {
    const clientName = currentProjectClients[0]?.client_name || "Client Lead";
    const roomId = `orion-sync-${Math.random().toString(36).substr(2, 6)}`;

    await scheduleMeeting({
      project_id: projectId,
      project_name: projectName,
      title: `Live Video Sync: ${projectName}`,
      room_id: roomId,
      scheduled_at: new Date().toISOString(),
      duration_minutes: 30,
      status: "live",
      host_name: "Project Manager",
      client_attendee: clientName,
      agenda: "Real-time project alignment & milestone walkthrough.",
      meeting_url: `/meetings/${roomId}?role=client`,
    });

    await sendMessage({
      project_id: projectId,
      sender_role: "pm",
      sender_name: "Project Manager",
      content: `🔔 I have started a Live Video Sync for ${projectName}. Click below to enter the video room!`,
      topic: "Meeting Follow-up",
      read_by_recipient: false,
    });

    router.push(`/meetings/${roomId}?role=pm`);
  };

  const visibilityCategories = [
    {
      category: "📋 Core Scope & Milestones",
      description: "Controls client visibility into requirements and sprints.",
      items: [
        {
          key: "show_overview" as keyof ClientPortalConfig,
          label: "Project Overview & Health",
          description: "Display progress percentage, velocity score, and launch timeline.",
          icon: Layers,
          color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        },
        {
          key: "show_requirements" as keyof ClientPortalConfig,
          label: "SRS Scope & Specifications",
          description: "Show verified functional and non-functional requirements to the client.",
          icon: FileSearch,
          color: "text-blue-600 bg-blue-50 border-blue-100",
        },
        {
          key: "show_sprints" as keyof ClientPortalConfig,
          label: "Sprint Milestones & Roadmap",
          description: "Display sprint completion progress, active sprint deliverables, and targets.",
          icon: Layers,
          color: "text-violet-600 bg-violet-50 border-violet-100",
        },
      ],
    },
    {
      category: "🚀 Engineering & Live Apps",
      description: "Allow client to test working staging previews and view risk mitigation.",
      items: [
        {
          key: "show_github" as keyof ClientPortalConfig,
          label: "Live Staging App & Release Velocity",
          description: "Provide direct staging link and release deployment status.",
          icon: FolderGit2,
          color: "text-zinc-800 bg-zinc-100 border-zinc-200",
        },
        {
          key: "show_risks" as keyof ClientPortalConfig,
          label: "AI Risk Matrix & Bottlenecks",
          description: "Allow client to inspect AI-detected risk mitigation items.",
          icon: AlertTriangle,
          color: "text-amber-600 bg-amber-50 border-amber-100",
        },
      ],
    },
    {
      category: "🤝 Collaboration & Sign-offs",
      description: "Interactive tools for client approvals, video syncs, and chat.",
      items: [
        {
          key: "allow_approvals" as keyof ClientPortalConfig,
          label: "Milestone Sign-offs & Approvals",
          description: "Allow client to 1-click approve deliverables or request revisions.",
          icon: CheckCircle2,
          color: "text-emerald-600 bg-emerald-50 border-emerald-100",
        },
        {
          key: "show_reports" as keyof ClientPortalConfig,
          label: "Deliverables & PDF Reports",
          description: "Give client access to downloadable specification PDFs and audits.",
          icon: FileSpreadsheet,
          color: "text-emerald-600 bg-emerald-50 border-emerald-100",
        },
        {
          key: "allow_direct_chat" as keyof ClientPortalConfig,
          label: "Direct PM-Client Messaging",
          description: "Enable real-time messaging hub between client and project lead.",
          icon: MessageSquare,
          color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        },
        {
          key: "show_meetings" as keyof ClientPortalConfig,
          label: "In-Website Video Meetings Suite",
          description: "Enable client to join in-browser video syncs with the Project Manager.",
          icon: Video,
          color: "text-rose-600 bg-rose-50 border-rose-100",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Sub-Navigation Tabs ── */}
      <div className="bg-white rounded-2xl p-2 border border-zinc-100 shadow-sm flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("clients")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "clients"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-indigo-600" />
            <span>Client Management & Access ({currentProjectClients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("visibility")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "visibility"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-600" />
            <span>Visibility & Governance</span>
          </button>

          <button
            onClick={() => setActiveTab("meetings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "meetings"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Video className="h-3.5 w-3.5 text-rose-600" />
            <span>Live Video Sync</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-2">
          {activeTab === "clients" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Add / Link Client</span>
            </button>
          )}

          <button
            onClick={copyClientPortalLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 shadow-sm transition-colors"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
            <span>{copiedLink ? "Link Copied!" : "Portal Login URL"}</span>
          </button>

          {activeTab === "visibility" && (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isSaved ? "Saved!" : "Save Changes"}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── TAB 1: CLIENT MANAGEMENT & ACCESS ── */}
      {activeTab === "clients" && (
        <div className="space-y-6">
          {/* Assigned Clients for this Project */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-indigo-600" />
                  <span>Clients Assigned to {projectName}</span>
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">
                  These clients can authenticate to the client portal and inspect this project&apos;s deliverables.
                </p>
              </div>

              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {currentProjectClients.length} Assigned
              </span>
            </div>

            {currentProjectClients.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 space-y-3">
                <div className="h-12 w-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-800">No Clients Assigned Yet</h4>
                  <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                    Assign a client from your organization&apos;s directory or register a new client with credentials to give them portal access.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Assign Client to Project</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentProjectClients.map((client) => (
                  <div
                    key={client.id}
                    className="p-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 transition-all space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                            {client.client_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-zinc-900">{client.client_name}</h4>
                            <p className="text-xs text-zinc-500">{client.client_company || "Client Organization"}</p>
                          </div>
                        </div>

                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Active Access
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white border border-zinc-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email (Login ID):
                          </span>
                          <strong className="text-zinc-800">{client.client_email}</strong>
                        </div>

                        <div className="flex items-center justify-between text-zinc-600">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <KeyRound className="h-3 w-3" /> Passcode:
                          </span>
                          <span className="font-mono bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold">
                            {client.passcode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-200/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => copyClientCredentials(client)}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        {copiedClientId === client.client_email ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Credentials Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Copy Login Details</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => removeClientFromProject(projectId, client.client_email)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                        title="Unlink client from this project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Collapsible Organization Master Client Directory */}
          <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <div
              onClick={() => setShowDirectory(!showDirectory)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-zinc-500" />
                <h4 className="text-sm font-bold text-zinc-900">
                  Organization Master Client Directory ({clientsDirectory.length})
                </h4>
              </div>
              <button className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                <span>{showDirectory ? "Hide Directory" : "View All Registered Clients"}</span>
                {showDirectory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {showDirectory && (
              <div className="pt-2 space-y-3">
                {clientsDirectory.length === 0 ? (
                  <p className="text-xs text-zinc-500">No master clients created yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {clientsDirectory.map((client) => {
                      const isAssigned = currentProjectClients.some(
                        (c) => c.client_email === client.email.toLowerCase().trim()
                      );

                      return (
                        <div
                          key={client.id}
                          className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-zinc-900">{client.name}</span>
                              {isAssigned ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                  Assigned
                                </span>
                              ) : (
                                <button
                                  onClick={() =>
                                    assignClientToProject(projectId, {
                                      clientId: client.id,
                                      name: client.name,
                                      email: client.email,
                                      company: client.company,
                                      passcode: client.passcode || "123456",
                                    })
                                  }
                                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded"
                                >
                                  + Assign to Project
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-500 mt-0.5">{client.email}</p>
                            <p className="text-[10px] text-zinc-400">{client.company || "No Company"}</p>
                          </div>

                          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500">Pass: {client.passcode}</span>
                            <button
                              onClick={() => deleteClient(client.id, client.email)}
                              className="text-zinc-400 hover:text-red-600 text-[10px]"
                              title="Delete from master directory"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: VISIBILITY & CLIENT GOVERNANCE ── */}
      {activeTab === "visibility" && (
        <div className="space-y-6">
          {/* Welcome Message Configuration Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Client Portal Branding & Instructions</h3>
                <p className="text-xs text-zinc-500 font-medium">
                  Custom greetings, welcome banner, and live staging URLs displayed to your client.
                </p>
              </div>

              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-sm"
              >
                {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Save className="h-3.5 w-3.5" />}
                <span>{isSaved ? "Saved!" : "Save Changes"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-700">Portal Welcome Heading</label>
                <input
                  type="text"
                  value={formState.welcome_heading}
                  onChange={(e) => setFormState({ ...formState, welcome_heading: e.target.value })}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-indigo-500"
                  placeholder="Welcome to your Project Delivery Portal"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Live Staging / Preview URL</label>
                <input
                  type="text"
                  value={formState.live_preview_url || ""}
                  onChange={(e) => setFormState({ ...formState, live_preview_url: e.target.value })}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="https://staging.yourproject.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-zinc-700">Welcome Message & Instructions for Client</label>
                <textarea
                  value={formState.welcome_message}
                  onChange={(e) => setFormState({ ...formState, welcome_message: e.target.value })}
                  rows={2}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 p-2.5 text-zinc-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  placeholder="Instructions for your client on inspecting milestones and approvals…"
                />
              </div>
            </div>
          </div>

          {/* Grouped Visibility Toggles */}
          <div className="space-y-5">
            {visibilityCategories.map((cat, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm space-y-4">
                <div className="border-b border-zinc-100 pb-2">
                  <h4 className="text-sm font-bold text-zinc-900">{cat.category}</h4>
                  <p className="text-xs text-zinc-500">{cat.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                  {cat.items.map((item) => {
                    const isEnabled = !!formState[item.key];
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggle(item.key)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isEnabled
                            ? "bg-white border-indigo-200 shadow-sm hover:border-indigo-300"
                            : "bg-zinc-50/60 border-zinc-200/80 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl border flex-shrink-0 ${item.color}`}>
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
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: LIVE VIDEO SYNC LAUNCHER ── */}
      {activeTab === "meetings" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 rounded-3xl p-8 text-white border border-zinc-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <Video className="h-4 w-4" />
                </span>
                <h3 className="text-lg font-bold text-white">Live In-Website Video Sync with Client</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Launch an encrypted in-browser WebRTC call. Starting a meeting immediately pushes a real-time banner and audio notification to your client&apos;s portal.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={handleStartInstantLiveMeeting}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30"
              >
                <PhoneCall className="h-4 w-4" />
                <span>Start Live Call Now</span>
              </button>

              <Link
                href="/dashboard/meetings"
                className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span>Open Full Meetings Suite →</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Link Client Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-zinc-900">Add Client to {projectName}</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 font-bold"
              >
                Cancel
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-zinc-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAddMode("select_existing")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === "select_existing"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Select from Database</span>
              </button>
              <button
                type="button"
                onClick={() => setAddMode("create_new")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  addMode === "create_new"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Create New Client</span>
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-3.5 pt-1">
              {addMode === "select_existing" ? (
                clientsDirectory.length === 0 ? (
                  <div className="p-4 text-center bg-zinc-50 rounded-xl text-xs text-zinc-500">
                    No clients in database directory yet. Switch to &quot;Create New Client&quot; to register your first client.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-zinc-700">Select Client from Database</label>
                      <select
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        required
                        className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2.5 text-zinc-900 bg-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose a registered client --</option>
                        {clientsDirectory.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.email}) - {c.company || "No company"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-700">Access Passcode for this Project</label>
                      <input
                        type="text"
                        value={newClientPasscode}
                        onChange={(e) => setNewClientPasscode(e.target.value)}
                        placeholder="Leave blank to use client's default passcode"
                        className="mt-1 w-full text-xs font-mono rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </>
                )
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-zinc-700">Client Full Name</label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700">Client Email (Login Username)</label>
                    <input
                      type="email"
                      required
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="client@company.com"
                      className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700">Client Organization / Company</label>
                    <input
                      type="text"
                      value={newClientCompany}
                      onChange={(e) => setNewClientCompany(e.target.value)}
                      placeholder="e.g. Acme FinTech Global"
                      className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700">Access Passcode / Password</label>
                    <input
                      type="text"
                      required
                      value={newClientPasscode}
                      onChange={(e) => setNewClientPasscode(e.target.value)}
                      placeholder="e.g. ORION-2026-KEY"
                      className="mt-1 w-full text-xs font-mono rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={addMode === "select_existing" && !selectedClientId}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  {actionSuccess ? "Assigned Successfully!" : "Assign to Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
