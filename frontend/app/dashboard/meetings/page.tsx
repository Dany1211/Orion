"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Plus,
  Calendar,
  Users,
  Sparkles,
  Copy,
  Check,
  Circle,
  FileText,
  Clock,
  PhoneCall,
  Trash2,
  CheckCircle2,
  Search,
  ExternalLink,
  ChevronRight,
  Square,
  AlertCircle,
  Radio,
  ArrowRight,
} from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ClientPortalProvider, useClientPortal } from "@/lib/contexts/client-portal-context";
import { ClientMeeting } from "@/lib/supabase/client-portal-types";

function MeetingsPageContent() {
  const router = useRouter();
  const { projects, activeProjectId } = useWorkspace();
  const {
    meetings,
    scheduleMeeting,
    updateMeetingStatus,
    deleteMeeting,
    projectClients,
  } = useClientPortal();

  // Tab State
  const [activeTab, setActiveTab] = React.useState<"live" | "scheduled" | "history">("live");

  // Filter & Modal State
  const [showScheduleModal, setShowScheduleModal] = React.useState(false);
  const [meetingTitle, setMeetingTitle] = React.useState("");
  const [meetingAgenda, setMeetingAgenda] = React.useState("");
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [durationMinutes, setDurationMinutes] = React.useState<number>(30);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(activeProjectId || (projects[0]?.id || "default"));
  const [copiedRoomId, setCopiedRoomId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedAttendee, setSelectedAttendee] = React.useState("");

  React.useEffect(() => {
    if (activeProjectId && activeProjectId !== "default") {
      setSelectedProjectId(activeProjectId);
    } else if (projects.length > 0 && (selectedProjectId === "default" || !projects.some((p) => p.id === selectedProjectId))) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activeProjectId, projects, selectedProjectId]);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || {
    id: selectedProjectId,
    title: projects[0]?.title || projects[0]?.name || "Active Project",
    name: projects[0]?.name || "Active Project",
  };

  const currentProjectClients = projectClients.filter((c) => c.project_id === selectedProjectId);
  const defaultClientName = currentProjectClients[0]?.client_name || "Client Lead";

  // Categorize meetings
  const projectMeetings = meetings.filter(
    (m) => m.project_id === selectedProjectId || selectedProjectId === "default"
  );

  const liveMeetings = projectMeetings.filter((m) => m.status === "live");
  const scheduledMeetings = projectMeetings.filter((m) => m.status === "scheduled");
  const completedMeetings = projectMeetings.filter((m) => m.status === "completed");

  // Switch to scheduled or history if no live meeting
  React.useEffect(() => {
    if (liveMeetings.length === 0 && scheduledMeetings.length > 0 && activeTab === "live") {
      setActiveTab("scheduled");
    }
  }, [liveMeetings.length, scheduledMeetings.length, activeTab]);

  const filteredHistory = completedMeetings.filter((m) => {
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      (m.client_attendee && m.client_attendee.toLowerCase().includes(q)) ||
      (m.agenda && m.agenda.toLowerCase().includes(q)) ||
      (m.live_notes && m.live_notes.toLowerCase().includes(q))
    );
  });

  const handleStartInstantMeeting = async () => {
    const roomId = `orion-sync-${Math.random().toString(36).substr(2, 6)}`;
    await scheduleMeeting({
      project_id: selectedProjectId,
      project_name: activeProject.title || activeProject.name,
      title: `Live Sync: ${activeProject.title || activeProject.name}`,
      room_id: roomId,
      scheduled_at: new Date().toISOString(),
      duration_minutes: 30,
      status: "live",
      host_name: "Project Lead",
      client_attendee: selectedAttendee || defaultClientName,
      agenda: "Instant live video conference and milestone alignment.",
      meeting_url: `/meetings/${roomId}?role=client`,
    });

    router.push(`/meetings/${roomId}?role=pm`);
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    const roomId = `orion-sync-${Math.random().toString(36).substr(2, 6)}`;
    await scheduleMeeting({
      project_id: selectedProjectId,
      project_name: activeProject.title || activeProject.name,
      title: meetingTitle.trim(),
      room_id: roomId,
      scheduled_at: scheduledDate || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      duration_minutes: durationMinutes,
      status: "scheduled",
      host_name: "Project Lead",
      client_attendee: selectedAttendee || defaultClientName,
      agenda: meetingAgenda || "Milestone reviews and technical roadmap alignment.",
      meeting_url: `/meetings/${roomId}?role=client`,
    });

    setShowScheduleModal(false);
    setMeetingTitle("");
    setMeetingAgenda("");
    setScheduledDate("");
    setActiveTab("scheduled");
  };

  const handleEndMeeting = async (meeting: ClientMeeting) => {
    await updateMeetingStatus(meeting.id, "completed");
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    await deleteMeeting(meetingId);
  };

  const copyMeetingInvite = (roomId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/meetings/${roomId}?role=client`;
    navigator.clipboard.writeText(url);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 2500);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">In-Website Video Meetings Suite</h1>
              <p className="text-xs text-zinc-500 font-medium">
                Real-time WebRTC client calls, automated minutes, and historical archives for <span className="font-bold text-zinc-800">{activeProject.title || activeProject.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Project Selector + Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-zinc-800 focus:outline-none focus:border-indigo-500 shadow-sm"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleStartInstantMeeting}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
          >
            <PhoneCall className="h-4 w-4" />
            <span>Start Instant Call</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* ── KPI Metrics Overview ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab("live")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "live"
              ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20"
              : "bg-white border-zinc-100 hover:border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Live Now</span>
            <span className={`h-2.5 w-2.5 rounded-full ${liveMeetings.length > 0 ? "bg-emerald-500 animate-ping" : "bg-zinc-300"}`} />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mt-2">{liveMeetings.length}</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            {liveMeetings.length > 0 ? "Active call in session" : "No active call"}
          </p>
        </div>

        <div
          onClick={() => setActiveTab("scheduled")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "scheduled"
              ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20"
              : "bg-white border-zinc-100 hover:border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Upcoming</span>
            <Calendar className="h-4 w-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mt-2">{scheduledMeetings.length}</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Scheduled syncs</p>
        </div>

        <div
          onClick={() => setActiveTab("history")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-violet-50/70 border-violet-300 ring-2 ring-violet-500/20"
              : "bg-white border-zinc-100 hover:border-zinc-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="h-4 w-4 text-violet-500" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mt-2">{completedMeetings.length}</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Historical minutes & logs</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-zinc-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Calls</span>
            <Users className="h-4 w-4 text-zinc-400" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900 mt-2">{projectMeetings.length}</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Lifetime project meetings</p>
        </div>
      </div>

      {/* ── Segmented Navigation Tabs ── */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200/80 pb-3 flex-wrap">
        <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "live"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span className="relative flex h-2 w-2">
              {liveMeetings.length > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveMeetings.length > 0 ? "bg-emerald-500" : "bg-zinc-400"}`} />
            </span>
            <span>Live Now ({liveMeetings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "scheduled"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Scheduled & Upcoming ({scheduledMeetings.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "history"
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Past History & Minutes ({completedMeetings.length})</span>
          </button>
        </div>

        {activeTab === "history" && (
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search meeting notes or attendee…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}
      </div>

      {/* ── TAB 1: LIVE MEETINGS (In Progress) ── */}
      {activeTab === "live" && (
        <div className="space-y-4">
          {liveMeetings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-zinc-200 space-y-4 shadow-sm">
              <div className="h-16 w-16 rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                <Radio className="h-8 w-8 text-zinc-400" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-zinc-900">No Video Call in Progress</h3>
                <p className="text-xs text-zinc-500">
                  You don&apos;t have an active meeting right now. Start an instant call to connect with your client in real time.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleStartInstantMeeting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Start Live Call Now</span>
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-xs font-bold text-zinc-700"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule for Later</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMeetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-xl shadow-emerald-500/10 space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        LIVE CALL IN SESSION
                      </span>
                      <button
                        onClick={() => copyMeetingInvite(m.room_id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 hover:text-indigo-600 transition-colors bg-zinc-50 hover:bg-indigo-50 px-3 py-1.5 rounded-xl border border-zinc-200"
                      >
                        {copiedRoomId === m.room_id ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Copy Client Link</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{m.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{m.agenda || "Real-time client delivery sync"}</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-zinc-400 block text-[10px] font-bold uppercase">Client Attendee</span>
                        <strong className="text-zinc-800 font-bold">{m.client_attendee || "Client Partner"}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-400 block text-[10px] font-bold uppercase">Room ID</span>
                        <span className="font-mono text-zinc-700 bg-zinc-200/80 px-2 py-0.5 rounded text-[11px] font-bold">{m.room_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 pt-2 border-t border-zinc-100">
                    <Link
                      href={`/meetings/${m.room_id}?role=pm`}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                    >
                      <Video className="h-4 w-4" />
                      <span>Enter Live Room</span>
                    </Link>

                    <button
                      onClick={() => handleEndMeeting(m)}
                      className="py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                      title="End this meeting and move it to past history"
                    >
                      <span>End Meeting</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SCHEDULED / UPCOMING MEETINGS ── */}
      {activeTab === "scheduled" && (
        <div className="space-y-4">
          {scheduledMeetings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-zinc-200 space-y-3">
              <Calendar className="h-10 w-10 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-800">No Upcoming Meetings Scheduled</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Schedule a future sync with your client to align on roadmaps, review sprint progress, or inspect deliverables.
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20"
              >
                <Plus className="h-4 w-4" />
                <span>Schedule a Meeting</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledMeetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> Scheduled Sync
                      </span>
                      <button
                        onClick={() => copyMeetingInvite(m.room_id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-indigo-600 transition-colors bg-zinc-50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-zinc-200"
                      >
                        {copiedRoomId === m.room_id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 text-zinc-400" />
                            <span>Copy Invite</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{m.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{m.agenda || "Project milestone sync"}</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-zinc-400 block text-[10px] font-bold uppercase">Scheduled Time</span>
                        <span className="font-semibold text-zinc-800">
                          {new Date(m.scheduled_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] font-bold uppercase">Client Attendee</span>
                        <span className="font-semibold text-zinc-800">{m.client_attendee || "Client"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                    <Link
                      href={`/meetings/${m.room_id}?role=pm`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-indigo-600/20"
                    >
                      <Video className="h-3.5 w-3.5" />
                      <span>Start Early / Open Room</span>
                    </Link>

                    <button
                      onClick={() => handleDeleteMeeting(m.id)}
                      className="p-2.5 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors border border-zinc-200"
                      title="Cancel this scheduled meeting"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: MEETING HISTORY & MINUTES (Ended Meetings) ── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-zinc-200 space-y-3">
              <FileText className="h-10 w-10 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-800">
                {searchQuery ? "No Past Meetings Match Your Search" : "No Past Meeting History Yet"}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Completed meetings with live notes, action items, and AI takeaways will automatically appear here once ended.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-3 hover:border-zinc-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2.5">
                      <span className="p-2 rounded-xl bg-zinc-100 text-zinc-600">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-900">{m.title}</h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span>
                            Conducted on:{" "}
                            {new Date(m.scheduled_at).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>•</span>
                          <span>Client: <strong className="text-zinc-700">{m.client_attendee || "Client"}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/meetings/${m.room_id}?role=pm`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Re-open Notes & Minutes</span>
                      </Link>

                      <button
                        onClick={() => handleDeleteMeeting(m.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete meeting record"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes & Summary Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Meeting Notes
                      </span>
                      <p className="text-zinc-700 line-clamp-3 whitespace-pre-line leading-relaxed">
                        {m.live_notes || "No notes were recorded during this session."}
                      </p>
                    </div>

                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="h-3 w-3" /> AI Summary & Action Items
                      </span>
                      <p className="text-zinc-700 line-clamp-2 leading-relaxed">
                        {m.ai_summary || "Automated AI summary was not generated."}
                      </p>
                      {m.action_items && m.action_items.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {m.action_items.map((action, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-white border border-indigo-200 px-2 py-0.5 rounded-md text-indigo-900 font-medium"
                            >
                              ✓ {action}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Schedule Meeting Modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-zinc-100 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <h3 className="text-base font-bold text-zinc-900">Schedule Video Sync</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-700">Meeting Topic / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sprint 3 Deliverable Review"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Client Attendee</label>
                {currentProjectClients.length > 0 ? (
                  <select
                    value={selectedAttendee}
                    onChange={(e) => setSelectedAttendee(e.target.value)}
                    className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 bg-white focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    {currentProjectClients.map((c) => (
                      <option key={c.id} value={c.client_name}>
                        {c.client_name} ({c.client_company || c.client_email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedAttendee}
                    onChange={(e) => setSelectedAttendee(e.target.value)}
                    placeholder="e.g. Client Partner Name"
                    className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Agenda / Discussion Points</label>
                <textarea
                  rows={3}
                  placeholder="1. Architecture walkthrough&#10;2. Milestone sign-off"
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 p-2.5 text-zinc-900 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20"
                >
                  Schedule Sync
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <ClientPortalProvider>
      <MeetingsPageContent />
    </ClientPortalProvider>
  );
}
