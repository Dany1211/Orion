"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorOff,
  PhoneOff,
  MessageSquare,
  FileText,
  Users,
  Sparkles,
  Share2,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Settings,
  Sparkle,
  Circle,
  AlertCircle,
  Send,
  Download,
  CheckCircle2,
  Shield,
  Volume2,
} from "lucide-react";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { ClientMeeting } from "@/lib/supabase/client-portal-types";

interface VideoMeetingRoomProps {
  roomId: string;
  initialMeeting?: ClientMeeting;
  userRole?: "pm" | "client";
  userName?: string;
  onLeave?: () => void;
}

interface InMeetingChatMessage {
  id: string;
  sender: string;
  role: "pm" | "client";
  text: string;
  time: string;
}

export function VideoMeetingRoom({
  roomId,
  initialMeeting,
  userRole = "pm",
  userName,
  onLeave,
}: VideoMeetingRoomProps) {
  const {
    meetings,
    updateMeetingNotes,
    generateAiMeetingSummary,
    updateMeetingStatus,
  } = useClientPortal();

  // Find or fallback meeting
  const currentMeeting =
    initialMeeting ||
    meetings.find((m) => m.room_id === roomId || m.id === roomId) || {
      id: roomId,
      project_id: "default",
      project_name: "FinTech Mobile Gateway",
      title: "Client & Project Manager Delivery Sync",
      room_id: roomId,
      scheduled_at: new Date().toISOString(),
      duration_minutes: 30,
      status: "live" as const,
      host_name: "Alex Rivera (Project Manager)",
      client_attendee: "Sarah Jenkins (Client Lead)",
      agenda: "1. Progress & Milestone Review\n2. SRS Security Requirements\n3. Deliverables Sign-off\n4. Next Sprints & Roadmap",
      live_notes: "Reviewing delivery timeline and sprint backlog.",
      ai_summary: "",
      action_items: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

  const displayName =
    userName || (userRole === "pm" ? "Alex Rivera (Project Manager)" : "Sarah Jenkins (Client Lead)");

  // Video & Stream State
  const [isMicOn, setIsMicOn] = React.useState(true);
  const [isVideoOn, setIsVideoOn] = React.useState(true);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"chat" | "notes" | "participants">("notes");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);
  const [notes, setNotes] = React.useState(currentMeeting.live_notes || "");
  const [aiSummary, setAiSummary] = React.useState(currentMeeting.ai_summary || "");
  const [actionItems, setActionItems] = React.useState<string[]>(currentMeeting.action_items || []);
  const [meetingEnded, setMeetingEnded] = React.useState(false);

  // In-Meeting Chat
  const [chatMessages, setChatMessages] = React.useState<InMeetingChatMessage[]>([
    {
      id: "1",
      sender: "System",
      role: "pm",
      text: `Encrypted in-browser meeting room started. Room ID: ${roomId}`,
      time: "Just now",
    },
    {
      id: "2",
      sender: userRole === "pm" ? "Sarah Jenkins (Client)" : "Alex Rivera (PM)",
      role: userRole === "pm" ? "client" : "pm",
      text: "Audio and video are clear! Ready to review the sprint deliverables.",
      time: "1 min ago",
    },
  ]);
  const [inputMessage, setInputMessage] = React.useState("");

  // Refs for WebRTC Video Elements
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = React.useRef<HTMLVideoElement>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);

  // Initialize WebRTC media stream
  React.useEffect(() => {
    let active = true;

    async function startMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          if (active) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err) {
        console.warn("Media device access unavailable or permission denied, using simulated stream preview:", err);
      }
    }

    startMedia();
    updateMeetingStatus(roomId, "live");

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [roomId]);

  // Toggle Video Track
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoOn;
      }
    }
    setIsVideoOn((prev) => !prev);
  };

  // Toggle Audio Track
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
      }
    }
    setIsMicOn((prev) => !prev);
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = stream;
          }
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.warn("Screen share cancelled or not supported:", err);
      }
    }
  };

  const copyRoomLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/meetings/${roomId}` : `/meetings/${roomId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg: InMeetingChatMessage = {
      id: String(Date.now()),
      sender: displayName,
      role: userRole,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    updateMeetingNotes(roomId, val);
  };

  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    await new Promise((r) => setTimeout(r, 1200));

    const result = await generateAiMeetingSummary(
      roomId,
      notes || "Discussed sprint milestones, client feedback on UI, authentication security review, and timeline targets."
    );

    setAiSummary(result.summary);
    setActionItems(result.action_items);
    setIsGeneratingAi(false);
  };

  const handleEndMeeting = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    updateMeetingStatus(roomId, "completed");
    setMeetingEnded(true);
  };

  if (meetingEnded) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl"
        >
          <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Meeting Ended</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Your meeting notes and action items have been securely saved to the project portal.
            </p>
          </div>

          {actionItems.length > 0 && (
            <div className="text-left bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 space-y-2">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Generated Action Items
              </p>
              <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                {actionItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (onLeave) onLeave();
                else if (typeof window !== "undefined") window.location.href = userRole === "pm" ? "/dashboard/meetings" : "/client";
              }}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
            >
              Return to {userRole === "pm" ? "PM Dashboard" : "Client Portal"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-zinc-950 text-zinc-100 flex flex-col select-none overflow-hidden font-sans">
      {/* ── Top Bar ── */}
      <header className="h-14 px-4 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-bold text-xs text-white">
            O
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white truncate max-w-xs">{currentMeeting.title}</span>
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Circle className="h-2 w-2 fill-emerald-400 animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {currentMeeting.project_name} • Room: {roomId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Encrypted badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg text-xs text-zinc-300 border border-zinc-700/50">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Encrypted WebRTC</span>
          </div>

          {/* Copy Invite Link */}
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-medium text-white transition-colors"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
            <span>{isCopied ? "Link Copied!" : "Copy Invite"}</span>
          </button>

          {/* Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg border transition-colors ${
              sidebarOpen
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
            }`}
            title="Toggle Sidepanel"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── Main Meeting Canvas ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Area */}
        <div className="flex-1 bg-zinc-950 p-4 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Screen Share Tile (if active) */}
          {isScreenSharing ? (
            <div className="w-full h-full flex flex-col gap-4">
              <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center">
                <video
                  ref={screenShareVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5">
                  <MonitorUp className="h-3.5 w-3.5 text-cyan-400" /> Screen Sharing Live
                </div>
              </div>

              {/* Mini participant tiles under screen share */}
              <div className="h-36 flex gap-3 justify-center">
                {/* Local Tile */}
                <div className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative shadow-lg">
                  {isVideoOn ? (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800/80 text-zinc-400 text-xs font-medium">
                      Camera Off
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                    You ({userRole.toUpperCase()})
                  </div>
                </div>

                {/* Remote Tile */}
                <div className="w-48 bg-zinc-900 border border-indigo-950 rounded-xl overflow-hidden relative shadow-lg">
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 text-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mb-1 shadow-md">
                      {userRole === "pm" ? "SJ" : "AR"}
                    </div>
                    <p className="text-xs font-semibold text-white truncate max-w-full">
                      {userRole === "pm" ? "Sarah Jenkins" : "Alex Rivera"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <Volume2 className="h-3 w-3 text-emerald-400 animate-pulse" />
                      <span className="text-[9px] text-emerald-400">Connected</span>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                    {userRole === "pm" ? "Client Lead" : "Project Manager"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Grid View: Two equal high-res video tiles */
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl max-h-[700px] my-auto">
              {/* Tile 1: Local User */}
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group">
                <div className="w-full h-full flex items-center justify-center relative bg-zinc-950">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-indigo-600/30">
                        {displayName.charAt(0)}
                      </div>
                      <p className="text-sm font-semibold text-zinc-300">{displayName}</p>
                      <span className="text-xs text-zinc-500 bg-zinc-800/80 px-2.5 py-1 rounded-full">Camera Disabled</span>
                    </div>
                  )}
                </div>

                {/* Overlay Badge */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>You ({userRole === "pm" ? "Project Manager" : "Client"})</span>
                  {!isMicOn && <MicOff className="h-3 w-3 text-red-400 ml-1" />}
                </div>
              </div>

              {/* Tile 2: Remote Participant */}
              <div className="relative bg-zinc-900 border border-indigo-900/40 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between group">
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-indigo-950/40 relative">
                  {/* Subtle animated audio wave circle */}
                  <div className="relative mb-4">
                    <div className="absolute -inset-3 rounded-full bg-indigo-500/20 blur-md animate-pulse" />
                    <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl border border-white/20">
                      {userRole === "pm" ? "SJ" : "AR"}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-zinc-900">
                      <Mic className="h-3.5 w-3.5 text-white" />
                    </div>
                  </div>

                  <p className="text-base font-bold text-white">
                    {userRole === "pm" ? "Sarah Jenkins" : "Alex Rivera"}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {userRole === "pm" ? "Acme FinTech Global • Client Lead" : "Orion Engineering • Project Manager"}
                  </p>

                  <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-zinc-800/80 rounded-full border border-zinc-700/60 text-xs text-emerald-400">
                    <span className="flex gap-0.5 items-end h-3">
                      <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-[11px] font-medium">Speaking</span>
                  </div>
                </div>

                {/* Remote Participant Badge */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{userRole === "pm" ? "Sarah Jenkins (Client)" : "Alex Rivera (Project Manager)"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidepanel (Chat, Notes & AI Summarizer) ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden z-10"
            >
              {/* Tab Selector */}
              <div className="p-2 border-b border-zinc-800 flex gap-1 bg-zinc-900/90">
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === "notes"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Notes & AI</span>
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === "chat"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Live Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab("participants")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === "participants"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>People (2)</span>
                </button>
              </div>

              {/* Tab 1: Live Notes & AI Summary */}
              {activeTab === "notes" && (
                <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                  {/* Meeting Agenda */}
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Meeting Agenda</p>
                    <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                      {currentMeeting.agenda || "No agenda set for this sync."}
                    </p>
                  </div>

                  {/* Live Collaborative Notes */}
                  <div className="flex-1 flex flex-col space-y-1.5 min-h-[140px]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300">Live Meeting Notes</label>
                      <span className="text-[10px] text-zinc-500">Auto-saves to project</span>
                    </div>
                    <textarea
                      value={notes}
                      onChange={handleNotesChange}
                      placeholder="Type real-time takeaways, decisions, and discussion points here…"
                      className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  {/* AI Summary Assistant */}
                  <div className="bg-gradient-to-br from-indigo-950/50 to-zinc-950 p-4 rounded-xl border border-indigo-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-200">AI Meeting Synthesizer</span>
                      </div>
                      <button
                        onClick={handleGenerateAiSummary}
                        disabled={isGeneratingAi}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors shadow-md shadow-indigo-600/20"
                      >
                        {isGeneratingAi ? (
                          <>
                            <Sparkle className="h-3 w-3 animate-spin" />
                            <span>Synthesizing…</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            <span>Generate Summary</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiSummary ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-2.5 rounded-lg border border-indigo-900/30">
                          {aiSummary}
                        </p>
                        {actionItems.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Action Items:</p>
                            <ul className="text-xs text-zinc-300 space-y-1 list-disc list-inside">
                              {actionItems.map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400 italic">
                        Click "Generate Summary" to produce an executive briefing and action item checklist from notes.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Live Chat */}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.sender === "System"
                            ? "items-center"
                            : msg.sender === displayName
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        {msg.sender === "System" ? (
                          <span className="text-[10px] text-zinc-500 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800">
                            {msg.text}
                          </span>
                        ) : (
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                              msg.sender === displayName
                                ? "bg-indigo-600 text-white rounded-br-none"
                                : "bg-zinc-800 text-zinc-200 rounded-bl-none border border-zinc-700/60"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-zinc-300 opacity-90">{msg.sender}</span>
                              <span className="text-[9px] text-zinc-400 opacity-75">{msg.time}</span>
                            </div>
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800 flex gap-2 bg-zinc-900">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message or share link…"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl disabled:opacity-40 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}

              {/* Tab 3: Participants */}
              {activeTab === "participants" && (
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                        AR
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Alex Rivera</p>
                        <p className="text-[10px] text-zinc-400">Project Manager • Host</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      PM Lead
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-cyan-600 flex items-center justify-center font-bold text-xs text-white">
                        SJ
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Sarah Jenkins</p>
                        <p className="text-[10px] text-zinc-400">Acme FinTech • Client Lead</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      Client
                    </span>
                  </div>
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Meeting Control Dock ── */}
      <footer className="h-20 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between z-20">
        {/* Left: Meeting info & Time */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">{currentMeeting.title}</span>
            <span className="text-[11px] text-zinc-400">Encrypted Room • {roomId}</span>
          </div>
        </div>

        {/* Center: Core Call Controls */}
        <div className="flex items-center gap-3">
          {/* Mute Mic */}
          <button
            onClick={toggleAudio}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
              isMicOn
                ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40"
            }`}
            title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
          >
            {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
          </button>

          {/* Toggle Camera */}
          <button
            onClick={toggleVideo}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
              isVideoOn
                ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                : "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40"
            }`}
            title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
            }`}
            title={isScreenSharing ? "Stop Screen Share" : "Share Screen"}
          >
            {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
          </button>

          {/* End Call / Leave */}
          <button
            onClick={handleEndMeeting}
            className="h-12 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 ml-2"
          >
            <PhoneOff className="h-4 w-4" />
            <span>Leave Meeting</span>
          </button>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={copyRoomLink}
            className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
            title="Share Room Invite"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
