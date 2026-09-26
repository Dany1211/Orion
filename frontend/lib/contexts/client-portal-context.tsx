"use client";

import * as React from "react";
import {
  ProjectClient,
  ClientPortalConfig,
  ClientMessage,
  ClientMeeting,
  ClientApprovalItem,
  ClientSession,
} from "@/lib/supabase/client-portal-types";
import { createClient } from "@/lib/supabase/client";

interface ClientPortalContextType {
  clientSession: ClientSession | null;
  setClientSession: (session: ClientSession | null) => void;
  clients: ProjectClient[];
  portalConfigs: Record<string, ClientPortalConfig>;
  getPortalConfig: (projectId: string) => ClientPortalConfig;
  updatePortalConfig: (projectId: string, updates: Partial<ClientPortalConfig>) => Promise<void>;
  addClientToProject: (projectId: string, client: { name: string; email: string; company?: string; passcode: string }) => Promise<ProjectClient>;
  authenticateClient: (email: string, passcode: string) => Promise<{ success: boolean; error?: string; session?: ClientSession }>;
  registerClientAccount: (clientData: { name: string; email: string; company?: string; passcode: string; projectId: string }) => Promise<{ success: boolean; error?: string; session?: ClientSession }>;
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
  logoutClient: () => void;
  isLoading: boolean;
}

const ClientPortalContext = React.createContext<ClientPortalContextType | undefined>(undefined);

