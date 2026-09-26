"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Layers,
  FileSearch,
  CheckCircle2,
  Clock,
  Video,
  MessageSquare,
  FileSpreadsheet,
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
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { createClient } from "@/lib/supabase/client";

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status?: string;
  created_at?: string;
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
    getPortalConfig,
    meetings,
    approvals,
    submitApprovalDecision,
    messages,
  } = useClientPortal();

  const projectId = clientSession?.project_id || "default";
  const config = getPortalConfig(projectId);

  // Dynamic project details loaded from Supabase
  const [project, setProject] = React.useState<ProjectData | null>(null);
  const [requirements, setRequirements] = React.useState<RequirementItem[]>([]);
  const [sprints, setSprints] = React.useState<SprintItem[]>([]);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [reports, setReports] = React.useState<any[]>([]);
  const [isLoadingProject, setIsLoadingProject] = React.useState(true);

  // Load real project data from Supabase
  React.useEffect(() => {
    async function loadProjectDetails() {
      setIsLoadingProject(true);
      try {
        const supabase = createClient() as any;

        // Fetch project info
        const { data: projData } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projData) {
          setProject(projData);
        }

        // Parallel fetch requirements, sprints, tasks, reports
        const [reqRes, sprintRes, taskRes, reportRes] = await Promise.allSettled([
          supabase.from("requirements").select("*").eq("project_id", projectId),
          supabase.from("sprints").select("*").eq("project_id", projectId),
          supabase.from("tasks").select("*").eq("project_id", projectId),
          supabase.from("project_reports").select("*").eq("project_id", projectId),
        ]);

        if (reqRes.status === "fulfilled" && reqRes.value.data) {
          setRequirements(reqRes.value.data);
        }
        if (sprintRes.status === "fulfilled" && sprintRes.value.data) {
          setSprints(sprintRes.value.data);
        }
        if (taskRes.status === "fulfilled" && taskRes.value.data) {
          setTasks(taskRes.value.data);
        }
        if (reportRes.status === "fulfilled" && reportRes.value.data) {
          setReports(reportRes.value.data);
        }
      } catch (err) {
        console.warn("Could not load database project details:", err);
      } finally {
        setIsLoadingProject(false);
      }
    }

    if (projectId && projectId !== "default") {
      loadProjectDetails();
    } else {
      setIsLoadingProject(false);
    }
  }, [projectId]);

  // Calculate dynamic progress
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 65;

  // Filter project-specific meetings, approvals, and messages
  const projectMeetings = meetings.filter(
    (m) => m.project_id === projectId || projectId === "default"
  );
  const projectApprovals = approvals.filter(
    (a) => a.project_id === projectId || projectId === "default"
  );
  const projectMessages = messages.filter(
    (m) => m.project_id === projectId || projectId === "default"
  );

  const upcomingMeeting = projectMeetings.find(
    (m) => m.status === "scheduled" || m.status === "live"
  );
  const pendingApprovals = projectApprovals.filter((a) => a.status === "pending");

  const displayProjectTitle =
    project?.name || config.client_company || "Your Active Project";
  const displayDescription =
    project?.description || config.welcome_message;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Executive Project Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-zinc-900 text-white p-6 sm:p-8 border border-zinc-800 shadow-xl"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-6 px-2.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Project Delivery Portal
              </span>
              <span className="text-xs text-zinc-400">
                Organization: <strong className="text-white">{clientSession?.client_company || "Client Organization"}</strong>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {displayProjectTitle}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
              {displayDescription}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
            {config.show_meetings && upcomingMeeting && (
              <Link
                href={`/meetings/${upcomingMeeting.room_id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                <Video className="h-4 w-4" />
                <span>Join Live Video Room</span>
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
      </motion.div>

      {/* ── Key Metrics Overview ── */}
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

      {/* ── Milestone Sign-off Gate (if allow_approvals) ── */}
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

      {/* ── Sprint Roadmap (if show_sprints) ── */}
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
                    <p className="text-[11px] text-zinc-400">
                      {new Date(sprint.start_date).toLocaleDateString()} - {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : "Ongoing"}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SRS Requirements (if show_requirements) ── */}
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

      {/* ── Two Columns: In-Website Video Meetings & Direct PM Messaging ── */}
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
                  href={`/meetings/${upcomingMeeting.room_id}`}
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
                      <span className="text-[10px] text-zinc-400 font-normal">
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
    </div>
  );
}
