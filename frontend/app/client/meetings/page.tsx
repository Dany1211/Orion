"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Video,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  Plus,
  Users,
  ExternalLink,
  Circle,
  FileText,
  Share2,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";

export default function ClientMeetingsPage() {
  const { meetings, scheduleMeeting, clientSession } = useClientPortal();

  const [showScheduleModal, setShowScheduleModal] = React.useState(false);
  const [meetingTitle, setMeetingTitle] = React.useState("");
  const [meetingAgenda, setMeetingAgenda] = React.useState("");
  const [scheduledTime, setScheduledTime] = React.useState("");

  const handleRequestMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return;

    const roomId = `orion-sync-${Math.random().toString(36).substr(2, 6)}`;
    await scheduleMeeting({
      project_id: clientSession?.project_id || "default",
      project_name: "FinTech Mobile Gateway",
      title: meetingTitle.trim(),
      room_id: roomId,
      scheduled_at: scheduledTime || new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      duration_minutes: 30,
      status: "scheduled",
      host_name: "Alex Rivera (Project Manager)",
      client_attendee: clientSession?.client_name || "Sarah Jenkins (Client)",
      agenda: meetingAgenda || "Requested sync to discuss deliverables and upcoming sprint roadmap.",
      meeting_url: `/meetings/${roomId}`,
    });

    setShowScheduleModal(false);
    setMeetingTitle("");
    setMeetingAgenda("");
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
              <Video className="h-4 w-4" />
            </span>
            <h1 className="text-lg font-black text-zinc-900">In-Website Video Meetings Suite</h1>
          </div>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Conduct secure live video conferences, review architecture, and inspect AI-synthesized meeting action items with your PM.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors shadow-md shadow-indigo-600/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Request Video Sync</span>
          </button>
        </div>
      </div>

      {/* ── Meetings Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetings.map((meeting) => (
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

                <span className="text-[11px] text-zinc-400 font-medium">
                  {new Date(meeting.scheduled_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-zinc-900">{meeting.title}</h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed whitespace-pre-line">
                  {meeting.agenda || "Regular project velocity and sprint review sync."}
                </p>
              </div>

              {/* Host & Attendees */}
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-between text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Host: <strong className="text-zinc-800">{meeting.host_name}</strong></span>
                </div>
                <span>30 Mins</span>
              </div>

              {/* AI Action Items if available */}
              {meeting.action_items && meeting.action_items.length > 0 && (
                <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                  <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI Action Items
                  </p>
                  <ul className="text-xs text-zinc-700 space-y-1 list-disc list-inside">
                    {meeting.action_items.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href={`/meetings/${meeting.room_id}`}
                className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  meeting.status === "live"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20"
                }`}
              >
                <Video className="h-4 w-4" />
                <span>
                  {meeting.status === "completed" ? "Re-enter Meeting Room" : "Join In-Website Video Room"}
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* ── Request Meeting Modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-zinc-100 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-base font-bold text-zinc-900">Request Video Meeting with PM</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-700 font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleRequestMeeting} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700">Meeting Subject</label>
                <input
                  type="text"
                  required
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder="e.g. Sprint 2 Feedback & Roadmap Sync"
                  className="mt-1 w-full text-xs rounded-xl border border-zinc-200 px-3 py-2 text-zinc-900 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700">Agenda Topics</label>
                <textarea
                  value={meetingAgenda}
                  onChange={(e) => setMeetingAgenda(e.target.value)}
                  rows={3}
                  placeholder="Points you'd like to discuss with Project Lead Alex Rivera…"
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
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
