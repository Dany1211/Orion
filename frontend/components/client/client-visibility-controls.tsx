"use client";

import * as React from "react";
import {
  Eye,
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
  const {
    getPortalConfig,
    updatePortalConfig,
    clientsDirectory,
    projectClients,
    assignClientToProject,
    removeClientFromProject,
  } = useClientPortal();

  const config = getPortalConfig(projectId);

  const [formState, setFormState] = React.useState<ClientPortalConfig>(config);
  const [isSaved, setIsSaved] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Modal State
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [addMode, setAddMode] = React.useState<"select_existing" | "create_new">("select_existing");
  const [selectedClientId, setSelectedClientId] = React.useState("");
  const [newClientName, setNewClientName] = React.useState("");
  const [newClientEmail, setNewClientEmail] = React.useState("");
  const [newClientCompany, setNewClientCompany] = React.useState("");
  const [newClientPasscode, setNewClientPasscode] = React.useState("");
  const [actionSuccess, setActionSuccess] = React.useState(false);

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
    }, 1200);
  };

  const visibilityToggles = [
    {
      key: "show_overview" as keyof ClientPortalConfig,
      label: "Project Health & Executive Overview",
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
    {
      key: "show_github" as keyof ClientPortalConfig,
      label: "Live Staging App & Release Velocity",
      description: "Provide direct staging link and release deployment status.",
      icon: FolderGit2,
      color: "text-zinc-800 bg-zinc-100 border-zinc-200",
    },
    {
      key: "show_reports" as keyof ClientPortalConfig,
      label: "Deliverables & PDF Reports",
      description: "Give client access to downloadable specification PDFs and audits.",
      icon: FileSpreadsheet,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      key: "show_risks" as keyof ClientPortalConfig,
      label: "AI Risk Matrix & Bottlenecks",
      description: "Allow client to inspect AI-detected risk mitigation items (Optional).",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      key: "show_meetings" as keyof ClientPortalConfig,
      label: "In-Website Video Meetings Suite",
      description: "Enable client to join in-browser video syncs with the Project Manager.",
      icon: Video,
      color: "text-rose-600 bg-rose-50 border-rose-100",
    },
    {
      key: "allow_approvals" as keyof ClientPortalConfig,
      label: "Milestone Sign-offs & Approvals",
      description: "Allow client to 1-click approve deliverables or request revisions.",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
    {
      key: "allow_direct_chat" as keyof ClientPortalConfig,
      label: "Direct PM-Client Messaging",
      description: "Enable real-time messaging hub between client and project lead.",
      icon: MessageSquare,
      color: "text-indigo-600 bg-indigo-50 border-indigo-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-black text-zinc-900">Client Management & Project Governance</h2>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Assign database clients to <span className="font-semibold text-zinc-800">{projectName}</span> and configure visible modules in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm shadow-indigo-600/20"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Add / Link Client to Project</span>
          </button>

          <button
            onClick={copyClientPortalLink}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-colors shadow-sm"
          >
            {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Portal Login Link"}</span>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-colors shadow-sm"
          >
            {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Save className="h-3.5 w-3.5" />}
            <span>{isSaved ? "Saved!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* ── Assigned Clients Section ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-zinc-900">Clients Assigned to {projectName}</h3>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
            {currentProjectClients.length} Assigned Client{currentProjectClients.length === 1 ? "" : "s"}
          </span>
        </div>

        {currentProjectClients.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-50 border border-dashed border-zinc-200 space-y-3">
            <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-800">No clients linked to this project yet</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Click &quot;Add / Link Client to Project&quot; to pick an existing client from your database or register a new client.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Assign Client Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {currentProjectClients.map((client) => (
              <div
                key={client.id}
                className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900">{client.client_name}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-zinc-400" /> {client.client_email}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Company: <strong className="text-zinc-700">{client.client_company || "N/A"}</strong> • Passcode:{" "}
                    <span className="font-mono bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-800 text-[10px]">
                      {client.passcode}
                    </span>
                  </p>
                </div>

                <button
                  onClick={() => removeClientFromProject(projectId, client.client_email)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Unassign client from this project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Welcome Heading & Live Staging URL ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-zinc-900">Portal Greeting & Staging Preview</h3>
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

      {/* ── Granular Module Visibility Switches ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Client Module Visibility</h3>
            <p className="text-xs text-zinc-500 font-medium">
              Choose what sections are visible to clients of this project.
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

      {/* ── Add / Link Client Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-indigo-600" />
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

            <form onSubmit={handleAssignSubmit} className="space-y-3 pt-1">
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
                        className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 bg-white focus:outline-none focus:border-indigo-500"
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
