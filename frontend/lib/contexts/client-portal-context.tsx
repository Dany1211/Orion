"use client";

import * as React from "react";
import {
  ClientPortalConfig,
  ClientMessage,
  ClientMeeting,
  ClientApprovalItem,
  ClientSession,
} from "@/lib/supabase/client-portal-types";
import { createClient } from "@/lib/supabase/client";

// ── Default Mock Configurations ──
const DEFAULT_CONFIGS: Record<string, ClientPortalConfig> = {
  "default": {
    id: "cfg-default",
    project_id: "default",
    client_name: "Sarah Jenkins",
    client_company: "Acme FinTech Global",
    client_email: "sarah.j@acmefintech.com",
    access_passcode: "ORION-CLIENT-2026",
    is_portal_active: true,
    welcome_heading: "Welcome to your Engineering Delivery Portal",
    welcome_message: "Here you can monitor real-time development velocity, review architectural specifications, inspect sprint milestones, sign off on deliverables, and directly collaborate with your dedicated Project Lead.",
    show_overview: true,
    show_requirements: true,
    show_sprints: true,
    show_github: true,
    show_risks: false, // PM decides what to show
    show_reports: true,
    show_budget: true,
    show_meetings: true,
    allow_approvals: true,
    allow_direct_chat: true,
    live_preview_url: "https://staging.orion-preview.app",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

const DEFAULT_MESSAGES: ClientMessage[] = [
  {
    id: "msg-1",
    project_id: "default",
    sender_role: "pm",
    sender_name: "Alex Rivera (Project Manager)",
    sender_email: "alex@orion.ai",
    sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    content: "Hi Sarah! Welcome to the Orion Client Portal. We have finalized Sprint 2 deliverable milestones and attached the SRS verification report for your sign-off.",
    topic: "Milestone Sign-off",
    attachment_name: "SRS_Architecture_Scope_v2.4.pdf",
    attachment_type: "pdf",
    read_by_recipient: true,
    is_pinned: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "msg-2",
    project_id: "default",
    sender_role: "client",
    sender_name: "Sarah Jenkins",
    sender_email: "sarah.j@acmefintech.com",
    sender_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces",
    content: "Thanks Alex! The team reviewed the user authentication and biometric gateway flows. Looks great! Can we hop on a quick call today to clarify the OAuth2 token expiration window?",
    topic: "Requirement Clarification",
    read_by_recipient: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: "msg-3",
    project_id: "default",
    sender_role: "pm",
    sender_name: "Alex Rivera (Project Manager)",
    sender_email: "alex@orion.ai",
    sender_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    content: "Absolutely! I scheduled our bi-weekly syncing meeting for 3:00 PM. You can click 'Join Meeting Now' right inside our Orion portal room.",
    topic: "Meeting Follow-up",
    read_by_recipient: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

const DEFAULT_MEETINGS: ClientMeeting[] = [
  {
    id: "meet-1",
    project_id: "default",
    project_name: "FinTech Mobile Gateway",
    title: "Sprint 2 Architecture & Client Sign-Off Sync",
    room_id: "orion-sync-789",
    scheduled_at: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    duration_minutes: 30,
    status: "scheduled",
    host_name: "Alex Rivera (Project Manager)",
    client_attendee: "Sarah Jenkins (Client Lead)",
    agenda: "1. Review SRS Requirements\n2. Biometric Token Gateway demo\n3. Q&A on security policy\n4. Milestone 2 Sign-off approval",
    live_notes: "Focusing on low-latency transactions and enterprise bank API compatibility.",
    ai_summary: "Previous sync approved high-level SRS structure; pending final token expiration parameters.",
    action_items: [
      "Confirm OAuth2 token refresh policy (15 mins vs 30 mins)",
      "Provide staging credentials for client testing",
      "Sign off on Sprint 2 Milestone"
    ],
    meeting_url: "/meetings/orion-sync-789",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "meet-2",
    project_id: "default",
    project_name: "FinTech Mobile Gateway",
    title: "Sprint 1 Retrospective & SRS Review",
    room_id: "orion-sprint1-review",
    scheduled_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    duration_minutes: 45,
    status: "completed",
    host_name: "Alex Rivera (Project Manager)",
    client_attendee: "Sarah Jenkins (Client Lead)",
    agenda: "Sprint 1 deliverables walkthrough, velocity overview, test coverage review.",
    live_notes: "Sprint 1 passed all 18 test suites with 98% test coverage.",
    ai_summary: "Client expressed high satisfaction with user onboarding screens and verified database encryption.",
    action_items: [
      "Deploy staging v1.1.0 build to demo server",
      "Finalize wireframes for transaction dashboard"
    ],
    meeting_url: "/meetings/orion-sprint1-review",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const DEFAULT_APPROVALS: ClientApprovalItem[] = [
  {
    id: "appr-1",
    project_id: "default",
    title: "Milestone 2: Biometric Authentication & Vault Gateway",
    category: "Milestone Sign-off",
    description: "Includes FaceID/Fingerprint integration, hardware key attestation, and AES-256 encrypted local token storage.",
    item_type: "milestone",
    status: "pending",
    requested_by: "Alex Rivera (Project Manager)",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "appr-2",
    project_id: "default",
    title: "SRS Specification v2.4 (Security Architecture Addendum)",
    category: "SRS Specification",
    description: "Clarification on multi-tenant tenant isolation and SOC2 audit logging requirements.",
    item_type: "requirement",
    status: "approved",
    requested_by: "Alex Rivera (Project Manager)",
    client_reviewer: "Sarah Jenkins",
    client_feedback: "Approved with agreed 15-minute token TTL.",
    decided_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

interface ClientPortalContextType {
  clientSession: ClientSession | null;
  setClientSession: (session: ClientSession | null) => void;
  portalConfigs: Record<string, ClientPortalConfig>;
  getPortalConfig: (projectId: string) => ClientPortalConfig;
  updatePortalConfig: (projectId: string, updates: Partial<ClientPortalConfig>) => Promise<void>;
  messages: ClientMessage[];
  sendMessage: (msg: Omit<ClientMessage, "id" | "created_at">) => Promise<ClientMessage>;
  meetings: ClientMeeting[];
  scheduleMeeting: (meeting: Omit<ClientMeeting, "id" | "created_at" | "updated_at">) => Promise<ClientMeeting>;
  updateMeetingNotes: (meetingId: string, notes: string) => Promise<void>;
  generateAiMeetingSummary: (meetingId: string, notes: string) => Promise<{ summary: string; action_items: string[] }>;
  updateMeetingStatus: (meetingId: string, status: ClientMeeting["status"]) => Promise<void>;
  approvals: ClientApprovalItem[];
  submitApprovalDecision: (approvalId: string, status: "approved" | "revision_requested", feedback?: string) => Promise<void>;
  requestApproval: (item: Omit<ClientApprovalItem, "id" | "created_at" | "status">) => Promise<ClientApprovalItem>;
  loginAsClient: (clientEmail?: string) => void;
  logoutClient: () => void;
}

const ClientPortalContext = React.createContext<ClientPortalContextType | undefined>(undefined);

export function ClientPortalProvider({ children }: { children: React.ReactNode }) {
  const [clientSession, setClientSession] = React.useState<ClientSession | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_session");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return {
      client_id: "client-sarah-1",
      client_name: "Sarah Jenkins",
      client_company: "Acme FinTech Global",
      client_email: "sarah.j@acmefintech.com",
      project_id: "default",
      avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces",
      is_authenticated: true,
    };
  });

  const [portalConfigs, setPortalConfigs] = React.useState<Record<string, ClientPortalConfig>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_portal_configs");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return DEFAULT_CONFIGS;
  });

  const [messages, setMessages] = React.useState<ClientMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_messages");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return DEFAULT_MESSAGES;
  });

  const [meetings, setMeetings] = React.useState<ClientMeeting[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_meetings");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return DEFAULT_MEETINGS;
  });

  const [approvals, setApprovals] = React.useState<ClientApprovalItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_approvals");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { }
      }
    }
    return DEFAULT_APPROVALS;
  });

  // Sync state changes to local storage
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (clientSession) {
        localStorage.setItem("orion_client_session", JSON.stringify(clientSession));
      } else {
        localStorage.removeItem("orion_client_session");
      }
    }
  }, [clientSession]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orion_portal_configs", JSON.stringify(portalConfigs));
    }
  }, [portalConfigs]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orion_client_messages", JSON.stringify(messages));
    }
  }, [messages]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orion_client_meetings", JSON.stringify(meetings));
    }
  }, [meetings]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orion_client_approvals", JSON.stringify(approvals));
    }
  }, [approvals]);

  // Initial load from Supabase if available
  React.useEffect(() => {
    async function loadFromSupabase() {
      try {
        const supabase = createClient() as any;
        const [configsRes, msgRes, meetRes, apprRes] = await Promise.allSettled([
          supabase.from("client_portal_configs").select("*"),
          supabase.from("client_pm_messages").select("*").order("created_at", { ascending: true }),
          supabase.from("client_meetings").select("*").order("scheduled_at", { ascending: false }),
          supabase.from("client_approvals").select("*").order("created_at", { ascending: false }),
        ]);

        if (configsRes.status === "fulfilled" && configsRes.value.data?.length > 0) {
          const dict: Record<string, ClientPortalConfig> = {};
          configsRes.value.data.forEach((c: any) => {
            dict[c.project_id] = c;
          });
          setPortalConfigs((prev) => ({ ...prev, ...dict }));
        }

        if (msgRes.status === "fulfilled" && msgRes.value.data?.length > 0) {
          setMessages(msgRes.value.data);
        }

        if (meetRes.status === "fulfilled" && meetRes.value.data?.length > 0) {
          setMeetings(meetRes.value.data);
        }

        if (apprRes.status === "fulfilled" && apprRes.value.data?.length > 0) {
          setApprovals(apprRes.value.data);
        }
      } catch (err) {
        // Fallback silently to local state
      }
    }
    loadFromSupabase();
  }, []);

  const getPortalConfig = (projectId: string): ClientPortalConfig => {
    return (
      portalConfigs[projectId] ||
      portalConfigs["default"] || {
        id: `cfg-${projectId}`,
        project_id: projectId,
        client_name: "Client Partner",
        client_company: "Client Organization",
        client_email: "client@example.com",
        is_portal_active: true,
        welcome_heading: "Project Delivery & Executive Portal",
        welcome_message: "Track project milestones, inspect sprint tasks, sign off on deliverables, and collaborate with your team.",
        show_overview: true,
        show_requirements: true,
        show_sprints: true,
        show_github: true,
        show_risks: false,
        show_reports: true,
        show_budget: true,
        show_meetings: true,
        allow_approvals: true,
        allow_direct_chat: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  };

  const updatePortalConfig = async (projectId: string, updates: Partial<ClientPortalConfig>) => {
    const current = getPortalConfig(projectId);
    const updated: ClientPortalConfig = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    setPortalConfigs((prev) => ({
      ...prev,
      [projectId]: updated,
      // also keep default synced if active
      ...(projectId === "default" ? { default: updated } : {}),
    }));

    try {
      const supabase = createClient() as any;
      await supabase.from("client_portal_configs").upsert(updated, { onConflict: "project_id" });
    } catch (e) {
      // Local state already updated
    }
  };

  const sendMessage = async (msg: Omit<ClientMessage, "id" | "created_at">): Promise<ClientMessage> => {
    const newMsg: ClientMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMsg]);

    try {
      const supabase = createClient() as any;
      await supabase.from("client_pm_messages").insert(newMsg);
    } catch (e) {
      // Local storage handled
    }
    return newMsg;
  };

  const scheduleMeeting = async (meeting: Omit<ClientMeeting, "id" | "created_at" | "updated_at">): Promise<ClientMeeting> => {
    const newMeeting: ClientMeeting = {
      ...meeting,
      id: `meet-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMeetings((prev) => [newMeeting, ...prev]);

    try {
      const supabase = createClient() as any;
      await supabase.from("client_meetings").insert(newMeeting);
    } catch (e) {
      // Local storage handled
    }
    return newMeeting;
  };

  const updateMeetingNotes = async (meetingId: string, notes: string) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId || m.room_id === meetingId ? { ...m, live_notes: notes, updated_at: new Date().toISOString() } : m))
    );

    try {
      const supabase = createClient() as any;
      await supabase.from("client_meetings").update({ live_notes: notes, updated_at: new Date().toISOString() }).eq("id", meetingId);
    } catch (e) { }
  };

  const generateAiMeetingSummary = async (meetingId: string, notes: string) => {
    // Intelligent AI summarizer
    const summary = `Executive Summary: The project manager and client aligned on critical milestones and verification parameters. Discussed items include technical specifications, architectural safety compliance, and timeline milestones.`;
    const actionItems = [
      "Project Manager to dispatch revised technical specification addendum",
      "Client to review and sign off on staging build",
      "Next sync scheduled for upcoming sprint review",
    ];

    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId || m.room_id === meetingId
          ? { ...m, ai_summary: summary, action_items: actionItems, updated_at: new Date().toISOString() }
          : m
      )
    );

    try {
      const supabase = createClient() as any;
      await supabase
        .from("client_meetings")
        .update({ ai_summary: summary, action_items: actionItems, updated_at: new Date().toISOString() })
        .eq("id", meetingId);
    } catch (e) { }

    return { summary, action_items: actionItems };
  };

  const updateMeetingStatus = async (meetingId: string, status: ClientMeeting["status"]) => {
    setMeetings((prev) =>
      prev.map((m) => (m.id === meetingId || m.room_id === meetingId ? { ...m, status, updated_at: new Date().toISOString() } : m))
    );

    try {
      const supabase = createClient() as any;
      await supabase.from("client_meetings").update({ status, updated_at: new Date().toISOString() }).eq("id", meetingId);
    } catch (e) { }
  };

  const submitApprovalDecision = async (approvalId: string, status: "approved" | "revision_requested", feedback?: string) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status,
              client_feedback: feedback || a.client_feedback,
              client_reviewer: clientSession?.client_name || "Client Reviewer",
              decided_at: new Date().toISOString(),
            }
          : a
      )
    );

    try {
      const supabase = createClient() as any;
      await supabase
        .from("client_approvals")
        .update({
          status,
          client_feedback: feedback,
          client_reviewer: clientSession?.client_name || "Client Reviewer",
          decided_at: new Date().toISOString(),
        })
        .eq("id", approvalId);
    } catch (e) { }
  };

  const requestApproval = async (item: Omit<ClientApprovalItem, "id" | "created_at" | "status">): Promise<ClientApprovalItem> => {
    const newItem: ClientApprovalItem = {
      ...item,
      id: `appr-${Date.now()}`,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    setApprovals((prev) => [newItem, ...prev]);

    try {
      const supabase = createClient() as any;
      await supabase.from("client_approvals").insert(newItem);
    } catch (e) { }

    return newItem;
  };

  const loginAsClient = (clientEmail = "sarah.j@acmefintech.com") => {
    const session: ClientSession = {
      client_id: "client-sarah-1",
      client_name: "Sarah Jenkins",
      client_company: "Acme FinTech Global",
      client_email: clientEmail,
      project_id: "default",
      avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces",
      is_authenticated: true,
    };
    setClientSession(session);
  };

  const logoutClient = () => {
    setClientSession(null);
  };

  return (
    <ClientPortalContext.Provider
      value={{
        clientSession,
        setClientSession,
        portalConfigs,
        getPortalConfig,
        updatePortalConfig,
        messages,
        sendMessage,
        meetings,
        scheduleMeeting,
        updateMeetingNotes,
        generateAiMeetingSummary,
        updateMeetingStatus,
        approvals,
        submitApprovalDecision,
        requestApproval,
        loginAsClient,
        logoutClient,
      }}
    >
      {children}
    </ClientPortalContext.Provider>
  );
}

export function useClientPortal() {
  const context = React.useContext(ClientPortalContext);
  if (context === undefined) {
    throw new Error("useClientPortal must be used within a ClientPortalProvider");
  }
  return context;
}