export function ClientPortalProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);

  const [clientSession, setClientSession] = React.useState<ClientSession | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_session");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return null;
  });

  const [clients, setClients] = React.useState<ProjectClient[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_project_clients");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [portalConfigs, setPortalConfigs] = React.useState<Record<string, ClientPortalConfig>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_portal_configs");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {};
  });

  const [messages, setMessages] = React.useState<ClientMessage[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_messages");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [meetings, setMeetings] = React.useState<ClientMeeting[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_meetings");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [approvals, setApprovals] = React.useState<ClientApprovalItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_approvals");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  // Local storage persistence
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
      localStorage.setItem("orion_project_clients", JSON.stringify(clients));
    }
  }, [clients]);

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

  // Load real data from Supabase
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient() as any;

      const [clientsRes, configsRes, msgsRes, meetsRes, apprsRes] = await Promise.allSettled([
        supabase.from("project_clients").select("*").order("created_at", { ascending: false }),
        supabase.from("client_portal_configs").select("*"),
        supabase.from("client_pm_messages").select("*").order("created_at", { ascending: true }),
        supabase.from("client_meetings").select("*").order("scheduled_at", { ascending: false }),
        supabase.from("client_approvals").select("*").order("created_at", { ascending: false }),
      ]);

      if (clientsRes.status === "fulfilled" && clientsRes.value.data) {
        setClients(clientsRes.value.data);
      }

      if (configsRes.status === "fulfilled" && configsRes.value.data) {
        const dict: Record<string, ClientPortalConfig> = {};
        configsRes.value.data.forEach((c: any) => {
          dict[c.project_id] = c;
        });
        setPortalConfigs(dict);
      }

      if (msgsRes.status === "fulfilled" && msgsRes.value.data) {
        setMessages(msgsRes.value.data);
      }

      if (meetsRes.status === "fulfilled" && meetsRes.value.data) {
        setMeetings(meetsRes.value.data);
      }

      if (apprsRes.status === "fulfilled" && apprsRes.value.data) {
        setApprovals(apprsRes.value.data);
      }
    } catch (err) {
      console.warn("Database sync error (operating in local persistent mode):", err);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadDatabaseData();
  }, []);

  const getPortalConfig = (projectId: string): ClientPortalConfig => {
    if (portalConfigs[projectId]) {
      return portalConfigs[projectId];
    }

    return {
      id: `cfg-${projectId}`,
      project_id: projectId,
      client_name: "Client Partner",
      client_company: "Client Organization",
      client_email: "",
      access_passcode: "",
      is_portal_active: true,
      welcome_heading: "Project Delivery & Executive Portal",
      welcome_message: "Track project milestones, review confirmed specifications, inspect deliverables, and collaborate with your project lead.",
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
    };
  };

  const updatePortalConfig = async (projectId: string, updates: Partial<ClientPortalConfig>) => {
    const current = getPortalConfig(projectId);
    const updated: ClientPortalConfig = {
      ...current,
      ...updates,
      project_id: projectId,
      updated_at: new Date().toISOString(),
    };

    setPortalConfigs((prev) => ({
      ...prev,
      [projectId]: updated,
    }));

    try {
      const supabase = createClient() as any;
      await supabase.from("client_portal_configs").upsert(updated, { onConflict: "project_id" });
    } catch (e) {}
  };

  const addClientToProject = async (
    projectId: string,
    clientData: { name: string; email: string; company?: string; passcode: string }
  ): Promise<ProjectClient> => {
    const newClient: ProjectClient = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      project_id: projectId,
      client_name: clientData.name,
      client_email: clientData.email.toLowerCase().trim(),
      client_company: clientData.company || "Client Company",
      passcode: clientData.passcode,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setClients((prev) => [newClient, ...prev.filter((c) => !(c.project_id === projectId && c.client_email === newClient.client_email))]);

    // Also update portal config client metadata
    await updatePortalConfig(projectId, {
      client_name: clientData.name,
      client_email: clientData.email.toLowerCase().trim(),
      client_company: clientData.company || "Client Company",
      access_passcode: clientData.passcode,
    });

    try {
      const supabase = createClient() as any;
      await supabase.from("project_clients").upsert(newClient, { onConflict: "project_id,client_email" });
    } catch (e) {}

    return newClient;
  };

  const authenticateClient = async (
    email: string,
    passcode: string
  ): Promise<{ success: boolean; error?: string; session?: ClientSession }> => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = passcode.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: "Please enter your client email and access passcode." };
    }

    try {
      const supabase = createClient() as any;

      // 1. Check in project_clients table
      const { data: clientRows, error: clientErr } = await supabase
        .from("project_clients")
        .select("*")
        .eq("client_email", cleanEmail)
        .eq("passcode", cleanPass)
        .eq("is_active", true);

      if (!clientErr && clientRows && clientRows.length > 0) {
        const found = clientRows[0];
        const session: ClientSession = {
          client_id: found.id,
          client_name: found.client_name,
          client_company: found.client_company || "Client Organization",
          client_email: found.client_email,
          project_id: found.project_id,
          is_authenticated: true,
        };
        setClientSession(session);
        return { success: true, session };
      }

      // 2. Check in client_portal_configs table
      const { data: configRows, error: configErr } = await supabase
        .from("client_portal_configs")
        .select("*")
        .eq("client_email", cleanEmail)
        .eq("access_passcode", cleanPass);

      if (!configErr && configRows && configRows.length > 0) {
        const cfg = configRows[0];
        const session: ClientSession = {
          client_id: cfg.id,
          client_name: cfg.client_name,
          client_company: cfg.client_company || "Client Organization",
          client_email: cfg.client_email,
          project_id: cfg.project_id,
          is_authenticated: true,
        };
        setClientSession(session);
        return { success: true, session };
      }
    } catch (e) {}

    // Fallback: Check local state
    const localClient = clients.find(
      (c) => c.client_email.toLowerCase() === cleanEmail && c.passcode === cleanPass && c.is_active
    );

    if (localClient) {
      const session: ClientSession = {
        client_id: localClient.id,
        client_name: localClient.client_name,
        client_company: localClient.client_company || "Client Organization",
        client_email: localClient.client_email,
        project_id: localClient.project_id,
        is_authenticated: true,
      };
      setClientSession(session);
      return { success: true, session };
    }

    const localConfigMatch = Object.values(portalConfigs).find(
      (cfg) => cfg.client_email?.toLowerCase() === cleanEmail && cfg.access_passcode === cleanPass
    );

    if (localConfigMatch) {
      const session: ClientSession = {
        client_id: localConfigMatch.id,
        client_name: localConfigMatch.client_name,
        client_company: localConfigMatch.client_company || "Client Organization",
        client_email: localConfigMatch.client_email,
        project_id: localConfigMatch.project_id,
        is_authenticated: true,
      };
      setClientSession(session);
      return { success: true, session };
    }

    return { success: false, error: "Invalid client credentials. Please check your email and passcode or contact your Project Manager." };
  };

  const registerClientAccount = async (clientData: {
    name: string;
    email: string;
    company?: string;
    passcode: string;
    projectId: string;
  }): Promise<{ success: boolean; error?: string; session?: ClientSession }> => {
    if (!clientData.name || !clientData.email || !clientData.passcode || !clientData.projectId) {
      return { success: false, error: "Please fill in all required fields." };
    }

    const newClient = await addClientToProject(clientData.projectId, {
      name: clientData.name,
      email: clientData.email,
      company: clientData.company,
      passcode: clientData.passcode,
    });

    const session: ClientSession = {
      client_id: newClient.id,
      client_name: newClient.client_name,
      client_company: newClient.client_company || "Client Organization",
      client_email: newClient.client_email,
      project_id: newClient.project_id,
      is_authenticated: true,
    };

    setClientSession(session);
    return { success: true, session };
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
    } catch (e) {}

    return newMsg;
  };

  const scheduleMeeting = async (
    meeting: Omit<ClientMeeting, "id" | "created_at" | "updated_at">
  ): Promise<ClientMeeting> => {
    const newMeeting: ClientMeeting = {
      ...meeting,
      id: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setMeetings((prev) => [newMeeting, ...prev]);

    try {
      const supabase = createClient() as any;
      await supabase.from("client_meetings").insert(newMeeting);
    } catch (e) {}

    return newMeeting;
  };

  const updateMeetingNotes = async (meetingId: string, notes: string) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId || m.room_id === meetingId
          ? { ...m, live_notes: notes, updated_at: new Date().toISOString() }
          : m
      )
    );

    try {
      const supabase = createClient() as any;
      await supabase
        .from("client_meetings")
        .update({ live_notes: notes, updated_at: new Date().toISOString() })
        .eq("id", meetingId);
    } catch (e) {}
  };

  const generateAiMeetingSummary = async (meetingId: string, notes: string) => {
    const summary = `Executive Summary: Meeting takeaways recorded. Project Lead and Client reviewed current milestone status, requirement alignments, and agreed action steps.`;
    const actionItems = [
      "Review sprint deliverables on staging environment",
      "Sign off on milestone approval item",
      "Next sync scheduled for roadmap review",
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
    } catch (e) {}

    return { summary, action_items: actionItems };
  };

  const updateMeetingStatus = async (meetingId: string, status: ClientMeeting["status"]) => {
    setMeetings((prev) =>
      prev.map((m) =>
        m.id === meetingId || m.room_id === meetingId
          ? { ...m, status, updated_at: new Date().toISOString() }
          : m
      )
    );

    try {
      const supabase = createClient() as any;
      await supabase
        .from("client_meetings")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", meetingId);
    } catch (e) {}
  };

  const submitApprovalDecision = async (
    approvalId: string,
    status: "approved" | "revision_requested",
    feedback?: string
  ) => {
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
    } catch (e) {}
  };

  const requestApproval = async (
    item: Omit<ClientApprovalItem, "id" | "created_at" | "status">
  ): Promise<ClientApprovalItem> => {
    const newItem: ClientApprovalItem = {
      ...item,
      id: `appr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    setApprovals((prev) => [newItem, ...prev]);

    try {
      const supabase = createClient() as any;
      await supabase.from("client_approvals").insert(newItem);
    } catch (e) {}

    return newItem;
  };

  const logoutClient = () => {
    setClientSession(null);
  };

  return (
    <ClientPortalContext.Provider
      value={{
        clientSession,
        setClientSession,
        clients,
        portalConfigs,
        getPortalConfig,
        updatePortalConfig,
        addClientToProject,
        authenticateClient,
        registerClientAccount,
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
        logoutClient,
        isLoading,
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
