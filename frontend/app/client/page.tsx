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
  FolderGit2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  Download,
  ThumbsUp,
  RotateCcw,
  Check,
  ChevronRight,
  TrendingUp,
  Circle,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { ProgressRing } from "@/components/dashboard/progress-ring";

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

  const [revisionFeedback, setRevisionFeedback] = React.useState<Record<string, string>>({});
  const [activeRevisionId, setActiveRevisionId] = React.useState<string | null>(null);

  const upcomingMeeting = meetings.find(
    (m) => m.status === "scheduled" || m.status === "live"
  );

  const pendingApprovals = approvals.filter((a) => a.status === "pending");
  const completedApprovals = approvals.filter((a) => a.status !== "pending");

  const unreadMessagesCount = messages.filter(
    (m) => m.sender_role === "pm" && !m.read_by_recipient
  ).length;

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner & Executive Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-zinc-900 via-indigo-950 to-zinc-900 text-white p-6 sm:p-8 border border-zinc-800 shadow-xl"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="h-6 px-2.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/30 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Project Delivery Portal
              </span>
              <span className="text-xs text-zinc-400">
                Partner: <span className="text-white font-semibold">{clientSession?.client_company || "Acme FinTech Global"}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {config.welcome_heading}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed">
              {config.welcome_message}
            </p>
          </div>

          {/* Quick Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 flex-shrink-0">
            {config.show_meetings && upcomingMeeting && (
              <Link
                href={`/meetings/${upcomingMeeting.room_id}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-500/25"
              >
                <Video className="h-4 w-4" />
                <span>Join Video Meeting Now</span>
              </Link>
            )}

            {config.live_preview_url && config.show_github && (
              <a
                href={config.live_preview_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors border border-zinc-700"
              >
                <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                <span>Open Live Staging App</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Executive KPI Overview Ring & Metric Grid (If show_overview is ON) ── */}
      {config.show_overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Progress Ring Card */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
            <ProgressRing value={74} size={64} strokeWidth={6} color="#6366f1" />
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Overall Progress</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">74% Complete</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">On track for Q4 delivery</p>
            </div>
          </div>

          {/* Sprint Velocity */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Delivery Velocity</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">94.2 pts/sprint</h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">Sprint 2 of 4 active</p>
            </div>
          </div>

          {/* Pending Sign-offs */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Client Sign-offs</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">{pendingApprovals.length} Pending</h3>
              <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Requires client review</p>
            </div>
          </div>

          {/* Target Launch */}
          <div className="bg-white rounded-2xl p-5 border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Target Launch</p>
              <h3 className="text-xl font-black text-zinc-900 mt-0.5">Nov 15, 2026</h3>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Release candidate ready</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Sign-off & Milestone Approvals Gate (If allow_approvals is ON) ── */}
      {config.allow_approvals && (
        <section id="approvals" className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <h2 className="text-base font-black text-zinc-900">Milestone Sign-offs & Approvals</h2>
              </div>
              <p className="text-xs text-zinc-500 font-medium mt-0.5">
                Review deliverables and sign off to unlock subsequent sprint milestones.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {pendingApprovals.length} Action Required
            </span>
          </div>

          <div className="space-y-3">
            {approvals.map((item) => (
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
                  <p className="text-xs text-zinc-600">{item.description}</p>
                  <p className="text-[10px] text-zinc-400">
                    Requested by <span className="font-semibold">{item.requested_by}</span> on{" "}
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                {item.status === "pending" ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => submitApprovalDecision(item.id, "approved")}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>Approve Milestone</span>
                    </button>

                    <button
                      onClick={() => setActiveRevisionId(activeRevisionId === item.id ? null : item.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-colors"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Request Change</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-right text-xs text-zinc-500">
                    <p className="font-semibold text-zinc-800">
                      Decided by {item.client_reviewer || "Client"}
                    </p>
                    {item.client_feedback && (
                      <p className="italic text-[11px] text-zinc-400">"{item.client_feedback}"</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Sprint Milestones & Roadmap (If show_sprints is ON) ── */}
      {config.show_sprints && (
        <section id="sprints" className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-black text-zinc-900">Sprint Delivery Roadmap</h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Continuous delivery milestone tracking and sprint targets.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              Sprint 2 Active (85% Done)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Sprint 1 */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Sprint 1 • Core Architecture</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Completed
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Database schema normalization, Supabase auth gateway, and tenant isolation policies.
              </p>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full w-full" />
              </div>
            </div>

            {/* Sprint 2 */}
            <div className="p-4 rounded-xl border border-indigo-300 bg-indigo-50/40 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Sprint 2 • Biometrics & Vault</span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded animate-pulse">
                  In Progress (85%)
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Hardware biometric key attestation, OAuth2 token rotation, and transaction encryption.
              </p>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-[85%]" />
              </div>
            </div>

            {/* Sprint 3 */}
            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-700">Sprint 3 • Analytics & Reports</span>
                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded">
                  Upcoming
                </span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Real-time transaction charts, automated monthly statements, and audit log exporters.
              </p>
              <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-zinc-400 h-full w-0" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Requirements & Scope (If show_requirements is ON) ── */}
      {config.show_requirements && (
        <section id="requirements" className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <FileSearch className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-black text-zinc-900">SRS Scope & Confirmed Requirements</h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Verified system specifications agreed upon with your engineering team.
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              18 Verified Specs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              {
                id: "REQ-01",
                title: "Multi-Factor & Biometric Authentication",
                type: "Functional",
                priority: "Critical",
                status: "Confirmed",
                desc: "FaceID and WebAuthn fingerprint support with encrypted biometric session handshakes.",
              },
              {
                id: "REQ-02",
                title: "SOC2 Compliance & Immutable Audit Log",
                type: "Non-Functional",
                priority: "Critical",
                status: "Confirmed",
                desc: "Read-only cryptographically signed transaction and administrative audit trail.",
              },
              {
                id: "REQ-03",
                title: "Sub-200ms Transaction Execution SLA",
                type: "Non-Functional",
                priority: "High",
                status: "Confirmed",
                desc: "Global edge-caching and database connection pooling to ensure 99.99% uptime.",
              },
              {
                id: "REQ-04",
                title: "Real-time Notification Webhook Engine",
                type: "Functional",
                priority: "High",
                status: "Confirmed",
                desc: "Instant event push to client backend endpoints upon transaction state transitions.",
              },
            ].map((req) => (
              <div key={req.id} className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700">
                      {req.id}
                    </span>
                    <h3 className="text-xs font-bold text-zinc-900">{req.title}</h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 leading-normal">{req.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Deliverables & PDF Reports (If show_reports is ON) ── */}
      {config.show_reports && (
        <section id="deliverables" className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-base font-black text-zinc-900">Project Deliverables & Reports</h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Download finalized architectural specifications, SRS PDFs, and audit summaries.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                title: "Software Requirement Specification v2.4",
                size: "4.8 MB",
                date: "Updated yesterday",
                file: "SRS_Architecture_Scope_v2.4.pdf",
              },
              {
                title: "Security & Penetration Test Audit",
                size: "2.1 MB",
                date: "Oct 12, 2026",
                file: "Penetration_Test_Report_v1.pdf",
              },
              {
                title: "Sprint 2 Architecture Diagram Spec",
                size: "1.4 MB",
                date: "Oct 18, 2026",
                file: "System_Architecture_Blueprint.pdf",
              },
            ].map((doc, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <h3 className="text-xs font-bold text-zinc-900">{doc.title}</h3>
                  <p className="text-[10px] text-zinc-400 mt-1">
                    {doc.size} • {doc.date}
                  </p>
                </div>
                <button className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800 transition-colors shadow-sm">
                  <Download className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Download Deliverable</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Two Columns: Video Meetings Suite & Direct PM Messaging ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meetings Widget (If show_meetings is ON) */}
        {config.show_meetings && (
          <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
                  <Video className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-zinc-900">In-Website Video Meetings</h3>
              </div>
              <Link href="/client/meetings" className="text-xs font-bold text-indigo-600 hover:underline">
                View All Syncs →
              </Link>
            </div>

            {upcomingMeeting ? (
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900 to-zinc-900 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-emerald-400 animate-pulse" /> Live Room Ready
                  </span>
                  <span className="text-xs text-zinc-400">
                    Host: {upcomingMeeting.host_name}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{upcomingMeeting.title}</h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{upcomingMeeting.agenda}</p>
                </div>

                <Link
                  href={`/meetings/${upcomingMeeting.room_id}`}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/30"
                >
                  <Video className="h-4 w-4" />
                  <span>Launch In-Website Video Call</span>
                </Link>
              </div>
            ) : (
              <p className="text-xs text-zinc-500">No scheduled video calls at the moment.</p>
            )}
          </div>
        )}

        {/* Direct PM Messaging Widget (If allow_direct_chat is ON) */}
        {config.allow_direct_chat && (
          <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-zinc-900">Direct Project Manager Messaging</h3>
              </div>
              <Link href="/client/messages" className="text-xs font-bold text-indigo-600 hover:underline">
                Open Full Hub →
              </Link>
            </div>

            <div className="space-y-3">
              {messages.slice(-2).map((msg) => (
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
                <span>Message Alex Rivera (PM)</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
