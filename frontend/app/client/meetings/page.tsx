"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
  Users,
  Circle,
  FileText,
  PhoneCall,
  Radio,
  ArrowRight,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";

export default function ClientMeetingsPage() {
  const { meetings, scheduleMeeting, clientSession } = useClientPortal();

  const [activeTab, setActiveTab] = React.useState<"live" | "scheduled" | "history">("live");
  const [showScheduleModal, setShowScheduleModal] = React.useState(false);
  const [meetingTitle, setMeetingTitle] = React.useState("");
  const [meetingAgenda, setMeetingAgenda] = React.useState("");
  const [scheduledTime, setScheduledTime] = React.useState("");

  const activeProjectId = clientSession?.project_id || "default";
  const currentProjectName =
    clientSession?.assigned_projects?.find((p) => p.id === activeProjectId)?.name ||
    clientSession?.client_company ||
    "Assigned Project";

  const projectMeetings = meetings.filter(
    (m) => m.project_id === activeProjectId || activeProjectId === "default"
  );

  const liveMeetings = projectMeetings.filter((m) => m.status === "live");
  const scheduledMeetings = projectMeetings.filter((m) => m.status === "scheduled");
  const completedMeetings = projectMeetings.filter((m) => m.status === "completed");

  React.useEffect(() => {
    if (liveMeetings.length === 0 && scheduledMeetings.length > 0 && activeTab === "live") {
      setActiveTab("scheduled");
    }
  }, [liveMeetings.length, scheduledMeetings.length, activeTab]);

  const handleRequestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    const roomId = `orion-sync-${Math.random().toString(36).substr(2, 6)}`;
    await scheduleMeeting({
      project_id: activeProjectId,
      project_name: currentProjectName,
      title: meetingTitle.trim(),
      room_id: roomId,
      scheduled_at: scheduledTime || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      duration_minutes: 30,
      status: "scheduled",
      host_name: "Lead Project Manager",
      client_attendee: clientSession?.client_name || "Client Lead",
      agenda: meetingAgenda || "Review milestone deliverables and technical roadmap.",
      meeting_url: `/meetings/${roomId}?role=client`,
    });

    setShowScheduleModal(false);
    setMeetingTitle("");
    setMeetingAgenda("");
    setScheduledTime("");
    setActiveTab("scheduled");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <Video className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-black text-zinc-900 tracking-tight">Project Video Meetings Suite</h1>
              <p className="text-xs text-zinc-500 font-medium">
                Live conferences with your Project Manager, shared notes, and AI meeting summaries.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Request Video Sync</span>
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl w-fit">
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
          <span>Live Call ({liveMeetings.length})</span>
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
          <span>Scheduled Syncs ({scheduledMeetings.length})</span>
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
          <span>Past Minutes & Notes ({completedMeetings.length})</span>
        </button>
      </div>

      {/* ── TAB 1: LIVE CALLS ── */}
      {activeTab === "live" && (
        <div className="space-y-4">
          {liveMeetings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-zinc-200 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-zinc-50 text-zinc-400 flex items-center justify-center mx-auto">
                <Radio className="h-7 w-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-sm font-bold text-zinc-900">No Video Call in Progress</h3>
                <p className="text-xs text-zinc-500">
                  When your Project Manager starts a call, it will appear here instantly so you can join with 1 click.
                </p>
              </div>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Request a Sync</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveMeetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl p-6 border-2 border-emerald-400 shadow-xl shadow-emerald-500/10 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        LIVE MEETING READY
                      </span>
                      <span className="text-xs text-zinc-400">Host: {m.host_name}</span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{m.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{m.agenda || "Real-time project alignment sync"}</p>
                    </div>
                  </div>

                  <Link
                    href={`/meetings/${m.room_id}?role=client`}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join Video Room Now</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: SCHEDULED MEETINGS ── */}
      {activeTab === "scheduled" && (
        <div className="space-y-4">
          {scheduledMeetings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-zinc-200 space-y-3">
              <Calendar className="h-10 w-10 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-800">No Upcoming Meetings Scheduled</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Need to discuss deliverables, sprint updates, or architecture? Request a video sync below.
              </p>
              <button
                onClick={() => setShowScheduleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Request Video Sync</span>
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
                        <Calendar className="h-3 w-3" /> Scheduled
                      </span>
                      <span className="text-[11px] text-zinc-500 font-medium">
                        {new Date(m.scheduled_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-zinc-900">{m.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{m.agenda || "Milestone reviews and technical roadmap."}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                      <span>Host: <strong className="text-zinc-800">{m.host_name}</strong></span>
                      <span>{m.duration_minutes || 30} Mins</span>
                    </div>
                  </div>

                  <Link
                    href={`/meetings/${m.room_id}?role=client`}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-indigo-600/20"
                  >
                    <Video className="h-4 w-4" />
                    <span>Open Room Link</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: PAST MINUTES & NOTES ── */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {completedMeetings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-zinc-200 space-y-3">
              <FileText className="h-10 w-10 text-zinc-300 mx-auto" />
              <h3 className="text-sm font-bold text-zinc-800">No Past Meeting Minutes</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Notes, deliverables discussed, and action items recorded during your meetings will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedMeetings.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-sm font-bold text-zinc-900">{m.title}</h4>
                      <span className="text-[11px] text-zinc-400">
                        ({new Date(m.scheduled_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })})
                      </span>
                    </div>

                    <Link
                      href={`/meetings/${m.room_id}?role=client`}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      View Minutes & Notes →
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 text-xs">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                        Meeting Notes
                      </span>
                      <p className="text-zinc-700 whitespace-pre-line line-clamp-3">
                        {m.live_notes || "No notes were recorded."}
                      </p>
                    </div>

                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Sparkles className="h-3 w-3" /> Action Items
                      </span>
                      {m.action_items && m.action_items.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.action_items.map((act, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-white border border-indigo-200 px-2 py-0.5 rounded text-indigo-900 font-medium"
                            >
                              ✓ {act}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-xs">No pending action items.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Request Meeting Modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-zinc-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Request Video Sync with PM</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleRequestMeeting} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-zinc-700">Topic / Purpose</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Design review & feedback"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Questions or Agenda</label>
                <textarea
                  rows={3}
                  placeholder="What would you like to review with the Project Manager?"
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
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
