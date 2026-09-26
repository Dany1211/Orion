"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ClientPortalProvider, useClientPortal } from "@/lib/contexts/client-portal-context";

function MeetingsPageContent() {
  const router = useRouter();
  const { projects, activeProjectId } = useWorkspace();
  const { meetings, scheduleMeeting, projectClients } = useClientPortal();

  const [showScheduleModal, setShowScheduleModal] = React.useState(false);
  const [meetingTitle, setMeetingTitle] = React.useState("");
  const [meetingAgenda, setMeetingAgenda] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(activeProjectId || (projects[0]?.id || "default"));
  const [copiedRoomId, setCopiedRoomId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (activeProjectId) {
      setSelectedProjectId(activeProjectId);
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [activeProjectId, projects]);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || {
    id: selectedProjectId,
    title: "Project",
    name: "Project",
  };

  const currentProjectClients = projectClients.filter((c) => c.project_id === selectedProjectId);
  const clientName = currentProjectClients[0]?.client_name || "Client Lead";

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
      client_attendee: clientName,
      agenda: "Instant live video conference and milestone alignment.",
      meeting_url: `/meetings/${roomId}`,
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
      scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      duration_minutes: 30,
      status: "scheduled",
      host_name: "Project Lead",
      client_attendee: clientName,
      agenda: meetingAgenda || "Milestone reviews and technical roadmap alignment.",
      meeting_url: `/meetings/${roomId}`,
    });

    setShowScheduleModal(false);
    setMeetingTitle("");
    setMeetingAgenda("");
  };

  const copyMeetingInvite = (roomId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/meetings/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 2500);
  };

  // Filter meetings for selected project
  const projectMeetings = meetings.filter(
    (m) => m.project_id === selectedProjectId || selectedProjectId === "default"
  );

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Video className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-zinc-900">In-Website Video Meetings Suite</h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Host live video conferences, collaborate on shared meeting notes, and auto-generate AI meeting summaries.
          </p>
        </div>

        {/* Project Selector + Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-indigo-500"
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span>Start Instant Video Call</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-xl text-xs font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Schedule Meeting</span>
          </button>
        </div>
      </div>

      {/* ── Meetings Grid ── */}
      {projectMeetings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-zinc-200 space-y-3">
          <div className="h-12 w-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Video className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">No Video Meetings for this Project</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Start an instant video call or schedule a sync with your client above.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projectMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className={`bg-white rounded-2xl p-6 border shadow-sm space-y-4 flex flex-col justify-between ${
                meeting.status === "live"
                  ? "border-emerald-300 ring-2 ring-emerald-500/10"
                  : "border-zinc-200"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                      meeting.status === "live"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : meeting.status === "scheduled"
                        ? "bg-indigo-100 text-indigo-800"
                        : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {meeting.status === "live" && <Circle className="h-2 w-2 fill-emerald-500 animate-pulse" />}
                    {meeting.status.toUpperCase()}
                  </span>

                  <button
                    onClick={() => copyMeetingInvite(meeting.room_id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-indigo-600 transition-colors bg-zinc-50 hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-zinc-200"
                  >
                    {copiedRoomId === meeting.room_id ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy Client Invite</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-900">{meeting.title}</h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed whitespace-pre-line">
                    {meeting.agenda || "Project velocity review and deliverable sync."}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      Client Attendee: <strong className="text-zinc-800">{meeting.client_attendee}</strong>
                    </span>
                  </div>
                  <span>
                    {new Date(meeting.scheduled_at).toLocaleDateString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {meeting.action_items && meeting.action_items.length > 0 && (
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-1.5">
                    <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> AI Meeting Takeaways & Actions:
                    </p>
                    <ul className="text-xs text-zinc-700 space-y-1 list-disc list-inside">
                      {meeting.action_items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href={`/meetings/${meeting.room_id}?role=pm`}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    meeting.status === "live"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span>
                    {meeting.status === "completed" ? "Re-open Room & Notes" : "Enter In-Website Video Room"}
                  </span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Schedule Modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-zinc-100 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Schedule Video Sync</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Project</label>
                <input
                  type="text"
                  disabled
                  value={activeProject.title || activeProject.name}
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 bg-zinc-50 text-zinc-700 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Sprint Deliverables Sign-off Sync"
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Meeting Agenda</label>
                <textarea
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  rows={3}
                  placeholder="1. Review SRS specifications&#10;2. Live staging demonstration&#10;3. Milestone approval"
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 p-2.5 text-zinc-900 focus:outline-none focus:border-indigo-500 resize-none"
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
                  Create & Schedule Room
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function PMVideoMeetingsPage() {
  return (
    <ClientPortalProvider>
      <MeetingsPageContent />
    </ClientPortalProvider>
  );
}
