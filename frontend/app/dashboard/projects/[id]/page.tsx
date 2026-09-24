"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Sparkles, BrainCircuit, Calendar, FileText,
  AlertTriangle, ShieldAlert, CheckCircle2, Loader2, Code, Users,
  Settings2, Plus, ArrowUpRight, Search, ChevronRight, X, Play,
  UploadCloud, FileSpreadsheet, FileClock, UserPlus, Info, Check, Trash2, ArrowRight, FolderGit2
} from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";
import { ProjectChat } from "@/components/dashboard/project-chat";
import { GithubTracker } from "@/components/dashboard/github-tracker";

type TabType = "overview" | "requirements" | "sprints" | "risks" | "sources" | "github";

// Server-side PDF/text extraction via API route
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

function extractTextFromPdfBinary(arrayBuffer: ArrayBuffer): string {
  const textBytes = new Uint8Array(arrayBuffer);
  let binaryString = "";
  const chunkSize = 65536;
  for (let i = 0; i < textBytes.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(
      null,
      Array.from(textBytes.subarray(i, i + chunkSize))
    );
  }

  const regexTj = /\((.*?)\)\s*Tj/g;
  const regexTJ = /\[(.*?)\]\s*TJ/g;
  let matches;
  let extractedText = "";

  while ((matches = regexTj.exec(binaryString)) !== null) {
    extractedText += matches[1] + " ";
  }

  while ((matches = regexTJ.exec(binaryString)) !== null) {
    const arrayContent = matches[1];
    const stringInArrayRegex = /\((.*?)\)/g;
    let arrayMatches;
    while ((arrayMatches = stringInArrayRegex.exec(arrayContent)) !== null) {
      extractedText += arrayMatches[1] + "";
    }
    extractedText += " ";
  }

  extractedText = extractedText
    .replace(/\\([\(\)])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\s+/g, " ")
    .trim();

  if (extractedText.length < 10) {
    const lines = binaryString.split(/[\r\n]+/);
    const visibleLines = lines.filter(line => {
      return line.length > 20 && /^[a-zA-Z0-9\s\.,\(\)\-\:\'\"]+$/.test(line);
    });
    if (visibleLines.length > 0) {
      extractedText = visibleLines.join("\n");
    }
  }

  return extractedText || "No readable text found in PDF layout stream.";
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

export default function ProjectDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, organization, projects, refreshProjects } = useWorkspace();
  const [activeTab, setActiveTab] = React.useState<TabType>("overview");

  // Database / State values
  const [project, setProject] = React.useState<any>(null);
  const [intelligence, setIntelligence] = React.useState<any>(null);
  const [requirements, setRequirements] = React.useState<any[]>([]);
  const [sprints, setSprints] = React.useState<any[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [risks, setRisks] = React.useState<any[]>([]);

  // Continuous Document Center
  const [sources, setSources] = React.useState<DocumentSource[]>([]);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [newTaskTitles, setNewTaskTitles] = React.useState<Record<string, string>>({});
  const [pasteTitle, setPasteTitle] = React.useState("");
  const [pasteContent, setPasteContent] = React.useState("");
  const [showPasteForm, setShowPasteForm] = React.useState(false);
  const [isSubmittingPaste, setIsSubmittingPaste] = React.useState(false);

  // Teams Working State
  const [assignedTeam, setAssignedTeam] = React.useState<AssignedTeamMember[]>([]);
  const [orgMembers, setOrgMembers] = React.useState<OrgMember[]>([]);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [selectedMemberToAdd, setSelectedMemberToAdd] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("Developer");
  const [uploadingFileName, setUploadingFileName] = React.useState<string | null>(null);

  // Project Settings Config Modals
  const [editStatus, setEditStatus] = React.useState("draft");
  const [editVelocity, setEditVelocity] = React.useState(30);
  const [editLaunchDate, setEditLaunchDate] = React.useState("2026-12-31");
  const [isSavingSettings, setIsSavingSettings] = React.useState(false);

  // UI Load and AI analysis states
  const [loading, setLoading] = React.useState(true);
  const [isRunningAgent, setIsRunningAgent] = React.useState(false);
  const [agentProgress, setAgentProgress] = React.useState(0);
  const [agentFinished, setAgentFinished] = React.useState(false);

  // Detail slide-overs
  const [selectedReq, setSelectedReq] = React.useState<any>(null);
  const [selectedRisk, setSelectedRisk] = React.useState<any>(null);

  // Load project core details and mock fallback data
  const loadProjectData = async () => {
    setLoading(true);
    const supabase = createClient() as any;

    // 1. Fetch Project Identity
    const { data: projData, error: projError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (projError || !projData) {
      console.error("Project not found:", projError);
      setLoading(false);
      return;
    }
    setProject(projData);
    setEditStatus(projData.status);
    setEditVelocity(projData.metadata?.target_velocity || 30);
    setEditLaunchDate(projData.metadata?.target_launch_date || "2026-12-31");

    // 2. Fetch Project Intelligence (Overview, Objectives, Tech stack metadata)
    const { data: intelData } = await supabase
      .from("project_intelligence")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setIntelligence(intelData);

    // 3. Fetch Requirements
    const { data: reqsData } = await supabase
      .from("requirements")
      .select("*")
      .eq("project_id", id);
    setRequirements(reqsData || []);

    // 4. Fetch Sprints
    const { data: sprintsData } = await supabase
      .from("sprints")
      .select("*")
      .eq("project_id", id)
      .order("sprint_number", { ascending: true });
    setSprints(sprintsData || []);

    // 4.5 Fetch Sprints Tasks
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", id);
    setTasks(tasksData || []);

    // 5. Fetch Risks
    const { data: risksData } = await supabase
      .from("risks")
      .select("*")
      .eq("project_id", id);
    setRisks(risksData || []);

    // 6. Fetch Continuous Document Sources
    const { data: sourcesData } = await supabase
      .from("requirement_sources")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    // Map database inputs to structured document items
    const mappedSources: DocumentSource[] = (sourcesData || []).map((s: any, idx: number) => ({
      id: s.id,
      title: s.title,
      source_type: s.source_type,
      status: s.status as any || "processed",
      created_at: new Date(s.created_at).toLocaleDateString(),
      version: `v1.${(sourcesData || []).length - idx}`,
      uploaded_by_email: user?.email || "owner@acme.com",
      file_size: s.file_size_bytes ? `${(s.file_size_bytes / 1024).toFixed(1)} KB` : "340 KB"
    }));
    setSources(mappedSources);

    // 7. Fetch real org members (profiles joined through organization_members)
    if (organization?.id) {
      const { data: membersData } = await supabase
        .from("organization_members")
        .select("user_id, role, profile:profiles(id, email, full_name, avatar_url)")
        .eq("organization_id", organization.id);

      if (membersData) {
        setOrgMembers(membersData as OrgMember[]);
        // Build assignedTeam from real org members
        const teamFromDB: AssignedTeamMember[] = membersData.map((m: any) => ({
          id: m.user_id,
          email: m.profile?.email || "",
          name: m.profile?.full_name || m.profile?.email?.split("@")[0] || "Member",
          role: m.role.charAt(0).toUpperCase() + m.role.slice(1),
          avatar_url: m.profile?.avatar_url || undefined,
          status: m.user_id === user?.id ? "active" : "idle",
          last_active: m.user_id === user?.id ? "Active now" : "Recently active"
        }));
        setAssignedTeam(teamFromDB);
      } else {
        // Fallback to current user
        setAssignedTeam([{
          id: user?.id || "owner",
          email: user?.email || "",
          name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You",
          role: "Owner",
          status: "active",
          last_active: "Active now"
        }]);
      }
    } else {
      setAssignedTeam([{
        id: user?.id || "owner",
        email: user?.email || "",
        name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "You",
        role: "Owner",
        status: "active",
        last_active: "Active now"
      }]);
    }

    setLoading(false);
  };

  React.useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  // Continuous documents drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadDocumentFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadDocumentFile(file);
    }
  };

  const uploadDocumentFile = async (file: File) => {
    setIsUploading(true);
    setUploadingFileName(file.name);
    const fileName = file.name;
    const fileSize = `${(file.size / 1024).toFixed(1)} KB`;

    let rawText = "";
    try {
      // Always use server-side API for reliable extraction (handles PDFs, text, etc.)
      rawText = await extractTextViaServer(file);
    } catch (parseErr: any) {
      console.warn("Server extraction failed, using fallback:", parseErr);
      try {
        if (file.type === "text/plain" || fileName.endsWith(".txt") || fileName.endsWith(".md")) {
          rawText = await file.text();
        } else {
          rawText = `[Parse Failure: ${fileName}]\nFailed to read document: ${parseErr.message}`;
        }
      } catch {
        rawText = `[Binary File: ${fileName} (${fileSize})]`;
      }
    }

    const supabase = createClient() as any;

    const { error } = await supabase
      .from("requirement_sources")
      .insert({
        project_id: id,
        uploaded_by: user?.id,
        source_type: fileName.toLowerCase().endsWith(".pdf") ? "srs_document" : "meeting_transcript",
        title: fileName,
        file_name: fileName,
        file_size_bytes: file.size,
        mime_type: file.type || "text/plain",
        raw_text: rawText || `Document: ${fileName}`,
        status: "processed"
      });

    setIsUploading(false);
    setUploadingFileName(null);
    if (!error) {
      setUploadSuccess(fileName);
      setTimeout(() => setUploadSuccess(null), 4000);
      loadProjectData();
    } else {
      console.error("Supabase insert error:", error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  // Run Intelligence AI Agent Pipeline
  const runIntelligenceAgent = async () => {
    if (sources.length === 0) {
      alert("Please upload at least one document source first under the Specs & Documents tab!");
      return;
    }

    setIsRunningAgent(true);
    setAgentFinished(false);
    setAgentProgress(0);

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // Start parallel execution: 1. API Call, 2. Simulated progress steps
    const apiPromise = fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ projectId: id })
    });

    await delay(800);
    setAgentProgress(1); // Normalizing specs

    await delay(1000);
    setAgentProgress(2); // Extracting requirements

    await delay(1000);
    setAgentProgress(3); // Generating Sprints Backlog

    try {
      const response = await apiPromise;
      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.error || "Requirements analysis execution failed");
      }

      setAgentProgress(4); // Risk matrix evaluation completed
      await delay(500);

      setIsRunningAgent(false);
      setAgentFinished(true);
      loadProjectData();
    } catch (err: any) {
      console.error("AI analysis execution error:", err);
      alert(err.message || "Failed to execute requirements analysis using Groq.");
      setIsRunningAgent(false);
    }
  };

  const sprintNumber = () => sprints.length + 1;

  const handleDeleteSource = async (sourceId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this specification source?");
    if (!confirmDelete) return;

    const supabase = createClient() as any;
    const { error } = await supabase.from("requirement_sources").delete().eq("id", sourceId);
    if (!error) {
      loadProjectData();
    }
  };

  const handleDeleteProject = async () => {
    const confirmDelete = window.confirm("Are you absolutely sure you want to delete this project? All associated requirements, sprints, and threat logs will be permanently deleted!");
    if (!confirmDelete) return;

    const supabase = createClient() as any;
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      await refreshProjects();
      router.push("/dashboard");
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const supabase = createClient() as any;
    const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }
  };

  const handleUpdateTaskAssignee = async (taskId: string, assigneeId: string) => {
    const supabase = createClient() as any;
    const { error } = await supabase.from("tasks").update({ assigned_to: assigneeId || null }).eq("id", taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, assigned_to: assigneeId || null } : t));
    }
  };

  const handleUpdateTaskPriority = async (taskId: string, priority: string) => {
    const supabase = createClient() as any;
    const { error } = await supabase.from("tasks").update({ priority }).eq("id", taskId);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority } : t));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const supabase = createClient() as any;
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const handleCreateTask = async (sprintId: string, title: string) => {
    if (!title.trim()) return;
    const supabase = createClient() as any;
    const { data: newTask, error } = await supabase.from("tasks").insert({
      project_id: id,
      sprint_id: sprintId,
      created_by: user?.id,
      title: title.trim(),
      status: "todo",
      priority: "medium",
      story_points: 3,
      estimated_hours: 6
    }).select().single();
    if (!error && newTask) {
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleSavePasteSpec = async () => {
    if (!pasteTitle.trim() || !pasteContent.trim()) return;
    setIsSubmittingPaste(true);
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("requirement_sources")
      .insert({
        project_id: id,
        uploaded_by: user?.id,
        source_type: "meeting_transcript",
        title: pasteTitle.trim(),
        file_name: pasteTitle.trim().toLowerCase().replace(/\s+/g, "_") + ".txt",
        file_size_bytes: pasteContent.length,
        mime_type: "text/plain",
        raw_text: pasteContent.trim(),
        status: "processed"
      });

    setIsSubmittingPaste(false);
    if (!error) {
      setPasteTitle("");
      setPasteContent("");
      setShowPasteForm(false);
      setUploadSuccess(pasteTitle.trim());
      setTimeout(() => setUploadSuccess(null), 3000);
      loadProjectData();
    }
  };

  // Save project parameter modifications
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("projects")
      .update({
        status: editStatus,
        metadata: {
          ...project.metadata,
          target_velocity: editVelocity,
          target_launch_date: editLaunchDate
        }
      })
      .eq("id", id);

    setIsSavingSettings(false);
    if (!error) {
      loadProjectData();
      await refreshProjects();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-50 text-red-750 border-red-200";
      case "high": return "bg-orange-50 text-orange-750 border-orange-200";
      case "medium": return "bg-amber-50 text-amber-750 border-amber-200";
      default: return "bg-zinc-50 text-zinc-600 border-zinc-200";
    }
  };

  const overview = intelligence?.project_overview;
  const objectives = intelligence?.business_objectives;
  const techRecs = intelligence?.technology_recommendations;

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6 relative overflow-x-hidden">

      {/* ── Top Header Banner ── */}
      <div className="bg-white rounded-2xl border border-zinc-150 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-tr ${project?.color || "from-indigo-500 to-violet-600"} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-zinc-900 tracking-tight leading-none truncate">{project?.name}</h1>
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {project?.status}
              </span>
              <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-zinc-550/10 text-zinc-650 rounded-full">
                {project?.domain || "Enterprise Application"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium line-clamp-1 max-w-lg">{project?.description || "No description provided."}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runIntelligenceAgent}
            disabled={isRunningAgent}
            className="h-9 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <BrainCircuit className="h-4 w-4" />
            Analyze Requirements
          </button>
        </div>
      </div>

      {/* ── Main Layout: 2/3 Workspace Panel, 1/3 Controls Panel ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

        {/* Left Column: Interactive Workspace */}
        <div className="xl:col-span-2 space-y-6">

          {/* Tabs bar */}
          <div className="border-b border-zinc-250 flex items-center gap-1 overflow-x-auto select-none pb-0">
            {[
              { id: "overview", label: "Specs & Documents", icon: FileText, badge: sources.length },
              { id: "requirements", label: "Extracted Specs", icon: Sparkles, badge: requirements.length },
              { id: "sprints", label: "Sprints & Roadmap", icon: Calendar, badge: sprints.length },
              { id: "risks", label: "Threat Matrix", icon: ShieldAlert, badge: risks.length },
              {
                id: "github",
                label: "GitHub & Code Tracking",
                icon: FolderGit2,
                badge: project?.metadata?.github?.fullName ? `${project.metadata.github.progressPercentage || 0}%` : undefined
              },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs font-bold transition-all duration-200 whitespace-nowrap -mb-px ${active
                      ? "border-indigo-600 text-indigo-700 font-extrabold"
                      : "border-transparent text-zinc-500 hover:text-zinc-900"
                    }`}
                >
                  <tab.icon className={`h-4 w-4 ${active ? "text-indigo-600" : "text-zinc-400"}`} />
                  {tab.label}
                  {tab.badge !== undefined && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-550"}`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Tab Body content */}
          <div className="min-h-[50vh]">
            <AnimatePresence mode="wait">

              {/* Tabs 1: Specs & Continuous Document Upload */}
              {activeTab === "overview" && (
                <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                  {/* Continuous Upload File dropzone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all relative ${dragActive
                        ? "border-indigo-500 bg-indigo-50/50"
                        : isUploading
                          ? "border-indigo-300 bg-indigo-50/30"
                          : "border-zinc-200 hover:border-indigo-400 bg-white hover:bg-zinc-50/30"
                      }`}
                  >
                    <input
                      type="file"
                      id="doc-upload"
                      multiple={false}
                      accept=".pdf,.txt,.md,.json,.docx"
                      onChange={handleFileSelect}
                      disabled={isUploading}
                      className="hidden"
                    />
                    <label htmlFor="doc-upload" className={`space-y-3.5 block ${isUploading ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100 shadow-sm">
                        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
                      </div>
                      <div>
                        {isUploading ? (
                          <>
                            <p className="text-xs font-bold text-indigo-700">Extracting text from "{uploadingFileName}"…</p>
                            <p className="text-[10px] text-indigo-400 font-semibold mt-1">Processing on server — please wait</p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-bold text-zinc-800">Drag & Drop document or <span className="text-indigo-600 underline">click to browse</span></p>
                            <p className="text-[10px] text-zinc-400 font-semibold mt-1">Supports PDF (text-based), TXT, MD, JSON — Max 15MB</p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Manual Paste Form option */}
                  <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm overflow-hidden transition-all">
                    <button
                      onClick={() => setShowPasteForm(!showPasteForm)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
                        <span className="text-xs font-black text-zinc-950 uppercase tracking-wide">Or Paste Raw Specifications Text</span>
                      </div>
                      <ChevronRight className={`h-4.5 w-4.5 text-zinc-400 transition-transform duration-200 ${showPasteForm ? "rotate-90 text-zinc-650" : ""}`} />
                    </button>

                    {showPasteForm && (
                      <div className="p-6 border-t border-zinc-100 space-y-4 bg-zinc-50/10">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Specification Title</label>
                          <input
                            type="text"
                            placeholder="E.g., Pune MVP Food Delivery Transcripts"
                            value={pasteTitle}
                            onChange={(e) => setPasteTitle(e.target.value)}
                            className="w-full px-3 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 placeholder-zinc-400 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Specifications / Notes Text Content</label>
                          <textarea
                            placeholder="Paste your raw specifications document content here..."
                            rows={8}
                            value={pasteContent}
                            onChange={(e) => setPasteContent(e.target.value)}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none font-mono leading-relaxed"
                          />
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={handleSavePasteSpec}
                            disabled={isSubmittingPaste || !pasteTitle.trim() || !pasteContent.trim()}
                            className="h-9 px-4 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center gap-1.5 shadow-sm active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
                          >
                            {isSubmittingPaste ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-4 w-4" />}
                            Save Specification Source
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents List */}
                  <div className="bg-white rounded-2xl border border-zinc-150 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">Continuous Specifications History</h3>
                      <span className="text-[10px] font-bold text-zinc-400">{sources.length} files parsed</span>
                    </div>

                    <div className="divide-y divide-zinc-100">
                      {sources.map((src) => (
                        <div key={src.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center flex-shrink-0">
                              <FileText className="h-4.5 w-4.5 text-zinc-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-zinc-850 truncate leading-none">{src.title}</p>
                                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 uppercase tracking-wide border border-zinc-200">
                                  {src.version}
                                </span>
                              </div>
                              <p className="text-[9px] font-semibold text-zinc-400 mt-1 truncate">
                                Uploaded {src.created_at} by {src.uploaded_by_email} ({src.file_size})
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${src.status === "processed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-indigo-50 text-indigo-700 border-indigo-100 animate-pulse"
                              }`}>
                              {src.status}
                            </span>
                            <button
                              onClick={() => handleDeleteSource(src.id)}
                              className="h-7 w-7 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 flex items-center justify-center transition-colors"
                              title="Delete source document"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {sources.length === 0 && (
                        <div className="text-center py-8">
                          <FileClock className="h-8 w-8 text-zinc-300 mx-auto mb-2 opacity-50" />
                          <p className="text-xs font-bold text-zinc-800">No documents uploaded yet</p>
                          <p className="text-[10px] text-zinc-400 font-semibold mt-1">Upload specification sheets above to initiate requirements workspace mapping.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Block */}
                  {intelligence && (
                    <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-4">
                      <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Workspace Scope Overview</h3>
                      <p className="text-xs font-semibold text-zinc-550 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        {overview?.summary}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-zinc-500 pt-2">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Core Problem</p>
                          <p className="mt-1 text-zinc-800 leading-relaxed">{overview?.core_problem}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Proposed Solution</p>
                          <p className="mt-1 text-zinc-800 leading-relaxed">{overview?.proposed_solution}</p>
                        </div>
                      </div>
                    </div>
                  )}

                </motion.div>
              )}

              {/* Tabs 2: Requirements */}
              {activeTab === "requirements" && (
                <motion.div key="requirements" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">Extracted System Requirements</h3>
                    <span className="text-[10px] font-bold text-zinc-400">{requirements.length} specs extracted</span>
                  </div>

                  {requirements.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedReq(req)}
                      className="bg-white p-5 rounded-2xl border border-zinc-150 hover:shadow-md hover:border-zinc-200 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-2 min-w-0 pr-4 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityColor(req.priority)}`}>
                            {req.priority}
                          </span>
                          <span className="text-[9px] font-extrabold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full">
                            {req.req_type}
                          </span>
                          {req.category && (
                            <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-full">
                              {req.category}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-zinc-900 group-hover:text-indigo-600 transition-colors truncate leading-tight">{req.title}</h4>
                        <p className="text-xs font-medium text-zinc-500 line-clamp-1 leading-relaxed">{req.description}</p>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-black text-zinc-800">{req.estimated_effort_hours || 0} hrs</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase mt-0.5">{req.complexity || "Simple"}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                      </div>
                    </div>
                  ))}

                  {requirements.length === 0 && (
                    <div className="bg-white border border-zinc-150 rounded-2xl p-12 text-center shadow-sm">
                      <Sparkles className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-zinc-850">No requirements extracted</h3>
                      <p className="text-xs text-zinc-400 font-medium mt-1">Upload specification documents and trigger AI parsing to begin.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tabs 3: Sprints */}
              {activeTab === "sprints" && (
                <motion.div key="sprints" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                  {sprints.map((sprint) => (
                    <div key={sprint.id} className="bg-white rounded-2xl border border-zinc-150 shadow-sm overflow-hidden divide-y divide-zinc-100">

                      {/* Sprint header */}
                      <div className="p-5 flex items-center justify-between bg-zinc-50/50 flex-wrap gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-black text-zinc-900">{sprint.name}</h3>
                            <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                              {sprint.status}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-zinc-550 italic">{sprint.goal || "No sprint goal defined."}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-zinc-800">{sprint.velocity_points || 0} story points</p>
                          <p className="text-[9px] font-bold text-zinc-450 uppercase mt-0.5">Estimated Velocity</p>
                        </div>
                      </div>

                      {/* Tasks list */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Cycle Tasks</p>
                          <span className="text-[9px] font-bold text-zinc-400">{tasks.filter(t => t.sprint_id === sprint.id).length} tasks</span>
                        </div>
                        {(() => {
                          const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id);
                          return (
                            <>
                              {sprintTasks.map((task) => {
                                const assignee = assignedTeam.find(m => m.id === task.assigned_to);
                                return (
                                <div key={task.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2">
                                  {/* Task header: title + delete */}
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-bold text-zinc-800 leading-snug flex-1">{task.title}</span>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="h-6 w-6 rounded-md hover:bg-red-50 text-zinc-300 hover:text-red-500 flex items-center justify-center flex-shrink-0 transition-colors"
                                      title="Delete task"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>

                                  {/* Task metadata row */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Priority */}
                                    <select
                                      value={task.priority || "medium"}
                                      onChange={(e) => handleUpdateTaskPriority(task.id, e.target.value)}
                                      className={`h-6 pl-2 pr-6 rounded-md text-[9px] font-extrabold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer border ${
                                        task.priority === "critical" ? "bg-red-50 border-red-200 text-red-700" :
                                        task.priority === "high" ? "bg-orange-50 border-orange-200 text-orange-700" :
                                        task.priority === "medium" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                        "bg-zinc-50 border-zinc-200 text-zinc-500"
                                      }`}
                                    >
                                      <option value="critical">🔴 Critical</option>
                                      <option value="high">🟠 High</option>
                                      <option value="medium">🟡 Medium</option>
                                      <option value="low">⚪ Low</option>
                                    </select>

                                    {/* Assignee */}
                                    <select
                                      value={task.assigned_to || ""}
                                      onChange={(e) => handleUpdateTaskAssignee(task.id, e.target.value)}
                                      className="h-6 pl-2 pr-6 bg-white border border-zinc-200 rounded-md text-[9px] font-bold text-zinc-650 focus:outline-none appearance-none cursor-pointer max-w-[130px]"
                                    >
                                      <option value="">👤 Unassigned</option>
                                      {assignedTeam.map((m) => (
                                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                                      ))}
                                    </select>

                                    {/* Status */}
                                    <select
                                      value={task.status}
                                      onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                      className={`h-6 pl-2 pr-6 border rounded-md text-[9px] font-extrabold uppercase tracking-wider focus:outline-none appearance-none cursor-pointer ${
                                        task.status === "done" ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                                        task.status === "blocked" ? "bg-red-50 border-red-200 text-red-700" :
                                        task.status === "in_progress" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                        "bg-white border-zinc-200 text-zinc-500"
                                      }`}
                                    >
                                      <option value="todo">Todo</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="done">Done</option>
                                      <option value="blocked">Blocked</option>
                                    </select>

                                    {/* Story points badge */}
                                    {task.story_points && (
                                      <span className="h-6 px-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-extrabold rounded-md flex items-center">
                                        {task.story_points} pts
                                      </span>
                                    )}

                                    {/* Assignee avatar chip */}
                                    {assignee && (
                                      <span className="h-6 px-2 bg-violet-50 border border-violet-100 text-violet-700 text-[9px] font-bold rounded-md flex items-center gap-1">
                                        <span className="h-4 w-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-[8px] font-black flex items-center justify-center">
                                          {assignee.name.slice(0, 1).toUpperCase()}
                                        </span>
                                        {assignee.name.split(" ")[0]}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                              })}

                              {sprintTasks.length === 0 && (
                                <div className="text-center py-4">
                                  <p className="text-[10px] font-medium text-zinc-400 italic">No tasks in this sprint yet.</p>
                                  <p className="text-[9px] text-zinc-300 mt-0.5">Add tasks below or run AI analysis to auto-generate.</p>
                                </div>
                              )}

                              {/* Quick add task input */}
                              <div className="pt-3 border-t border-zinc-100 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="+ Add a task (press Enter)"
                                  value={newTaskTitles[sprint.id] || ""}
                                  onChange={(e) => setNewTaskTitles(prev => ({ ...prev, [sprint.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleCreateTask(sprint.id, newTaskTitles[sprint.id] || "");
                                      setNewTaskTitles(prev => ({ ...prev, [sprint.id]: "" }));
                                    }
                                  }}
                                  className="flex-1 px-3 h-8 bg-white border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-indigo-300 transition-colors"
                                />
                                <button
                                  onClick={() => {
                                    handleCreateTask(sprint.id, newTaskTitles[sprint.id] || "");
                                    setNewTaskTitles(prev => ({ ...prev, [sprint.id]: "" }));
                                  }}
                                  className="h-8 px-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center gap-1"
                                >
                                  <Plus className="h-3 w-3" /> Add
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}

                  {sprints.length === 0 && (
                    <div className="bg-white border border-zinc-150 rounded-2xl p-12 text-center shadow-sm">
                      <Calendar className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-zinc-850">No sprints configured</h3>
                      <p className="text-xs text-zinc-400 font-medium mt-1">Sprints backlog planning will activate after running requirements analysis.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tabs 4: Risks */}
              {activeTab === "risks" && (
                <motion.div key="risks" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">AI-Generated Risk Matrix</h3>
                    <span className="text-[10px] font-bold text-zinc-400">{risks.length} threats</span>
                  </div>

                  {risks.map((risk) => (
                    <div
                      key={risk.id}
                      onClick={() => setSelectedRisk(risk)}
                      className="bg-white p-5 rounded-2xl border border-zinc-150 hover:shadow-md hover:border-zinc-200 transition-all duration-200 cursor-pointer flex items-start justify-between gap-4"
                    >
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityColor(risk.level)}`}>
                            {risk.level} level
                          </span>
                          <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 border border-zinc-150 px-2 py-0.5 rounded-full capitalize">
                            {risk.category} Risk
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-zinc-800 leading-tight truncate">{risk.title}</h4>
                        <p className="text-xs font-semibold text-zinc-450 mt-1 leading-relaxed line-clamp-1">{risk.description}</p>
                      </div>

                      <ChevronRight className="h-4 w-4 text-zinc-300 self-center flex-shrink-0" />
                    </div>
                  ))}

                  {risks.length === 0 && (
                    <div className="bg-white border border-zinc-150 rounded-2xl p-12 text-center shadow-sm">
                      <ShieldAlert className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-zinc-850">No threats flagged</h3>
                      <p className="text-xs text-zinc-400 font-medium mt-1">Orion will search for timeline bottlenecks and compliance gaps upon analysis.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Tabs 5: GitHub Code Intelligence & Progress Tracking */}
              {activeTab === "github" && (
                <motion.div
                  key="github"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <GithubTracker
                    projectId={project.id}
                    project={project}
                    requirements={requirements}
                    sprints={sprints}
                    onProjectUpdate={(updated) => setProject(updated)}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Parameters, Settings & Teams Working */}
        <div className="space-y-6">

          {/* Metadata Parameters Settings */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide border-b border-zinc-50 pb-2">Workspace Controls</h3>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Project Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-650 focus:outline-none"
                >
                  <option value="draft">Draft Setup</option>
                  <option value="active">Active Execution</option>
                  <option value="review">In Client Review</option>
                  <option value="complete">Complete</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Target Velocity (Points)</label>
                <input
                  type="number"
                  min={1}
                  value={editVelocity}
                  onChange={(e) => setEditVelocity(parseInt(e.target.value) || 1)}
                  className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-850 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">Launch Timeline Target</label>
                <input
                  type="date"
                  value={editLaunchDate}
                  onChange={(e) => setEditLaunchDate(e.target.value)}
                  className="w-full h-9 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                />
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="w-full h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                {isSavingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Project Settings"}
              </button>
              <button
                onClick={handleDeleteProject}
                className="w-full h-9 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Project
              </button>
            </div>
          </div>

          {/* Teams Working Widget */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-2">
              <h3 className="text-xs font-black text-zinc-950 uppercase tracking-wide">Teams Working</h3>
              <button
                onClick={() => setShowInviteModal(true)}
                className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-indigo-600 transition-colors"
                title="Add Teammate"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {assignedTeam.map((mem) => (
                <div key={mem.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center text-[10px] font-black flex-shrink-0">
                      {mem.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-850 leading-none truncate">{mem.name}</p>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase mt-1 leading-none">{mem.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`h-1.5 w-1.5 rounded-full ${mem.status === "active" ? "bg-emerald-500" : mem.status === "idle" ? "bg-amber-400" : "bg-zinc-350"
                      }`} />
                    <span className="text-[9px] font-semibold text-zinc-400 capitalize hidden sm:inline">{mem.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Invite Member modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="relative w-full max-w-md bg-white border border-zinc-150 rounded-2xl shadow-xl z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
                <h3 className="text-sm font-black text-zinc-900">Assign Member to Project</h3>
                <button onClick={() => setShowInviteModal(false)} className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-450">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Show org members from DB to assign */}
              <div className="space-y-4">
                {orgMembers.length > 0 ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Select Organization Member</label>
                      <select
                        value={selectedMemberToAdd}
                        onChange={(e) => setSelectedMemberToAdd(e.target.value)}
                        className="w-full px-3 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
                      >
                        <option value="">— Select a member —</option>
                        {orgMembers
                          .filter(m => !assignedTeam.find(at => at.id === m.user_id))
                          .map(m => (
                            <option key={m.user_id} value={m.user_id}>
                              {m.profile?.full_name || m.profile?.email} ({m.role})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(false)}
                        className="h-9 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!selectedMemberToAdd}
                        onClick={() => {
                          const member = orgMembers.find(m => m.user_id === selectedMemberToAdd);
                          if (!member) return;
                          setAssignedTeam(prev => [
                            ...prev,
                            {
                              id: member.user_id,
                              email: member.profile?.email || "",
                              name: member.profile?.full_name || member.profile?.email?.split("@")[0] || "Member",
                              role: member.role.charAt(0).toUpperCase() + member.role.slice(1),
                              status: "idle",
                              last_active: "Added just now"
                            }
                          ]);
                          setSelectedMemberToAdd("");
                          setShowInviteModal(false);
                        }}
                        className="h-9 px-4 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        Add to Project
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-zinc-500 font-semibold">No other organization members found. Invite them to your organization first, then assign them here.</p>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowInviteModal(false)}
                        className="h-9 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50"
                      >
                        Close
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Analyzing Stepper Overlay */}
      <AnimatePresence>
        {isRunningAgent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-900/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm bg-white border border-zinc-150 rounded-2xl p-7 shadow-2xl space-y-6 text-center"
            >
              <div className="relative h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                <BrainCircuit className="h-7 w-7 animate-pulse" />
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">AI</span>
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-zinc-900 tracking-tight">Requirement Intelligence Agent</h3>
                <p className="text-xs font-semibold text-zinc-400">Parsing uploaded spec sheets and mapping dependencies…</p>
              </div>

              <div className="space-y-3.5 text-left border-t border-zinc-100 pt-5">
                {[
                  "Reading pasted specification text…",
                  "Normalizing vocabulary structures…",
                  "Extracting functional & non-functional requirements…",
                  "Structuring sprint schedule backlogs…",
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    {agentProgress > idx ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50" />
                    ) : agentProgress === idx ? (
                      <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-zinc-100 border border-zinc-200" />
                    )}
                    <span className={`text-xs font-bold leading-none ${agentProgress === idx ? "text-indigo-600 font-extrabold" : agentProgress > idx ? "text-zinc-555 line-through opacity-70" : "text-zinc-400"}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Notification */}
      <AnimatePresence>
        {agentFinished && (
          <div className="fixed bottom-5 right-5 z-50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-950 text-white rounded-2xl p-5 shadow-2xl border border-zinc-800 flex items-start gap-3 max-w-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black">Workspace Analysis Completed</p>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1 leading-relaxed">
                  The Requirement Intelligence Agent parsed your specification sources, generated requirements cards, mapped sprints, and generated a risk matrix.
                </p>
                <button onClick={() => setAgentFinished(false)} className="mt-3 text-[9px] font-black uppercase text-indigo-400">
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload Document Success Notification */}
      <AnimatePresence>
        {uploadSuccess && (
          <div className="fixed bottom-5 right-5 z-50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-zinc-950 text-white rounded-2xl p-5 shadow-2xl border border-zinc-800 flex items-start gap-3 max-w-sm"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black">Document Uploaded</p>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1 leading-relaxed">
                  Specification source file <span className="text-indigo-400 font-bold">"{uploadSuccess}"</span> has been uploaded and added to the project context logs successfully.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Requirement Detail Slide-over Panel */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReq(null)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-sm font-black text-zinc-900 uppercase tracking-wide">Requirement Detail</h3>
                <button onClick={() => setSelectedReq(null)} className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getPriorityColor(selectedReq.priority)}`}>
                      {selectedReq.priority}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest bg-zinc-50 border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full">
                      {selectedReq.req_type}
                    </span>
                  </div>
                  <h2 className="text-base font-black text-zinc-900 leading-snug">{selectedReq.title}</h2>
                  <p className="text-xs font-semibold text-zinc-550 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">{selectedReq.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-zinc-100 bg-zinc-50/50 p-3 rounded-xl text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Complexity</p>
                    <p className="text-xs font-black text-zinc-800 capitalize mt-1">{selectedReq.complexity || "Simple"}</p>
                  </div>
                  <div className="border border-zinc-100 bg-zinc-50/50 p-3 rounded-xl text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Effort</p>
                    <p className="text-xs font-black text-zinc-800 mt-1">{selectedReq.estimated_effort_hours || 0} hrs</p>
                  </div>
                </div>

                {/* Acceptance Criteria */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Acceptance Criteria</h4>
                  {selectedReq.acceptance_criteria && selectedReq.acceptance_criteria.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedReq.acceptance_criteria.map((criteria: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-zinc-650 leading-relaxed">
                          <span className="h-5 w-5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center flex-shrink-0 text-[9px] mt-0.5">{idx + 1}</span>
                          <span className="flex-1">{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-medium text-zinc-400 italic">No acceptance criteria defined.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Risk Detail Modal */}
      <AnimatePresence>
        {selectedRisk && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRisk(null)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-zinc-155 rounded-2xl shadow-xl z-10 p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-50 pb-3">
                <div className="flex items-center gap-1.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-indigo-500" />
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Risk Assessment</h3>
                </div>
                <button onClick={() => setSelectedRisk(null)} className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-black text-zinc-900 leading-snug">{selectedRisk.title}</h4>
                <p className="text-xs font-semibold text-zinc-500 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">{selectedRisk.description}</p>

                <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-zinc-500 pt-2">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Threat Level</span>
                    <p className="font-black text-red-655 capitalize mt-0.5">{selectedRisk.level}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Risk Category</span>
                    <p className="font-black text-zinc-800 capitalize mt-0.5">{selectedRisk.category}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-zinc-100">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> AI-Generated Mitigation Strategy
                  </span>
                  <p className="text-xs font-semibold text-zinc-650 leading-relaxed bg-indigo-50/30 p-3 rounded-lg border border-indigo-50">
                    {selectedRisk.mitigation_strategy || "No mitigation strategy provided."}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Groq-Powered AI Project Chatbot */}
      {project && (
        <ProjectChat
          projectId={project.id}
          projectName={project.name}
          projectDescription={project.description}
          techStack={project.tech_stack}
          clientContext={{
            project,
            intelligence,
            requirements,
            sprints,
            risks,
            sources,
          }}
        />
      )}

    </div>
  );
}
