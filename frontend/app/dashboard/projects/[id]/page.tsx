"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Sparkles, BrainCircuit, Calendar, FileText,
  AlertTriangle, ShieldAlert, CheckCircle2, Loader2, Users,
  Plus, ChevronRight, X, UploadCloud, FileClock,
  UserPlus, Check, Trash2, FolderGit2, ArrowLeft
} from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";
import { ProjectChat } from "@/components/dashboard/project-chat";
import { GithubTracker } from "@/components/dashboard/github-tracker";
import { ClientVisibilityControls } from "@/components/client/client-visibility-controls";
import { ClientPortalProvider } from "@/lib/contexts/client-portal-context";
import { cn } from "@/lib/utils";

type TabType = "documents" | "requirements" | "sprints" | "risks" | "github" | "client";

async function extractTextViaServer(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/extract-text", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Text extraction failed");
  }
  const data = await res.json();
  return data.text || "";
}

interface DocumentSource {
  id: string;
  title: string;
  source_type: string;
  status: "pending" | "processing" | "processed" | "failed";
  created_at: string;
  version: string;
  uploaded_by_email: string;
  file_size: string;
}

interface AssignedTeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
  status: "active" | "idle" | "offline";
  last_active: string;
}

interface OrgMember {
  user_id: string;
  role: string;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "documents",    label: "Documents",    icon: FileText },
  { id: "requirements", label: "Requirements", icon: Sparkles },
  { id: "sprints",      label: "Sprints",      icon: Calendar },
  { id: "risks",        label: "Risks",        icon: ShieldAlert },
  { id: "github",       label: "GitHub",       icon: FolderGit2 },
  { id: "client",       label: "Client",       icon: Users },
];

