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
  Circle,
  AlertCircle,
  Send,
  Download,
  CheckCircle2,
  Shield,
  Volume2,
  Sparkle,
  Radio,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useClientPortal } from "@/lib/contexts/client-portal-context";
import { ClientMeeting } from "@/lib/supabase/client-portal-types";
import { useMeetingTranscript } from "@/lib/hooks/use-meeting-transcript";

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
  role: "pm" | "client" | "system";
  text: string;
  time: string;
}

interface RoomParticipant {
  id: string;
  name: string;
  role: "pm" | "client";
  company?: string;
  joined_at: string;
  mic_on: boolean;
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
    clientSession,
  } = useClientPortal();

  // ── Directly fetch live meeting record from Supabase by room_id ──
  const [dbMeeting, setDbMeeting] = React.useState<ClientMeeting | null>(null);

  React.useEffect(() => {
    let active = true;
    const supabase = createClient() as any;

    supabase
      .from("client_meetings")
      .select("*")
      .eq("room_id", roomId)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (!error && data && active) {
          setDbMeeting(data);
          if (data.live_notes) setNotes(data.live_notes);
          if (data.ai_summary) setAiSummary(data.ai_summary);
          if (data.action_items) setActionItems(data.action_items);
        }
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  // ── Resolve current meeting from DB, props, or minimal fallback ──
  const currentMeeting = React.useMemo(() => {
    const found =
      dbMeeting ||
      initialMeeting ||
      meetings.find((m) => m.room_id === roomId || m.id === roomId);
    return (
      found || {
        id: roomId,
        project_id: "default",
        project_name: "Orion Project",
        title: "Client & PM Delivery Sync",
        room_id: roomId,
        scheduled_at: new Date().toISOString(),
        duration_minutes: 30,
        status: "live" as const,
        host_name: "Project Manager",
        client_attendee: "Client Lead",
        agenda: "",
        live_notes: "",
        ai_summary: "",
        action_items: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  }, [dbMeeting, initialMeeting, meetings, roomId]);

  // ── Dynamic display name from real session or prop ──
  const displayName = React.useMemo(() => {
    if (userName) return userName;
    if (userRole === "client" && clientSession?.client_name) {
      return `${clientSession.client_name} (Client)`;
    }
    return userRole === "pm" ? currentMeeting.host_name || "Project Manager" : "Client Lead";
  }, [userName, userRole, clientSession, currentMeeting]);

  const displayCompany = React.useMemo(() => {
    if (userRole === "client" && clientSession?.client_company) return clientSession.client_company;
    return userRole === "pm" ? "Orion Engineering" : "";
  }, [userRole, clientSession]);

  // ── Media state ──
  const [isMicOn, setIsMicOn] = React.useState(true);
  const [isVideoOn, setIsVideoOn] = React.useState(true);
  const [isScreenSharing, setIsScreenSharing] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"chat" | "notes" | "participants" | "transcript">("notes");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);
  const [notes, setNotes] = React.useState(currentMeeting.live_notes || "");
  const [aiSummary, setAiSummary] = React.useState(currentMeeting.ai_summary || "");
  const [actionItems, setActionItems] = React.useState<string[]>(currentMeeting.action_items || []);
  const [meetingEnded, setMeetingEnded] = React.useState(false);
  const [remoteVideoActive, setRemoteVideoActive] = React.useState(false);

  // ── Continuous live meeting transcription ──
  const {
    segments: transcriptSegments,
    interimText,
    isTranscribing,
    isSupported: isSpeechSupported,
    error: speechError,
    startTranscription,
    stopTranscription,
    consolidateToSource,
    fullTranscript,
    wordCount: transcriptWordCount,
    clearTranscript,
  } = useMeetingTranscript({
    meetingId: dbMeeting?.id || currentMeeting.id || null,
    projectId: dbMeeting?.project_id || currentMeeting.project_id || null,
    roomId,
    speakerName: displayName,
    speakerRole: userRole,
    enabled: isMicOn,
  });

  const [isConsolidatingTranscript, setIsConsolidatingTranscript] = React.useState(false);
  const [transcriptSavedSuccess, setTranscriptSavedSuccess] = React.useState(false);
  const [isTranscriptCopied, setIsTranscriptCopied] = React.useState(false);
  const transcriptEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll transcript container as speech occurs or finalizes
  React.useEffect(() => {
    if (activeTab === "transcript") {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcriptSegments, interimText, activeTab]);

  const handleConsolidateTranscript = async () => {
    setIsConsolidatingTranscript(true);
    try {
      const sourceId = await consolidateToSource();
      if (sourceId) {
        setTranscriptSavedSuccess(true);
        setTimeout(() => setTranscriptSavedSuccess(false), 3000);
      }
    } finally {
      setIsConsolidatingTranscript(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!fullTranscript) return;
    navigator.clipboard.writeText(fullTranscript);
    setIsTranscriptCopied(true);
    setTimeout(() => setIsTranscriptCopied(false), 2000);
  };

  // ── Live presence: real participants in this room ──
  const [participants, setParticipants] = React.useState<RoomParticipant[]>([]);

  // ── Live in-meeting chat (broadcast across both clients) ──
  const [chatMessages, setChatMessages] = React.useState<InMeetingChatMessage[]>([
    {
      id: "system-start",
      sender: "System",
      role: "system",
      text: `Encrypted in-browser meeting room started. Room ID: ${roomId}`,
      time: "Just now",
    },
  ]);
  const [inputMessage, setInputMessage] = React.useState("");
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // ── Refs ──
  const localVideoRef = React.useRef<HTMLVideoElement>(null);
  const remoteVideoRef = React.useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = React.useRef<HTMLVideoElement>(null);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const remoteStreamRef = React.useRef<MediaStream | null>(null);
  const screenStreamRef = React.useRef<MediaStream | null>(null);
  const presenceChannelRef = React.useRef<any>(null);
  const peerConnectionRef = React.useRef<RTCPeerConnection | null>(null);
  const makingOfferRef = React.useRef(false);
  const iceCandidateBuffer = React.useRef<RTCIceCandidateInit[]>([]);

  // ── Unique Peer Session ID (prevents collision if two clients or two PMs join) ──
  const peerId = React.useMemo(
    () => `${userRole}_${Math.random().toString(36).substring(2, 8)}_${Date.now()}`,
    [userRole]
  );
  const displayNameRef = React.useRef(displayName);
  displayNameRef.current = displayName;
  const userRoleRef = React.useRef(userRole);
  userRoleRef.current = userRole;

  // ── My participant record ──
  const myParticipant: RoomParticipant = React.useMemo(
    () => ({
      id: peerId,
      name: displayName,
      role: userRole,
      company: displayCompany,
      joined_at: new Date().toISOString(),
      mic_on: isMicOn,
    }),
    [peerId, displayName, userRole, displayCompany, isMicOn]
  );

  // ── Supabase Realtime: Presence + Broadcast (chat + WebRTC signaling) ──
  React.useEffect(() => {
    let active = true;
    const supabase = createClient() as any;

    const RTC_CONFIG: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
      ],
    };

    // ── Flush any buffered ICE candidates into the PC ──
    const flushIceCandidates = async (pc: RTCPeerConnection) => {
      while (iceCandidateBuffer.current.length > 0) {
        const candidate = iceCandidateBuffer.current.shift()!;
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch {
          // Stale candidate after flush — safe to ignore
        }
      }
    };

    // ── Create RTCPeerConnection (idempotent) ──
    const ensurePC = (): RTCPeerConnection => {
      if (peerConnectionRef.current) return peerConnectionRef.current;
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      // Add local tracks if stream is already available
      if (localStreamRef.current) {
        const senders = pc.getSenders();
        localStreamRef.current.getTracks().forEach((t) => {
          if (!senders.some((s) => s.track === t)) {
            pc.addTrack(t, localStreamRef.current!);
          }
        });
      }

      // Remote stream arrives → show remote video
      pc.ontrack = (event) => {
        if (!active) return;
        let stream = event.streams && event.streams[0];
        if (!stream) {
          if (!remoteStreamRef.current) {
            remoteStreamRef.current = new MediaStream();
          }
          remoteStreamRef.current.addTrack(event.track);
          stream = remoteStreamRef.current;
        } else {
          remoteStreamRef.current = stream;
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
        setRemoteVideoActive(true);
      };

      // ICE candidates → broadcast to peer
      pc.onicecandidate = (event) => {
        if (!active || !event.candidate) return;
        presenceChannelRef.current?.send({
          type: "broadcast",
          event: "webrtc_ice",
          payload: { candidate: event.candidate.toJSON(), from: peerId, role: userRole },
        });
      };

      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          if (active) setRemoteVideoActive(false);
        }
      };

      // Perfect negotiation: both peers can negotiate; glare resolved by polite/impolite roles
      pc.onnegotiationneeded = async () => {
        if (!active || makingOfferRef.current) return;
        try {
          makingOfferRef.current = true;
          const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
          if (pc.signalingState !== "stable") return;
          await pc.setLocalDescription(offer);
          presenceChannelRef.current?.send({
            type: "broadcast",
            event: "webrtc_offer",
            payload: { sdp: pc.localDescription, from: peerId, role: userRole },
          });
        } catch (err) {
          console.warn("WebRTC negotiation error:", err);
        } finally {
          makingOfferRef.current = false;
        }
      };

      return pc;
    };

    const channel = supabase.channel(`meeting-room-${roomId}`, {
      config: { presence: { key: peerId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        if (!active) return;
        const presenceState = channel.presenceState();
        const all: RoomParticipant[] = [];
        Object.values(presenceState).forEach((presences: any) => {
          if (Array.isArray(presences)) {
            presences.forEach((p: any) => {
              if (p.id !== peerId) all.push(p as RoomParticipant);
            });
          }
        });
        setParticipants(all);
        // Remote already in room when we arrived → set up peer connection
        if (all.length > 0) ensurePC();
      })
      .on("presence", { event: "join" }, ({ newPresences }: any) => {
        if (!active) return;
        if (Array.isArray(newPresences)) {
          newPresences.forEach((p: any) => {
            if (p.id !== peerId) {
              setParticipants((prev) => {
                if (prev.some((x) => x.id === p.id)) return prev;
                return [...prev, p as RoomParticipant];
              });
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `join-${p.id}-${Date.now()}`,
                  sender: "System",
                  role: "system",
                  text: `${p.name} joined the meeting.`,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
              // Remote just joined → create peer connection
              ensurePC();
            }
          });
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }: any) => {
        if (!active) return;
        if (Array.isArray(leftPresences)) {
          leftPresences.forEach((p: any) => {
            if (p.id !== peerId) {
              setParticipants((prev) => prev.filter((x) => x.id !== p.id));
              setRemoteVideoActive(false);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
              }
              remoteStreamRef.current = null;
              peerConnectionRef.current?.close();
              peerConnectionRef.current = null;
              setChatMessages((prev) => [
                ...prev,
                {
                  id: `leave-${p.id}-${Date.now()}`,
                  sender: "System",
                  role: "system",
                  text: `${p.name} left the meeting.`,
                  time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                },
              ]);
            }
          });
        }
      })
      // Live chat
      .on("broadcast", { event: "meeting_chat" }, (payload: any) => {
        if (!active) return;
        if (payload.payload?.sender !== displayNameRef.current) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === payload.payload?.id)) return prev;
            return [...prev, payload.payload];
          });
        }
      })
      // ── WebRTC Signaling (Perfect Negotiation) ──
      .on("broadcast", { event: "webrtc_offer" }, async (payload: any) => {
        if (!active || payload.payload?.from === peerId) return;
        try {
          const pc = ensurePC();
          const senderId = payload.payload?.from || "";
          const senderRole = payload.payload?.role;
          const isPolite =
            userRole === "client" && senderRole === "pm"
              ? true
              : userRole === "pm" && senderRole === "client"
              ? false
              : peerId > senderId;

          const offerCollision = makingOfferRef.current || pc.signalingState !== "stable";
          if (!isPolite && offerCollision) return;

          if (isPolite && offerCollision) {
            await pc.setLocalDescription({ type: "rollback" } as RTCLocalSessionDescriptionInit);
            makingOfferRef.current = false;
          }
          await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp));
          await flushIceCandidates(pc);
          if (pc.signalingState === "have-remote-offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            presenceChannelRef.current?.send({
              type: "broadcast",
              event: "webrtc_answer",
              payload: { sdp: pc.localDescription, from: peerId, role: userRole },
            });
          }
        } catch (err) {
          console.warn("WebRTC offer handling error:", err);
        }
      })
      .on("broadcast", { event: "webrtc_answer" }, async (payload: any) => {
        if (!active || payload.payload?.from === peerId) return;
        try {
          const pc = peerConnectionRef.current;
          if (pc && pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.payload.sdp));
            await flushIceCandidates(pc);
          }
        } catch (err) {
          console.warn("WebRTC answer error:", err);
        }
      })
      .on("broadcast", { event: "webrtc_ice" }, async (payload: any) => {
        if (!active || payload.payload?.from === peerId) return;
        try {
          const pc = peerConnectionRef.current;
          if (pc && payload.payload?.candidate) {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.payload.candidate));
            } else {
              iceCandidateBuffer.current.push(payload.payload.candidate);
            }
          }
        } catch {
          // Stale ICE candidates are benign
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED" && active) {
          await channel.track({
            id: peerId,
            name: displayNameRef.current,
            role: userRoleRef.current,
            company: displayCompany,
            joined_at: new Date().toISOString(),
            mic_on: isMicOn,
          });
        }
      });

    presenceChannelRef.current = channel;

    return () => {
      active = false;
      channel.untrack();
      supabase.removeChannel(channel);
      presenceChannelRef.current = null;
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
      remoteStreamRef.current = null;
    };
  }, [roomId, peerId]);

  // ── Broadcast mic state or display name changes ──
  React.useEffect(() => {
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({
        id: peerId,
        name: displayName,
        role: userRole,
        company: displayCompany,
        joined_at: myParticipant.joined_at,
        mic_on: isMicOn,
      });
    }
  }, [displayName, userRole, displayCompany, isMicOn, peerId, myParticipant.joined_at]);

  // ── Auto-scroll chat ──
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Initialize Camera/Mic and wire tracks into peer connection ──
  React.useEffect(() => {
    let active = true;

    async function startMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (active) {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
              localVideoRef.current.play().catch(() => {});
            }
            // If peer connection already exists (remote joined first), add tracks now.
            const pc = peerConnectionRef.current;
            if (pc) {
              const senders = pc.getSenders();
              stream.getTracks().forEach((t) => {
                if (!senders.some((s) => s.track === t)) {
                  pc.addTrack(t, stream);
                }
              });
            }
          }
        }
      } catch (err) {
        console.warn("Camera/mic permission denied or unavailable:", err);
      }
    }

    startMedia();
    updateMeetingStatus(roomId, "live");

    return () => {
      active = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  // ── Controls ──
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getVideoTracks()[0];
      if (track) track.enabled = !isVideoOn;
    }
    setIsVideoOn((v) => !v);
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) track.enabled = !isMicOn;
    }
    setIsMicOn((m) => !m);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = stream;
          stream.getVideoTracks()[0].onended = () => setIsScreenSharing(false);
          setIsScreenSharing(true);
        }
      } catch (err) {
        console.warn("Screen share cancelled:", err);
      }
    }
  };

  const copyRoomLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const inviteRole = userRole === "pm" ? "client" : "pm";
    const url = `${origin}/meetings/${roomId}?role=${inviteRole}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // ── Live in-meeting chat — broadcasts to all room participants ──
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const msg: InMeetingChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sender: displayName,
      role: userRole,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    // Add locally immediately
    setChatMessages((prev) => [...prev, msg]);
    setInputMessage("");

    // Broadcast to partner
    try {
      presenceChannelRef.current?.send({
        type: "broadcast",
        event: "meeting_chat",
        payload: msg,
      });
    } catch (err) {}
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
      notes || "Discussed sprint milestones, client feedback, and roadmap alignment."
    );
    setAiSummary(result.summary);
    setActionItems(result.action_items);
    setIsGeneratingAi(false);
  };

  const handleEndMeeting = async () => {
    try {
      await consolidateToSource();
    } catch (e) {
      console.warn("Could not auto-consolidate transcript on meeting end:", e);
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;
    setRemoteVideoActive(false);
    updateMeetingStatus(roomId, "completed");
    setMeetingEnded(true);
  };

  // ── Remote participant tile data ──
  const remoteParticipant = participants[0] ?? null;
  const remoteInitials = remoteParticipant
    ? remoteParticipant.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : null;

  // ── Meeting ended screen ──
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
            <h2 className="text-xl font-bold text-white">Meeting Ended & Transcripts Saved</h2>
            <p className="text-sm text-zinc-400 mt-1">
              Your meeting notes, continuous speech transcript ({transcriptWordCount} words, {transcriptSegments.filter(s => s.segment_index !== -1).length} utterances), and action items have been securely stored in the project requirements database for AI analysis.
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

          <button
            onClick={() => {
              if (onLeave) onLeave();
              else if (typeof window !== "undefined")
                window.location.href = userRole === "pm" ? "/dashboard/meetings" : "/client";
            }}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-indigo-600/20"
          >
            Return to {userRole === "pm" ? "PM Dashboard" : "Client Portal"}
          </button>
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
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800/80 rounded-lg text-xs text-zinc-300 border border-zinc-700/50">
            <Shield className="h-3.5 w-3.5 text-emerald-400" />
            <span>Encrypted WebRTC</span>
          </div>

          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-xs font-medium text-white transition-colors"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
            <span>{isCopied ? "Link Copied!" : "Copy Invite"}</span>
          </button>

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
          {isScreenSharing ? (
            <div className="w-full h-full flex flex-col gap-4">
              <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center">
                <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5">
                  <MonitorUp className="h-3.5 w-3.5 text-cyan-400" /> Screen Sharing Live
                </div>
              </div>

              {/* Mini participant tiles under screen share */}
              <div className="h-36 flex gap-3 justify-center">
                {/* Local */}
                <div className="w-48 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden relative shadow-lg">
                  {isVideoOn ? (
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800/80 text-zinc-400 text-xs font-medium">
                      Camera Off
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                    You ({userRole === "pm" ? "PM" : "Client"})
                  </div>
                </div>

                {/* Remote */}
                <div className="w-48 bg-zinc-900 border border-indigo-950 rounded-xl overflow-hidden relative shadow-lg">
                  {remoteParticipant ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 text-center">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mb-1 shadow-md">
                        {remoteInitials}
                      </div>
                      <p className="text-xs font-semibold text-white truncate max-w-full">{remoteParticipant.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Volume2 className="h-3 w-3 text-emerald-400 animate-pulse" />
                        <span className="text-[9px] text-emerald-400">Connected</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 text-xs">
                      <Circle className="h-4 w-4 mb-1 animate-pulse" />
                      Waiting for partner…
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                    {remoteParticipant ? (userRole === "pm" ? "Client" : "Project Manager") : "Connecting…"}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Grid View: Two equal tiles */
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl max-h-[700px] my-auto">
              {/* Tile 1: Local User */}
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
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
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 border border-white/10">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>You ({userRole === "pm" ? "Project Manager" : "Client"})</span>
                  {!isMicOn && <MicOff className="h-3 w-3 text-red-400 ml-1" />}
                </div>
              </div>

              {/* Tile 2: Remote Participant — live WebRTC video stream */}
              <div className="relative bg-zinc-900 border border-indigo-900/40 rounded-2xl overflow-hidden shadow-2xl">
                {/*
                  The <video> is always mounted so remoteVideoRef.current is available
                  when RTCPeerConnection.ontrack fires. Visibility is toggled via opacity.
                */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500 ${
                    remoteVideoActive ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Avatar / waiting overlay — fades out once live video arrives */}
                <div
                  className={`absolute inset-0 z-10 transition-opacity duration-500 ${
                    remoteVideoActive ? "opacity-0 pointer-events-none" : "opacity-100"
                  }`}
                >
                  {remoteParticipant ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900 to-indigo-950/40">
                      <div className="relative mb-4">
                        <div className="absolute -inset-3 rounded-full bg-indigo-500/20 blur-md animate-pulse" />
                        <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-2xl border border-white/20">
                          {remoteInitials}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 p-1.5 rounded-full border-2 border-zinc-900">
                          {remoteParticipant.mic_on ? (
                            <Mic className="h-3.5 w-3.5 text-white" />
                          ) : (
                            <MicOff className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                      </div>
                      <p className="text-base font-bold text-white">{remoteParticipant.name}</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {remoteParticipant.company
                          ? `${remoteParticipant.company} • ${remoteParticipant.role === "pm" ? "Project Manager" : "Client Lead"}`
                          : remoteParticipant.role === "pm"
                          ? "Project Manager"
                          : "Client Lead"}
                      </p>
                      <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-zinc-800/80 rounded-full border border-zinc-700/60 text-xs text-yellow-400">
                        <span className="flex gap-0.5 items-end h-3">
                          <span className="w-0.5 h-1.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-0.5 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-0.5 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                        <span className="text-[11px] font-medium">Connecting video…</span>
                      </div>
                    </div>
                  ) : (
                    /* Waiting for partner to join */
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-zinc-600 bg-zinc-900">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center animate-pulse">
                          <Users className="h-8 w-8 text-zinc-700" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-zinc-500">Waiting for partner to join…</p>
                        <p className="text-xs text-zinc-600 mt-1">Share the invite link for them to enter the room</p>
                      </div>
                      <button
                        onClick={copyRoomLink}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-medium transition-all ${
                          isCopied
                            ? "bg-emerald-600 border-emerald-500 text-white"
                            : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300"
                        }`}
                      >
                        {isCopied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{isCopied ? "Invite Link Copied!" : "Copy Room Invite Link"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Name label — always on top, colour indicates connection state */}
                {remoteParticipant && (
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-2 border border-white/10 z-20">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        remoteVideoActive ? "bg-emerald-400" : "bg-yellow-400 animate-pulse"
                      }`}
                    />
                    <span>
                      {remoteParticipant.name} ({remoteParticipant.role === "pm" ? "Project Manager" : "Client"})
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidepanel ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full bg-zinc-900 border-l border-zinc-800 flex flex-col overflow-hidden z-10"
            >
              {/* Tab Selector */}
              <div className="p-2 border-b border-zinc-800 flex gap-1 bg-zinc-900/90">
                {(["notes", "transcript", "chat", "participants"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 rounded-lg text-xs font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                    }`}
                  >
                    {tab === "notes" && <FileText className="h-3.5 w-3.5 shrink-0" />}
                    {tab === "transcript" && (
                      <Radio
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isTranscribing ? "text-emerald-300 animate-pulse" : ""
                        }`}
                      />
                    )}
                    {tab === "chat" && <MessageSquare className="h-3.5 w-3.5 shrink-0" />}
                    {tab === "participants" && <Users className="h-3.5 w-3.5 shrink-0" />}
                    <span className="truncate">
                      {tab === "notes" && "Notes"}
                      {tab === "transcript" && `Transcript${transcriptSegments.filter(s => s.segment_index !== -1).length ? ` (${transcriptSegments.filter(s => s.segment_index !== -1).length})` : ""}`}
                      {tab === "chat" && "Chat"}
                      {tab === "participants" && `(${participants.length + 1})`}
                    </span>
                  </button>
                ))}
              </div>

              {/* Tab: Notes & AI */}
              {activeTab === "notes" && (
                <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                  <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Meeting Agenda</p>
                    <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                      {currentMeeting.agenda || "No agenda set for this sync."}
                    </p>
                  </div>

                  <div className="flex-1 flex flex-col space-y-1.5 min-h-[140px]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-300">Live Meeting Notes</label>
                      <span className="text-[10px] text-zinc-500">Auto-saves to project</span>
                    </div>
                    <textarea
                      value={notes}
                      onChange={handleNotesChange}
                      placeholder="Type real-time takeaways, decisions, and discussion points here…"
                      className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed min-h-[120px]"
                    />
                  </div>

                  <div className="bg-gradient-to-br from-indigo-950/50 to-zinc-950 p-4 rounded-xl border border-indigo-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-200">AI Meeting Synthesizer</span>
                      </div>
                      <button
                        onClick={handleGenerateAiSummary}
                        disabled={isGeneratingAi}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
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

              {/* Tab: Continuous Live Transcript */}
              {activeTab === "transcript" && (
                <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
                  {/* Status & controls header */}
                  <div className="p-3 border-b border-zinc-800 bg-zinc-950/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          {isTranscribing && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          )}
                          <span
                            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                              isTranscribing ? "bg-emerald-500" : "bg-zinc-500"
                            }`}
                          />
                        </span>
                        <span className="text-xs font-semibold text-zinc-200">
                          {isTranscribing
                            ? "Continuous Capture Active"
                            : isMicOn
                            ? "Transcription Paused"
                            : "Microphone Muted"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50">
                          {transcriptWordCount} words
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700/50">
                          {transcriptSegments.length} turns
                        </span>
                      </div>
                    </div>

                    {speechError && (
                      <div className="text-[11px] bg-red-950/50 border border-red-800/50 text-red-300 p-2 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                        <span>{speechError}</span>
                      </div>
                    )}

                    {!isSpeechSupported && (
                      <div className="text-[11px] bg-amber-950/40 border border-amber-800/40 text-amber-300 p-2 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>Speech API requires Chrome, Edge, or Safari.</span>
                      </div>
                    )}

                    {/* Quick action bar */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        onClick={handleCopyTranscript}
                        disabled={transcriptSegments.length === 0}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 rounded-lg text-[11px] font-medium transition-colors"
                      >
                        {isTranscriptCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy All</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleConsolidateTranscript}
                        disabled={isConsolidatingTranscript || transcriptSegments.length === 0}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-[11px] font-medium transition-colors shadow-sm"
                      >
                        {isConsolidatingTranscript ? (
                          <>
                            <Sparkle className="h-3 w-3 animate-spin" />
                            <span>Saving…</span>
                          </>
                        ) : transcriptSavedSuccess ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-300" />
                            <span className="text-emerald-300">Pushed to AI!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 text-indigo-200" />
                            <span>Push to Requirements</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          if (isTranscribing) stopTranscription();
                          else startTranscription();
                        }}
                        className={`p-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                          isTranscribing
                            ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                            : "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"
                        }`}
                        title={isTranscribing ? "Pause transcribing" : "Resume transcribing"}
                      >
                        <Mic className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Transcript List */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                    {transcriptSegments.length === 0 && !interimText ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Radio className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-300">Continuous Transcripts</p>
                          <p className="text-[11px] text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
                            Speak normally into your microphone. Words are transcribed continuously in real time, tagged by speaker, and saved directly to the Orion requirements database for AI analysis.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {transcriptSegments.map((seg, idx) => {
                          const isSelf = seg.speaker_name === displayName;
                          return (
                            <div
                              key={seg.id || `seg-${idx}`}
                              className="rounded-xl p-2.5 text-xs bg-zinc-950 border border-zinc-800/80 transition-all shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                      seg.speaker_role === "pm"
                                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                        : seg.speaker_role === "client"
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                        : "bg-zinc-800 text-zinc-400"
                                    }`}
                                  >
                                    {seg.speaker_role.toUpperCase()}
                                  </span>
                                  <span className="font-semibold text-zinc-200 text-[11px]">
                                    {seg.speaker_name} {isSelf ? "(You)" : ""}
                                  </span>
                                </div>
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  {new Date(seg.started_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed text-zinc-200 select-text">
                                {seg.text}
                              </p>
                            </div>
                          );
                        })}

                        {/* Live streaming preview while speaker is talking */}
                        {interimText && (
                          <div className="rounded-xl p-2.5 text-xs bg-indigo-950/40 border border-indigo-500/40 animate-pulse">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  {userRole.toUpperCase()}
                                </span>
                                <span className="font-semibold text-zinc-200 text-[11px]">
                                  {displayName} (Speaking...)
                                </span>
                              </div>
                              <span className="text-[9px] text-indigo-400 font-mono flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping inline-block" />
                                Live
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-indigo-200 italic">
                              {interimText}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <div ref={transcriptEndRef} />
                  </div>
                </div>
              )}

              {/* Tab: Live Chat (Broadcast — synced across both sides) */}
              {activeTab === "chat" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          msg.role === "system"
                            ? "items-center"
                            : msg.sender === displayName
                            ? "items-end"
                            : "items-start"
                        }`}
                      >
                        {msg.role === "system" ? (
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
                              <span className="text-[10px] font-bold opacity-80">{msg.sender}</span>
                              <span className="text-[9px] opacity-60">{msg.time}</span>
                            </div>
                            <p className="leading-relaxed">{msg.text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <form onSubmit={handleSendChat} className="p-3 border-t border-zinc-800 flex gap-2 bg-zinc-900">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message…"
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

              {/* Tab: Participants (real-time presence) */}
              {activeTab === "participants" && (
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {/* Me */}
                  <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                        {displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{displayName}</p>
                        <p className="text-[10px] text-zinc-400">
                          {userRole === "pm" ? "Project Manager • Host" : `${displayCompany || "Client"} • Client Lead`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isMicOn && <MicOff className="h-3.5 w-3.5 text-red-400" />}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        userRole === "pm" ? "bg-indigo-500/20 text-indigo-300" : "bg-cyan-500/20 text-cyan-300"
                      }`}>
                        {userRole === "pm" ? "PM Lead" : "Client"} • You
                      </span>
                    </div>
                  </div>

                  {/* Real remote participants */}
                  {participants.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-zinc-600">
                      <Circle className="h-5 w-5 animate-pulse" />
                      <p className="text-xs font-semibold">Waiting for partner to join…</p>
                      <p className="text-[11px] text-center">Share the invite link so they can enter the room</p>
                    </div>
                  ) : (
                    participants.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                              p.role === "pm" ? "bg-indigo-600" : "bg-cyan-600"
                            }`}
                          >
                            {p.name
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{p.name}</p>
                            <p className="text-[10px] text-zinc-400">
                              {p.company ? `${p.company} • ` : ""}
                              {p.role === "pm" ? "Project Manager" : "Client Lead"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!p.mic_on && <MicOff className="h-3.5 w-3.5 text-red-400" />}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              p.role === "pm" ? "bg-indigo-500/20 text-indigo-300" : "bg-cyan-500/20 text-cyan-300"
                            }`}
                          >
                            {p.role === "pm" ? "PM Lead" : "Client"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bottom Control Dock ── */}
      <footer className="h-20 bg-zinc-900 border-t border-zinc-800 px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">{currentMeeting.title}</span>
            <span className="text-[11px] text-zinc-400">Encrypted Room • {roomId}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            onClick={handleEndMeeting}
            className="h-12 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-600/30 ml-2"
          >
            <PhoneOff className="h-4 w-4" />
            <span>Leave Meeting</span>
          </button>
        </div>

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
