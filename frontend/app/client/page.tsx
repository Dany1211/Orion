"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Layers,
  FileSearch,
  CheckCircle2,
  Clock,
  Video,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Download,
  ThumbsUp,
  RotateCcw,
  Check,
  Circle,
  TrendingUp,
  Inbox,
  ArrowRight,
  FolderKanban,
  Users,
  Code2,
  Cpu,
  ChevronRight,
  ArrowLeft,
  Building2,
  KeyRound,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { createClient } from "@/lib/supabase/client";

interface ProjectDetail {
  id: string;
  name: string;
  title?: string;
  description?: string;
  status?: string;
  domain?: string;
  tech_stack?: string[];
  team_size?: number;
  metadata?: any;
  created_at?: string;
  client_passcode?: string;
}

interface RequirementItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  description?: string;
}

interface SprintItem {
  id: string;
  title?: string;
  name?: string;
  status: string;
  start_date?: string;
  end_date?: string;
}

export default function ClientDashboardPage() {
  const {
    clientSession,
    switchClientProject,
    getPortalConfig,
    meetings,
    approvals,
    submitApprovalDecision,
    messages,
  } = useClientPortal();

  // Project state
  const [assignedProjects, setAssignedProjects] = React.useState<ProjectDetail[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<"directory" | "workspace">("directory");
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(true);

  // Active project workspace details
  const [activeProject, setActiveProject] = React.useState<ProjectDetail | null>(null);
  const [requirements, setRequirements] = React.useState<RequirementItem[]>([]);
  const [sprints, setSprints] = React.useState<SprintItem[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [isLoadingWorkspace, setIsLoadingWorkspace] = React.useState(false);

  // 1. Load all projects the client is assigned to from Supabase
  React.useEffect(() => {
    async function loadClientProjects() {
      setIsLoadingProjects(true);
      try {
        const supabase = createClient() as any;
        const cleanEmail = clientSession?.client_email?.toLowerCase().trim();

        let projectsList: ProjectDetail[] = [];

        // Check project_clients table first
        if (cleanEmail) {
          const { data: assignments } = await supabase
            .from("project_clients")
            .select(`
              id,
              project_id,
              passcode,
              client_name,
              client_email,
              client_company,
              projects:project_id (
                id,
                name,
                description,
                status,
                domain,
                tech_stack,
                team_size,
                metadata,
                created_at
              )
            `)
            .eq("client_email", cleanEmail)
            .eq("is_active", true);

          if (assignments && assignments.length > 0) {
            projectsList = assignments
              .filter((a: any) => a.projects)
              .map((a: any) => ({
                id: a.projects.id,
                name: a.projects.name || "Assigned Project",
                description: a.projects.description,
                status: a.projects.status || "active",
                domain: a.projects.domain || "Enterprise Software",
                tech_stack: a.projects.tech_stack || [],
                team_size: a.projects.team_size || 6,
                metadata: a.projects.metadata || {},
                created_at: a.projects.created_at,
                client_passcode: a.passcode,
              }));
          }
        }

        // Fallback: If no email-specific assignment, fetch active projects from projects table
        if (projectsList.length === 0) {
          const { data: allProjects } = await supabase
            .from("projects")
            .select("*")
            .order("created_at", { ascending: false });

          if (allProjects && allProjects.length > 0) {
            projectsList = allProjects.map((p: any) => ({
              id: p.id,
              name: p.name || p.title || "Orion Project",
              description: p.description,
              status: p.status || "active",
              domain: p.domain || "FinTech & Cloud Systems",
              tech_stack: p.tech_stack || ["Next.js", "WebRTC", "Supabase", "TypeScript"],
              team_size: p.team_size || 8,
              metadata: p.metadata || {},
              created_at: p.created_at,
            }));
          }
        }

        setAssignedProjects(projectsList);

        // If client session already had an active project_id matching one of the projects, stay inside or prepare it
        const currentActiveId = clientSession?.project_id;
        const matched = projectsList.find((p) => p.id === currentActiveId);

        if (matched) {
          setSelectedProjectId(matched.id);
          setActiveProject(matched);
          // If they explicitly logged in for a single project, enter workspace directly
          if (projectsList.length === 1) {
            setViewMode("workspace");
          }
        } else if (projectsList.length > 0) {
          // Default to first project if none selected
          setSelectedProjectId(projectsList[0].id);
          setActiveProject(projectsList[0]);
        }
      } catch (err) {
        console.warn("Notice loading client projects:", err);
      } finally {
        setIsLoadingProjects(false);
      }
    }

    loadClientProjects();
  }, [clientSession?.client_email, clientSession?.project_id]);

  // 2. Load workspace details when inside a specific project
  React.useEffect(() => {
    async function loadWorkspaceDetails() {
      if (!selectedProjectId || selectedProjectId === "default") return;
      setIsLoadingWorkspace(true);
      try {
        const supabase = createClient() as any;

        const [projRes, reqRes, sprintRes, taskRes] = await Promise.allSettled([
          supabase.from("projects").select("*").eq("id", selectedProjectId).maybeSingle(),
          supabase.from("requirements").select("*").eq("project_id", selectedProjectId).order("priority"),
          supabase.from("sprints").select("*").eq("project_id", selectedProjectId).order("sprint_number"),
          supabase.from("tasks").select("*").eq("project_id", selectedProjectId),
        ]);

        if (projRes.status === "fulfilled" && projRes.value.data) {
          setActiveProject(projRes.value.data);
        }
        if (reqRes.status === "fulfilled" && reqRes.value.data) {
          setRequirements(reqRes.value.data);
        }
        if (sprintRes.status === "fulfilled" && sprintRes.value.data) {
          setSprints(sprintRes.value.data);
        }
        if (taskRes.status === "fulfilled" && taskRes.value.data) {
          setTasks(taskRes.value.data);
        }
      } catch (e) {
        console.warn("Notice loading workspace data:", e);
      } finally {
        setIsLoadingWorkspace(false);
      }
    }

    if (viewMode === "workspace" && selectedProjectId) {
      loadWorkspaceDetails();
    }
  }, [selectedProjectId, viewMode]);

  // Helper to enter a project
  const handleEnterProject = (p: ProjectDetail) => {
    setSelectedProjectId(p.id);
    setActiveProject(p);
    switchClientProject(p.id);
    setViewMode("workspace");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToDirectory = () => {
    setViewMode("directory");
  };

  const currentProjectId = selectedProjectId || "default";
  const config = getPortalConfig(currentProjectId);

  // Filter project-specific data
  const projectMeetings = meetings.filter(
    (m) => m.project_id === currentProjectId || currentProjectId === "default"
  );
  const projectApprovals = approvals.filter(
    (a) => a.project_id === currentProjectId || currentProjectId === "default"
  );
  const projectMessages = messages.filter(
    (m) => m.project_id === currentProjectId || currentProjectId === "default"
  );

  const upcomingMeeting = projectMeetings.find(
    (m) => m.status === "scheduled" || m.status === "live"
  );
  const pendingApprovals = projectApprovals.filter((a) => a.status === "pending");

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 70;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ═══════════════════════════════════════════════════════════════════════════
          VIEW 1: ASSIGNED PROJECTS DIRECTORY (Choose which project to go inside)
      ══════════════════════════════════════════════════════════════════════════════ */}
      {viewMode === "directory" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Executive Header */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 border border-zinc-800 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="h-6 px-2.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" /> Executive Access Portal
                  </span>
                  <span className="text-xs text-zinc-400">
                    Partner: <strong className="text-white">{clientSession?.client_name || "Client Lead"}</strong>
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Your Assigned Projects
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                  You have been assigned executive governance access to the following projects. Click{" "}
                  <strong className="text-indigo-300 font-bold">Enter Project Workspace</strong> to review deliverables, inspect confirmed requirements, join live video syncs, and approve milestones.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-zinc-800/80 p-3.5 rounded-2xl border border-zinc-700/60 flex-shrink-0">
                <Building2 className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Client Organization
                  </span>
                  <span className="text-xs font-bold text-white">
                    {clientSession?.client_company || "Apex Global Treasury"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {isLoadingProjects ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-zinc-200">
              <Circle className="h-6 w-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-500 font-semibold">Loading your assigned projects…</p>
            </div>
          ) : assignedProjects.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-zinc-200 space-y-3">
              <FolderKanban className="h-10 w-10 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-800">No Projects Assigned Yet</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Your Project Manager has not yet assigned you to a project workspace. Contact your engineering lead or verify your email credentials.
              </p>
              <Link
                href="/client/login"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>Switch Client Passcode</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {assignedProjects.map((p) => {
                const isSelected = p.id === selectedProjectId;
                const pUpcoming = meetings.find(
                  (m) => (m.project_id === p.id || p.id === "default") && (m.status === "live" || m.status === "scheduled")
                );

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all space-y-5"
                  >
                    {/* Top Row: Title, Status, and Domain */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-zinc-100">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-lg font-black text-zinc-900">{p.name}</h2>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {p.status ? p.status.toUpperCase() : "ACTIVE DELIVERY"}
                          </span>
                          {p.domain && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {p.domain}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 leading-relaxed font-medium mt-1">
                          {p.description || "Active project workspace with real-time video syncs, requirement specifications, and milestone sign-offs."}
                        </p>
                      </div>

                      {/* Primary CTA Button */}
                      <button
                        onClick={() => handleEnterProject(p)}
                        className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                      >
                        <span>Enter Project Workspace</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Middle Row: Tech Stack Pills & Project Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Tech Stack */}
                      <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider flex items-center gap-1">
                          <Code2 className="h-3 w-3 text-indigo-500" /> Technology Stack
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(p.tech_stack && p.tech_stack.length > 0
                            ? p.tech_stack
                            : ["Next.js 15", "WebRTC", "Supabase", "TypeScript"]
                          ).map((tech, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white border border-zinc-200 text-zinc-700"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Team & Target */}
                      <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider flex items-center gap-1">
                          <Users className="h-3 w-3 text-emerald-500" /> Delivery Team & Scope
                        </span>
                        <p className="text-zinc-800 font-semibold">
                          Dedicated Team: <strong className="text-indigo-600">{p.team_size || 8} Engineers</strong>
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Target Launch:{" "}
                          <strong className="text-zinc-700">
                            {p.metadata?.target_launch || "Q3 2026 Milestone Release"}
                          </strong>
                        </p>
                      </div>

                      {/* Video Sync & Live Room Status */}
                      <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider flex items-center gap-1">
                          <Video className="h-3 w-3 text-rose-500" /> Live Meeting Hub
                        </span>
                        {pUpcoming ? (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                              <Circle className="h-1.5 w-1.5 fill-emerald-600 animate-pulse" /> Live Room Ready
                            </span>
                            <p className="text-[11px] font-bold text-zinc-800 truncate">{pUpcoming.title}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-zinc-500">In-Website WebRTC Video Room ready anytime.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          VIEW 2: INSIDE PROJECT WORKSPACE (Deep-dive into the entered project)
      ══════════════════════════════════════════════════════════════════════════════ */}
      {viewMode === "workspace" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Top Breadcrumb & Switcher Bar */}
          <div className="flex items-center justify-between gap-3 bg-white p-3 sm:px-5 rounded-2xl border border-zinc-200 shadow-sm">
            <button
              onClick={handleBackToDirectory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Assigned Projects</span>
            </button>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 hidden sm:inline">Currently Inside:</span>
              <span className="font-bold text-zinc-900 bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl truncate max-w-xs sm:max-w-md">
                📁 {activeProject?.name || "NexusPay Treasury Hub"}
              </span>
            </div>
          </div>

          {/* Project Details Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-6 sm:p-8 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="h-6 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Confirmed Project Workspace
                  </span>
                  <span className="text-xs text-zinc-400">
                    Domain: <strong className="text-white">{activeProject?.domain || "FinTech & Cloud Systems"}</strong>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {activeProject?.name || "NexusPay — Cross-Border Treasury & WebRTC Clearing Hub"}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
                  {activeProject?.description ||
                    "Next-generation settlement platform featuring automated liquidity balancing, peer-to-peer WebRTC executive syncs, client milestone approvals, and sub-second clearing protocols."}
                </p>

                {/* Tech Stack Pills in Banner */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(activeProject?.tech_stack || ["Next.js 15", "WebRTC", "Supabase", "TypeScript"]).map((tech, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
                {upcomingMeeting && (
                  <Link
                    href={`/meetings/${upcomingMeeting.room_id}?role=client`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join In-Website Video Room</span>
                  </Link>
                )}

                {config.show_github && config.live_preview_url && (
                  <a
                    href={config.live_preview_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors border border-zinc-700"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Open Staging Preview</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Key Metrics Overview */}
          {config.show_overview && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
                <ProgressRing value={progressPercentage} size={60} strokeWidth={6} color="#6366f1" />
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Project Progress</p>
                  <h3 className="text-xl font-black text-zinc-900 mt-0.5">{progressPercentage}% Done</h3>
                  <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Active Sprint Delivery</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileSearch className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Requirements</p>
                  <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                    {requirements.length > 0 ? `${requirements.length} Specs` : "Verified"}
                  </h3>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">SRS Confirmed</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Sign-offs</p>
                  <h3 className="text-xl font-black text-zinc-900 mt-0.5">{pendingApprovals.length} Pending</h3>
                  <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Client Review</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Meetings</p>
                  <h3 className="text-xl font-black text-zinc-900 mt-0.5">
                    {projectMeetings.length} Sync{projectMeetings.length === 1 ? "" : "s"}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">In-Website Suite</p>
                </div>
              </div>
            </div>
          )}

          {/* Milestone Sign-off Gate */}
          {config.allow_approvals && projectApprovals.length > 0 && (
            <section className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-base font-black text-zinc-900">Milestone Approvals & Sign-offs</h2>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {pendingApprovals.length} Action Required
                </span>
              </div>

              <div className="space-y-3">
                {projectApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {item.category}
                        </span>
                        <h3 className="text-xs font-bold text-zinc-900">{item.title}</h3>
                        {item.status === "approved" && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="h-3 w-3" /> Approved
                          </span>
                        )}
                        {item.status === "revision_requested" && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <RotateCcw className="h-3 w-3" /> Revision Requested
                          </span>
                        )}
                      </div>
                      {item.description && <p className="text-xs text-zinc-600">{item.description}</p>}
                    </div>

                    {item.status === "pending" ? (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => submitApprovalDecision(item.id, "approved")}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => submitApprovalDecision(item.id, "revision_requested")}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Request Change</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-500 font-medium">Decided by {item.client_reviewer || "Client"}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sprint Roadmap & Milestones */}
          {config.show_sprints && (
            <section className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-600" />
                  <h2 className="text-base font-black text-zinc-900">Sprint Roadmap & Milestones</h2>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {sprints.length > 0 ? `${sprints.length} Sprints` : "Active"}
                </span>
              </div>

              {sprints.length === 0 ? (
                <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 text-center">
                  Active engineering sprint in progress. Milestones will appear here.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sprints.map((sprint, idx) => (
                    <div key={sprint.id || idx} className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-zinc-900">{sprint.title || sprint.name || `Sprint ${idx + 1}`}</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-indigo-100 text-indigo-700">
                          {sprint.status}
                        </span>
                      </div>
                      {sprint.start_date && (
                        <p suppressHydrationWarning className="text-[11px] text-zinc-400">
                          {new Date(sprint.start_date).toLocaleDateString()} - {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : "Ongoing"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SRS Requirements Specifications */}
          {config.show_requirements && requirements.length > 0 && (
            <section className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <FileSearch className="h-4 w-4 text-blue-600" />
                  <h2 className="text-base font-black text-zinc-900">SRS Scope & Specifications</h2>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  {requirements.length} Specs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {requirements.map((req) => (
                  <div key={req.id} className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-zinc-900">{req.title}</h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {req.status || "Confirmed"}
                      </span>
                    </div>
                    {req.description && <p className="text-xs text-zinc-600 leading-normal">{req.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* In-Website Video Meetings & Direct PM Messaging */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Video Meetings Widget */}
            {config.show_meetings && (
              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4 text-rose-600" />
                    <h3 className="text-sm font-bold text-zinc-900">In-Website Video Meetings</h3>
                  </div>
                  <Link href="/client/meetings" className="text-xs font-bold text-indigo-600 hover:underline">
                    View All Syncs →
                  </Link>
                </div>

                {upcomingMeeting ? (
                  <div className="p-4 rounded-xl bg-zinc-900 text-white space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <Circle className="h-2 w-2 fill-emerald-400 animate-pulse" /> Live Room Ready
                      </span>
                      <span className="text-xs text-zinc-400">Host: {upcomingMeeting.host_name}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{upcomingMeeting.title}</h4>
                      {upcomingMeeting.agenda && (
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{upcomingMeeting.agenda}</p>
                      )}
                    </div>
                    <Link
                      href={`/meetings/${upcomingMeeting.room_id}?role=client`}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                    >
                      <Video className="h-4 w-4" />
                      <span>Launch In-Website Video Room</span>
                    </Link>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
                    <p className="text-xs font-semibold text-zinc-600">No active meetings right now.</p>
                    <Link
                      href="/client/meetings"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                    >
                      <span>Request a Video Sync with PM →</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Direct PM Messages Widget */}
            {config.allow_direct_chat && (
              <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-zinc-900">Direct PM Messaging</h3>
                  </div>
                  <Link href="/client/messages" className="text-xs font-bold text-indigo-600 hover:underline">
                    Open Full Hub →
                  </Link>
                </div>

                {projectMessages.length === 0 ? (
                  <div className="p-6 text-center rounded-xl bg-zinc-50 border border-zinc-100 space-y-2">
                    <p className="text-xs font-semibold text-zinc-600">No message thread yet.</p>
                    <Link
                      href="/client/messages"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-sm"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Start Conversation with PM</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectMessages.slice(-2).map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          msg.sender_role === "pm"
                            ? "bg-indigo-50/60 border-indigo-100 text-zinc-800"
                            : "bg-zinc-50 border-zinc-200 text-zinc-800"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold mb-1">
                          <span className="text-zinc-900">{msg.sender_name}</span>
                          <span suppressHydrationWarning className="text-[10px] text-zinc-400 font-normal">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p>{msg.content}</p>
                      </div>
                    ))}

                    <Link
                      href="/client/messages"
                      className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                      <span>Reply to Project Manager</span>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