const priorityStyles: Record<string, { pill: string; dot: string }> = {
  critical: { pill: "bg-red-50 text-red-700 border-red-200",    dot: "bg-red-500" },
  high:     { pill: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  medium:   { pill: "bg-amber-50 text-amber-700 border-amber-200",    dot: "bg-amber-400" },
  low:      { pill: "bg-zinc-50 text-zinc-600 border-zinc-200",       dot: "bg-zinc-400" },
};

const taskStatusStyles: Record<string, string> = {
  todo:        "bg-zinc-100 text-zinc-600",
  in_progress: "bg-amber-100 text-amber-700",
  done:        "bg-emerald-100 text-emerald-700",
  blocked:     "bg-red-100 text-red-700",
};

export default function ProjectDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, organization, projects, refreshProjects } = useWorkspace();
  const [activeTab, setActiveTab] = React.useState<TabType>("documents");

  const [project, setProject] = React.useState<any>(null);
  const [intelligence, setIntelligence] = React.useState<any>(null);
  const [requirements, setRequirements] = React.useState<any[]>([]);
  const [sprints, setSprints] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [risks, setRisks] = React.useState<any[]>([]);
  const [sources, setSources] = React.useState<DocumentSource[]>([]);

  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [newTaskTitles, setNewTaskTitles] = React.useState<Record<string, string>>({});
  const [pasteTitle, setPasteTitle] = React.useState("");
  const [pasteContent, setPasteContent] = React.useState("");
  const [showPasteForm, setShowPasteForm] = React.useState(false);
  const [isSubmittingPaste, setIsSubmittingPaste] = React.useState(false);
  const [uploadingFileName, setUploadingFileName] = React.useState<string | null>(null);

  const [assignedTeam, setAssignedTeam] = React.useState<AssignedTeamMember[]>([]);
  const [orgMembers, setOrgMembers] = React.useState<OrgMember[]>([]);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = React.useState("");

  const [editStatus, setEditStatus] = React.useState("draft");
  const [editVelocity, setEditVelocity] = React.useState(30);
  const [editLaunchDate, setEditLaunchDate] = React.useState("2026-12-31");
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  const [loading, setLoading] = React.useState(true);
  const [isRunningAgent, setIsRunningAgent] = React.useState(false);
  const [agentProgress, setAgentProgress] = React.useState(0);
  const [agentFinished, setAgentFinished] = React.useState(false);

  const [selectedReq, setSelectedReq] = React.useState<any>(null);
  const [selectedRisk, setSelectedRisk] = React.useState<any>(null);

  const loadProjectData = async () => {
    setLoading(true);
    const supabase = createClient() as any;

    const { data: projData, error: projError } = await supabase.from("projects").select("*").eq("id", id).single();
    if (projError || !projData) { setLoading(false); return; }
    setProject(projData);
    setEditStatus(projData.status);
    setEditVelocity(projData.metadata?.target_velocity || 30);
    setEditLaunchDate(projData.metadata?.target_launch_date || "2026-12-31");

    const [
      { data: intelData },
      { data: reqsData },
      { data: sprintsData },
      { data: tasksData },
      { data: risksData },
      { data: sourcesData },
    ] = await Promise.all([
      supabase.from("project_intelligence").select("*").eq("project_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("requirements").select("*").eq("project_id", id),
      supabase.from("sprints").select("*").eq("project_id", id).order("sprint_number", { ascending: true }),
      supabase.from("tasks").select("*").eq("project_id", id),
      supabase.from("risks").select("*").eq("project_id", id),
      supabase.from("requirement_sources").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    ]);

    setIntelligence(intelData);
    setRequirements(reqsData || []);
    setSprints(sprintsData || []);
    setTasks(tasksData || []);
    setRisks(risksData || []);
    setSources((sourcesData || []).map((s: any, idx: number) => ({
      id: s.id,
      title: s.title,
      source_type: s.source_type,
      status: s.status as any || "processed",
      created_at: new Date(s.created_at).toLocaleDateString(),
      version: `v1.${(sourcesData || []).length - idx}`,
      uploaded_by_email: user?.email || "owner",
      file_size: s.file_size_bytes ? `${(s.file_size_bytes / 1024).toFixed(1)} KB` : "—",
    })));

    if (organization?.id) {
      const { data: membersData } = await supabase
        .from("organization_members")
        .select("user_id, role, profile:profiles(id, email, full_name, avatar_url)")
        .eq("organization_id", organization.id);

      if (membersData) {
        setOrgMembers(membersData as OrgMember[]);
        setAssignedTeam(membersData.map((m: any) => ({
          id: m.user_id,
          email: m.profile?.email || "",
          name: m.profile?.full_name || m.profile?.email?.split("@")[0] || "Member",
          role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
          status: m.user_id === user?.id ? "active" : "idle",
          last_active: m.user_id === user?.id ? "Active now" : "Recently",
        })));
      }
    }

    setLoading(false);
  };

  React.useEffect(() => { if (id) loadProjectData(); }, [id]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) await uploadDocumentFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) await uploadDocumentFile(e.target.files[0]);
  };

  const uploadDocumentFile = async (file: File) => {
    setIsUploading(true);
    setUploadingFileName(file.name);
    let rawText = "";
    try {
      rawText = await extractTextViaServer(file);
    } catch {
      try { rawText = file.type === "text/plain" ? await file.text() : `[${file.name}]`; }
      catch { rawText = `[Binary: ${file.name}]`; }
    }
    const supabase = createClient() as any;
    const { error } = await supabase.from("requirement_sources").insert({
      project_id: id, uploaded_by: user?.id,
      source_type: file.name.toLowerCase().endsWith(".pdf") ? "srs_document" : "meeting_transcript",
      title: file.name, file_name: file.name, file_size_bytes: file.size,
      mime_type: file.type || "text/plain", raw_text: rawText || `Document: ${file.name}`, status: "processed",
    });
    setIsUploading(false);
    setUploadingFileName(null);
    if (!error) {
      setUploadSuccess(file.name);
      setTimeout(() => setUploadSuccess(null), 4000);
      loadProjectData();
    }
  };

  const runIntelligenceAgent = async () => {
    if (sources.length === 0) { alert("Upload at least one document first."); return; }
    setIsRunningAgent(true);
    setAgentFinished(false);
    setAgentProgress(0);
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const apiPromise = fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: id }) });
    await delay(800); setAgentProgress(1);
    await delay(1000); setAgentProgress(2);
    await delay(1000); setAgentProgress(3);
    try {
      const response = await apiPromise;
      if (!response.ok) { const e = await response.json().catch(() => ({})); throw new Error(e.error || "Analysis failed"); }
      setAgentProgress(4);
      await delay(500);
      setIsRunningAgent(false);
      setAgentFinished(true);
      loadProjectData();
    } catch (err: any) {
      alert(err.message || "Analysis failed.");
      setIsRunningAgent(false);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm("Delete this document?")) return;
    const supabase = createClient() as any;
    const { error } = await supabase.from("requirement_sources").delete().eq("id", sourceId);
    if (!error) loadProjectData();
  };

  const handleDeleteProject = async () => {
    if (!window.confirm("Permanently delete this project and all its data?")) return;
    const supabase = createClient() as any;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) { await refreshProjects(); router.push("/dashboard"); }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const supabase = createClient() as any;
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    if (!error) setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTask = async (taskId: string) => {
    const supabase = createClient() as any;
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (!error) setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleCreateTask = async (sprintId: string, title: string) => {
    if (!title.trim()) return;
    const supabase = createClient() as any;
    const { data: newTask, error } = await supabase.from("tasks").insert({
      project_id: id, sprint_id: sprintId, created_by: user?.id,
      title: title.trim(), status: "todo", priority: "medium", story_points: 3, estimated_hours: 6,
    }).select().single();
    if (!error && newTask) setTasks(prev => [...prev, newTask]);
  };

  const handleSavePasteSpec = async () => {
    if (!pasteTitle.trim() || !pasteContent.trim()) return;
    setIsSubmittingPaste(true);
    const supabase = createClient() as any;
    const { error } = await supabase.from("requirement_sources").insert({
      project_id: id, uploaded_by: user?.id, source_type: "meeting_transcript",
      title: pasteTitle.trim(), file_name: pasteTitle.trim().toLowerCase().replace(/\s+/g, "_") + ".txt",
      file_size_bytes: pasteContent.length, mime_type: "text/plain", raw_text: pasteContent.trim(), status: "processed",
    });
    setIsSubmittingPaste(false);
    if (!error) {
      setPasteTitle(""); setPasteContent(""); setShowPasteForm(false);
      setUploadSuccess(pasteTitle.trim()); setTimeout(() => setUploadSuccess(null), 3000);
      loadProjectData();
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const supabase = createClient() as any;
    await supabase.from("projects").update({
      status: editStatus,
      metadata: { ...project.metadata, target_velocity: editVelocity, target_launch_date: editLaunchDate },
    }).eq("id", id);
    setIsSavingSettings(false);
    loadProjectData();
    await refreshProjects();
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        <p className="text-sm text-zinc-400">Loading project…</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-800">Project not found</p>
          <button onClick={() => router.push("/dashboard")} className="mt-3 text-sm text-indigo-600 hover:underline">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabBadges: Partial<Record<TabType, number | string>> = {
    documents: sources.length || undefined,
    requirements: requirements.length || undefined,
    sprints: sprints.length || undefined,
    risks: risks.length || undefined,
  };

  return (
    <div className="min-h-full bg-zinc-50/50">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100 px-6 sm:px-8 py-5">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/projects")}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-700 transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Projects
          </button>

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl bg-gradient-to-tr ${project.color || "from-indigo-500 to-violet-600"} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-semibold text-zinc-900 tracking-tight">{project.name}</h1>
                  <span className="text-[11px] font-medium px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded-full capitalize">
                    {project.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-0.5 line-clamp-1 max-w-xl">
                  {project.description || "No description provided."}
                </p>
              </div>
            </div>

            <button
              onClick={runIntelligenceAgent}
              disabled={isRunningAgent}
              className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 flex-shrink-0"
            >
              <BrainCircuit className="h-4 w-4" />
              Analyze
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mt-6 overflow-x-auto">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const badge = tabBadges[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap",
                    active
                      ? "bg-zinc-100 text-zinc-900 font-semibold"
                      : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50"
                  )}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                  {badge !== undefined && Number(badge) > 0 && (
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                      active ? "bg-zinc-200 text-zinc-700" : "bg-zinc-100 text-zinc-500"
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* Main panel */}
          <div className="xl:col-span-2">
            <AnimatePresence mode="wait">

              {/* Documents tab */}
              {activeTab === "documents" && (
                <motion.div key="docs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Dropzone */}
                  <div
                    onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center transition-all",
                      dragActive ? "border-indigo-400 bg-indigo-50/40" : isUploading ? "border-indigo-200 bg-indigo-50/20" : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-zinc-50/50"
                    )}
                  >
                    <input type="file" id="doc-upload" accept=".pdf,.txt,.md,.json,.docx" onChange={handleFileSelect} disabled={isUploading} className="hidden" />
                    <label htmlFor="doc-upload" className={cn("block space-y-3", isUploading ? "cursor-not-allowed" : "cursor-pointer")}>
                      <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                      </div>
                      {isUploading ? (
                        <div>
                          <p className="text-sm font-medium text-indigo-600">Extracting "{uploadingFileName}"…</p>
                          <p className="text-xs text-zinc-400 mt-0.5">Processing on server</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-zinc-700">Drop files here, or <span className="text-indigo-600 underline">browse</span></p>
                          <p className="text-xs text-zinc-400 mt-0.5">PDF, TXT, MD, JSON · Max 15MB</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Paste spec option */}
                  <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                    <button
                      onClick={() => setShowPasteForm(!showPasteForm)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
                    >
                      <span className="text-sm font-medium text-zinc-700">Paste text specification</span>
                      <ChevronRight className={cn("h-4 w-4 text-zinc-400 transition-transform", showPasteForm && "rotate-90")} />
                    </button>

                    {showPasteForm && (
                      <div className="px-5 pb-5 space-y-3 border-t border-zinc-100">
                        <input
                          type="text" placeholder="Specification title"
                          value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)}
                          className="w-full mt-4 px-3 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        />
                        <textarea
                          placeholder="Paste raw specification text…"
                          rows={7} value={pasteContent} onChange={(e) => setPasteContent(e.target.value)}
                          className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono leading-relaxed resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleSavePasteSpec}
                            disabled={isSubmittingPaste || !pasteTitle.trim() || !pasteContent.trim()}
                            className="h-9 px-4 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                          >
                            {isSubmittingPaste ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sources list */}
                  <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-50 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-800">Uploaded documents</h3>
                      <span className="text-xs text-zinc-400">{sources.length} files</span>
                    </div>
                    {sources.length > 0 ? (
                      <div className="divide-y divide-zinc-50">
                        {sources.map((src) => (
                          <div key={src.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0">
                                <FileText className="h-4 w-4 text-zinc-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-zinc-800 truncate">{src.title}</p>
                                <p className="text-xs text-zinc-400 mt-0.5">{src.created_at} · {src.file_size}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={cn(
                                "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                src.status === "processed" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600 animate-pulse"
                              )}>{src.status}</span>
                              <button onClick={() => handleDeleteSource(src.id)} className="h-7 w-7 rounded-lg hover:bg-red-50 text-zinc-300 hover:text-red-500 flex items-center justify-center transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <FileClock className="h-7 w-7 text-zinc-200 mx-auto mb-2" />
                        <p className="text-sm font-medium text-zinc-500">No documents yet</p>
                        <p className="text-xs text-zinc-400 mt-0.5">Upload documents above to start AI analysis.</p>
                      </div>
                    )}
                  </div>

                  {/* Scope summary from intelligence */}
                  {intelligence?.project_overview && (
                    <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-zinc-800">Project Overview</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{intelligence.project_overview.summary}</p>
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div>
                          <p className="text-xs text-zinc-400 font-medium mb-1">Core Problem</p>
                          <p className="text-sm text-zinc-700 leading-relaxed">{intelligence.project_overview.core_problem}</p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-400 font-medium mb-1">Proposed Solution</p>
                          <p className="text-sm text-zinc-700 leading-relaxed">{intelligence.project_overview.proposed_solution}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Requirements tab */}
              {activeTab === "requirements" && (
                <motion.div key="reqs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
                  {requirements.length > 0 ? requirements.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      className="bg-white rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all duration-200 cursor-pointer p-4 flex items-center gap-4 group"
                    >
                      <div className={cn("h-2 w-2 rounded-full flex-shrink-0 mt-0.5", priorityStyles[req.priority]?.dot || "bg-zinc-400")} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">{req.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{req.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize", priorityStyles[req.priority]?.pill || "bg-zinc-50 text-zinc-600 border-zinc-200")}>
                          {req.priority}
                        </span>
                        <span className="text-xs text-zinc-400">{req.estimated_effort_hours || 0}h</span>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500" />
                      </div>
                    </div>
                  )) : (
                    <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
                      <Sparkles className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-zinc-600">No requirements extracted yet</p>
                      <p className="text-xs text-zinc-400 mt-1">Upload documents, then run AI analysis.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Sprints tab */}
              {activeTab === "sprints" && (
                <motion.div key="sprints" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  {sprints.length > 0 ? sprints.map((sprint) => {
                    const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id);
                    return (
                      <div key={sprint.id} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                        {/* Sprint header */}
                        <div className="px-5 py-4 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-zinc-900">{sprint.name}</h3>
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full capitalize">{sprint.status}</span>
                            </div>
                            {sprint.goal && <p className="text-xs text-zinc-400 mt-0.5 italic">{sprint.goal}</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-zinc-800">{sprint.velocity_points || 0} pts</p>
                            <p className="text-[10px] text-zinc-400">velocity</p>
                          </div>
                        </div>

                        {/* Tasks */}
                        <div className="p-4 space-y-2">
                          {sprintTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100/70 transition-colors group">
                              {/* Status toggle */}
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done")}
                                className="flex-shrink-0"
                                title="Cycle status"
                              >
                                {task.status === "done" ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                ) : (
                                  <div className={cn("h-4 w-4 rounded-full border-2 transition-colors",
                                    task.status === "in_progress" ? "border-amber-400 bg-amber-50" :
                                    task.status === "blocked" ? "border-red-400 bg-red-50" :
                                    "border-zinc-300"
                                  )} />
                                )}
                              </button>

                              <span className={cn("text-sm flex-1 min-w-0 truncate", task.status === "done" ? "line-through text-zinc-400" : "text-zinc-800")}>
                                {task.title}
                              </span>

                              <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md capitalize", taskStatusStyles[task.status] || "bg-zinc-100 text-zinc-600")}>
                                  {task.status.replace("_", " ")}
                                </span>
                                {task.story_points && (
                                  <span className="text-[10px] text-zinc-400">{task.story_points}pts</span>
                                )}
                                <button onClick={() => handleDeleteTask(task.id)} className="h-6 w-6 rounded-md hover:bg-red-50 text-zinc-300 hover:text-red-400 flex items-center justify-center transition-colors">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}

                          {sprintTasks.length === 0 && (
                            <p className="text-xs text-zinc-400 text-center py-4 italic">No tasks yet — add below or run AI analysis.</p>
                          )}

                          {/* Add task */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text" placeholder="Add a task…"
                              value={newTaskTitles[sprint.id] || ""}
                              onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [sprint.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleCreateTask(sprint.id, newTaskTitles[sprint.id] || "");
                                  setNewTaskTitles(prev => ({ ...prev, [sprint.id]: "" }));
                                }
                              }}
                              className="flex-1 px-3 h-8 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                            />
                            <button
                              onClick={() => { handleCreateTask(sprint.id, newTaskTitles[sprint.id] || ""); setNewTaskTitles(prev => ({ ...prev, [sprint.id]: "" })); }}
                              className="h-8 px-3 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            >
                              <Plus className="h-3.5 w-3.5" /> Add
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
                      <Calendar className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-zinc-600">No sprints yet</p>
                      <p className="text-xs text-zinc-400 mt-1">Run AI analysis to auto-generate a sprint backlog.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Risks tab */}
              {activeTab === "risks" && (
                <motion.div key="risks" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
                  {risks.length > 0 ? risks.map((risk) => (
                    <div
                      key={risk.id}
                      onClick={() => setSelectedRisk(risk)}
                      className="bg-white rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm p-4 cursor-pointer flex items-center gap-4 group transition-all"
                    >
                      <div className={cn("h-2 w-2 rounded-full flex-shrink-0", priorityStyles[risk.level]?.dot || "bg-zinc-400")} />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors truncate">{risk.title}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{risk.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize", priorityStyles[risk.level]?.pill || "bg-zinc-50 text-zinc-600 border-zinc-200")}>
                          {risk.level}
                        </span>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500" />
                      </div>
                    </div>
                  )) : (
                    <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center">
                      <ShieldAlert className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
                      <p className="text-sm font-medium text-zinc-600">No risks flagged</p>
                      <p className="text-xs text-zinc-400 mt-1">Run AI analysis to identify timeline and compliance risks.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* GitHub tab */}
              {activeTab === "github" && (
                <motion.div key="github" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <GithubTracker projectId={project.id} project={project} requirements={requirements} sprints={sprints} onProjectUpdate={(updated) => setProject(updated)} />
                </motion.div>
              )}

              {/* Client Portal tab */}
              {activeTab === "client" && (
                <motion.div key="client" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <ClientPortalProvider>
                    <ClientVisibilityControls
                      projectId={project.id}
                      projectName={project.name}
                      onPreviewClientView={() => { if (typeof window !== "undefined") window.open("/client", "_blank"); }}
                    />
                  </ClientPortalProvider>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Project settings */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-800">Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Status</label>
                  <select
                    value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="review">In Review</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Target Velocity (pts)</label>
                  <input
                    type="number" min={1} value={editVelocity} onChange={(e) => setEditVelocity(parseInt(e.target.value) || 1)}
                    className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 font-medium block mb-1">Launch Date</label>
                  <input
                    type="date" value={editLaunchDate} onChange={(e) => setEditLaunchDate(e.target.value)}
                    className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveSettings} disabled={isSavingSettings}
                className="w-full h-9 rounded-xl bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Changes"}
              </button>
              <button
                onClick={handleDeleteProject}
                className="w-full h-9 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete Project
              </button>
            </div>

            {/* Team */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-800">Team</h3>
                <button onClick={() => setShowInviteModal(true)} className="h-7 w-7 rounded-lg hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors" title="Add member">
                  <UserPlus className="h-3.5 w-3.5" />
                </button>
              </div>
              {assignedTeam.map((mem) => (
                <div key={mem.id} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-white flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                    {mem.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-800 truncate leading-none">{mem.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{mem.role}</p>
                  </div>
                  <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0",
                    mem.status === "active" ? "bg-emerald-500" : mem.status === "idle" ? "bg-amber-400" : "bg-zinc-300"
                  )} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInviteModal(false)} className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-zinc-100 rounded-2xl shadow-xl z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Add Team Member</h3>
                <button onClick={() => setShowInviteModal(false)} className="h-7 w-7 rounded-lg hover:bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {orgMembers.filter(m => !assignedTeam.find(at => at.id === m.user_id)).length > 0 ? (
                <>
                  <select
                    value={selectedMemberToAdd} onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                    className="w-full px-3 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-700 focus:outline-none cursor-pointer"
                  >
                    <option value="">Select a member…</option>
                    {orgMembers.filter(m => !assignedTeam.find(at => at.id === m.user_id)).map(m => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profile?.full_name || m.profile?.email} ({m.role})
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowInviteModal(false)} className="h-9 px-4 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50">Cancel</button>
                    <button
                      disabled={!selectedMemberToAdd}
                      onClick={() => {
                        const member = orgMembers.find(m => m.user_id === selectedMemberToAdd);
                        if (!member) return;
                        setAssignedTeam(prev => [...prev, {
                          id: member.user_id, email: member.profile?.email || "",
                          name: member.profile?.full_name || member.profile?.email?.split("@")[0] || "Member",
                          role: member.role.charAt(0).toUpperCase() + member.role.slice(1),
                          status: "idle", last_active: "Just added",
                        }]);
                        setSelectedMemberToAdd(""); setShowInviteModal(false);
                      }}
                      className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40"
                    >
                      Add to Project
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-zinc-500">All organization members are already on this project.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Analyzing overlay */}
      <AnimatePresence>
        {isRunningAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/25 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-zinc-100 p-7 shadow-2xl space-y-5 text-center"
            >
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-500">
                <BrainCircuit className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Analyzing Requirements</h3>
                <p className="text-xs text-zinc-400 mt-1">Parsing spec documents and mapping dependencies…</p>
              </div>
              <div className="space-y-2.5 text-left">
                {[
                  "Reading specification sources…",
                  "Extracting functional requirements…",
                  "Generating sprint backlog…",
                  "Evaluating risk matrix…",
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {agentProgress > idx ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : agentProgress === idx ? (
                      <Loader2 className="h-4 w-4 text-indigo-500 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-zinc-200 flex-shrink-0" />
                    )}
                    <span className={cn("text-sm", agentProgress > idx ? "text-zinc-400 line-through" : agentProgress === idx ? "text-indigo-600 font-medium" : "text-zinc-300")}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast notifications */}
      <AnimatePresence>
        {(agentFinished || uploadSuccess) && (
          <div className="fixed bottom-6 right-6 z-50">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
              className="bg-zinc-900 text-white rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 max-w-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{agentFinished ? "Analysis complete" : "Document uploaded"}</p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {agentFinished
                    ? "Requirements, sprints, and risks have been generated."
                    : `"${uploadSuccess}" added to project sources.`}
                </p>
              </div>
              <button onClick={() => { setAgentFinished(false); setUploadSuccess(null); }} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Requirement detail slide-over */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} onClick={() => setSelectedReq(null)} className="absolute inset-0 bg-black" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Requirement Detail</h3>
                <button onClick={() => setSelectedReq(null)} className="h-7 w-7 rounded-lg hover:bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize", priorityStyles[selectedReq.priority]?.pill)}>
                      {selectedReq.priority}
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-50 border border-zinc-200 px-2 py-0.5 rounded-full">{selectedReq.req_type}</span>
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 leading-snug">{selectedReq.title}</h2>
                  <p className="text-sm text-zinc-500 mt-2 leading-relaxed bg-zinc-50 p-4 rounded-xl">{selectedReq.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-zinc-400 font-medium">Complexity</p>
                    <p className="text-sm font-semibold text-zinc-800 mt-1 capitalize">{selectedReq.complexity || "Simple"}</p>
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-zinc-400 font-medium">Effort</p>
                    <p className="text-sm font-semibold text-zinc-800 mt-1">{selectedReq.estimated_effort_hours || 0}h</p>
                  </div>
                </div>
                {selectedReq.acceptance_criteria?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-800 mb-3">Acceptance Criteria</h4>
                    <ul className="space-y-2">
                      {selectedReq.acceptance_criteria.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-600 leading-relaxed">
                          <span className="h-5 w-5 rounded-md bg-indigo-50 text-indigo-600 font-semibold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">{i + 1}</span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Risk detail modal */}
      <AnimatePresence>
        {selectedRisk && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} onClick={() => setSelectedRisk(null)} className="absolute inset-0 bg-black" />
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md bg-white border border-zinc-100 rounded-2xl shadow-xl z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Risk Assessment</h3>
                <button onClick={() => setSelectedRisk(null)} className="h-7 w-7 rounded-lg hover:bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <h4 className="text-sm font-semibold text-zinc-900">{selectedRisk.title}</h4>
              <p className="text-sm text-zinc-500 leading-relaxed bg-zinc-50 p-4 rounded-xl">{selectedRisk.description}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-xs text-zinc-400 font-medium">Threat Level</p>
                  <p className="text-sm font-semibold text-zinc-800 mt-1 capitalize">{selectedRisk.level}</p>
                </div>
                <div className="bg-zinc-50 rounded-xl p-3">
                  <p className="text-xs text-zinc-400 font-medium">Category</p>
                  <p className="text-sm font-semibold text-zinc-800 mt-1 capitalize">{selectedRisk.category}</p>
                </div>
              </div>
              {selectedRisk.mitigation_strategy && (
                <div>
                  <p className="text-xs text-zinc-400 font-medium mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> AI Mitigation Strategy
                  </p>
                  <p className="text-sm text-zinc-600 leading-relaxed bg-indigo-50/50 p-4 rounded-xl">
                    {selectedRisk.mitigation_strategy}
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating chat */}
      {project && (
        <ProjectChat
          projectId={project.id} projectName={project.name} projectDescription={project.description}
          techStack={project.tech_stack}
          clientContext={{ project, intelligence, requirements, sprints, risks, sources }}
        />
      )}
    </div>
  );
}
