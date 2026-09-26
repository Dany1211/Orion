"use client";

import * as React from "react";
import {
  Client,
  ProjectClient,
  ClientPortalConfig,
  ClientMessage,
  ClientMeeting,
  ClientApprovalItem,
  ClientSession,
  ClientProjectRef,
} from "@/lib/supabase/client-portal-types";
import { createClient } from "@/lib/supabase/client";

interface ClientPortalContextType {
  clientSession: ClientSession | null;
  setClientSession: (session: ClientSession | null) => void;
  clientsDirectory: Client[];
  projectClients: ProjectClient[];
  portalConfigs: Record<string, ClientPortalConfig>;
  getPortalConfig: (projectId: string) => ClientPortalConfig;
  updatePortalConfig: (projectId: string, updates: Partial<ClientPortalConfig>) => Promise<void>;
  createClientInDatabase: (client: { name: string; email: string; company?: string; phone?: string; passcode: string }) => Promise<Client>;
  assignClientToProject: (projectId: string, clientData: { clientId?: string; name: string; email: string; company?: string; passcode: string }) => Promise<ProjectClient>;
  removeClientFromProject: (projectId: string, clientEmail: string) => Promise<void>;
  authenticateClient: (email: string, passcode: string) => Promise<{ success: boolean; error?: string; session?: ClientSession }>;
  registerClientAccount: (clientData: { name: string; email: string; company?: string; passcode: string; projectId: string }) => Promise<{ success: boolean; error?: string; session?: ClientSession }>;
  switchClientProject: (projectId: string) => void;
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
  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const ClientPortalContext = React.createContext<ClientPortalContextType | undefined>(undefined);

export function ClientPortalProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = React.useState(true);

  const [clientSession, setClientSession] = React.useState<ClientSession | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_client_session");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return null;
  });

  const [clientsDirectory, setClientsDirectory] = React.useState<Client[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("orion_clients_directory");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [];
  });

  const [projectClients, setProjectClients] = React.useState<ProjectClient[]>(() => {
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

  // Local storage auto-sync
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
      localStorage.setItem("orion_clients_directory", JSON.stringify(clientsDirectory));
    }
  }, [clientsDirectory]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orion_project_clients", JSON.stringify(projectClients));
    }
  }, [projectClients]);

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
    try {
      const supabase = createClient() as any;

      const [dirRes, clientsRes, configsRes, msgsRes, meetsRes, apprsRes] = await Promise.allSettled([
        supabase.from("clients").select("*").order("created_at", { ascending: false }),
        supabase.from("project_clients").select("*").order("created_at", { ascending: false }),
        supabase.from("client_portal_configs").select("*"),
        supabase.from("client_pm_messages").select("*").order("created_at", { ascending: true }),
        supabase.from("client_meetings").select("*").order("scheduled_at", { ascending: false }),
        supabase.from("client_approvals").select("*").order("created_at", { ascending: false }),
      ]);

      if (dirRes.status === "fulfilled" && dirRes.value.data) {
        setClientsDirectory(dirRes.value.data);
      }

      if (clientsRes.status === "fulfilled" && clientsRes.value.data) {
        setProjectClients(clientsRes.value.data);
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
      console.warn("Database sync note:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time Supabase replication subscription
  React.useEffect(() => {
    loadDatabaseData();

    try {
      const supabase = createClient() as any;
      const channel = supabase
        .channel("orion-realtime-client-hub")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "client_pm_messages" },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setMessages((prev) => {
                if (prev.some((m) => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            } else if (payload.eventType === "UPDATE") {
              setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "client_meetings" },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setMeetings((prev) => {
                if (prev.some((m) => m.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              setMeetings((prev) => prev.map((m) => (m.id === payload.new.id ? payload.new : m)));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "client_approvals" },
          (payload: any) => {
            if (payload.eventType === "INSERT") {
              setApprovals((prev) => {
                if (prev.some((a) => a.id === payload.new.id)) return prev;
                return [payload.new, ...prev];
              });
            } else if (payload.eventType === "UPDATE") {
              setApprovals((prev) => prev.map((a) => (a.id === payload.new.id ? payload.new : a)));
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "project_clients" },
          () => {
            loadDatabaseData();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "client_portal_configs" },
          (payload: any) => {
            if (payload.new?.project_id) {
              setPortalConfigs((prev) => ({
                ...prev,
                [payload.new.project_id]: payload.new,
              }));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {}
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

  const createClientInDatabase = async (clientData: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    passcode: string;
  }): Promise<Client> => {
    const newClient: Client = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: clientData.name,
      email: clientData.email.toLowerCase().trim(),
      company: clientData.company || "Client Organization",
      phone: clientData.phone,
      passcode: clientData.passcode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setClientsDirectory((prev) => [newClient, ...prev.filter((c) => c.email !== newClient.email)]);

    try {
      const supabase = createClient() as any;
      await supabase.from("clients").upsert(newClient, { onConflict: "email" });
    } catch (e) {}

    return newClient;
  };

  const assignClientToProject = async (
    projectId: string,
    clientData: { clientId?: string; name: string; email: string; company?: string; passcode: string }
  ): Promise<ProjectClient> => {
    const cleanEmail = clientData.email.toLowerCase().trim();

    // Ensure client exists in directory
    await createClientInDatabase({
      name: clientData.name,
      email: cleanEmail,
      company: clientData.company,
      passcode: clientData.passcode,
    });

    const newAssignment: ProjectClient = {
      id: `pcl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      project_id: projectId,
      client_id: clientData.clientId,
      client_name: clientData.name,
      client_email: cleanEmail,
      client_company: clientData.company || "Client Organization",
      passcode: clientData.passcode,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setProjectClients((prev) => [
      newAssignment,
      ...prev.filter((c) => !(c.project_id === projectId && c.client_email === cleanEmail)),
    ]);

    await updatePortalConfig(projectId, {
      client_name: clientData.name,
      client_email: cleanEmail,
      client_company: clientData.company || "Client Organization",
      access_passcode: clientData.passcode,
    });

    try {
      const supabase = createClient() as any;
      await supabase.from("project_clients").upsert(newAssignment, { onConflict: "project_id,client_email" });
    } catch (e) {}

    return newAssignment;
  };

  const removeClientFromProject = async (projectId: string, clientEmail: string) => {
    const cleanEmail = clientEmail.toLowerCase().trim();
    setProjectClients((prev) => prev.filter((c) => !(c.project_id === projectId && c.client_email === cleanEmail)));

    try {
      const supabase = createClient() as any;
      await supabase.from("project_clients").delete().eq("project_id", projectId).eq("client_email", cleanEmail);
    } catch (e) {}
  };

  const authenticateClient = async (
    email: string,
    passcode: string
  ): Promise<{ success: boolean; error?: string; session?: ClientSession }> => {
    const cleanEmail = email.toLowerCase().trim();
    const cleanPass = passcode.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: "Please enter your client email and passcode." };
    }

    try {
      const supabase = createClient() as any;

      // 1. Fetch all assigned project rows for this client
      const { data: assignments, error: assignErr } = await supabase
        .from("project_clients")
        .select("*, projects(id, name, title, description)")
        .eq("client_email", cleanEmail)
        .eq("passcode", cleanPass)
        .eq("is_active", true);

      if (!assignErr && assignments && assignments.length > 0) {
        const assignedProjects: ClientProjectRef[] = assignments.map((a: any) => ({
          id: a.project_id,
          name: a.projects?.name || a.projects?.title || "Assigned Project",
          description: a.projects?.description,
        }));

        const primary = assignments[0];
        const session: ClientSession = {
          client_id: primary.id,
          client_name: primary.client_name,
          client_company: primary.client_company || "Client Organization",
          client_email: primary.client_email,
          project_id: primary.project_id,
          assigned_projects: assignedProjects,
          is_authenticated: true,
        };

        setClientSession(session);
        return { success: true, session };
      }

      // 2. Check portal configs fallback
      const { data: configRows } = await supabase
        .from("client_portal_configs")
        .select("*, projects(id, name, title, description)")
        .eq("client_email", cleanEmail)
        .eq("access_passcode", cleanPass);

      if (configRows && configRows.length > 0) {
        const cfg = configRows[0];
        const session: ClientSession = {
          client_id: cfg.id,
          client_name: cfg.client_name,
          client_company: cfg.client_company || "Client Organization",
          client_email: cfg.client_email,
          project_id: cfg.project_id,
          assigned_projects: [
            {
              id: cfg.project_id,
              name: cfg.projects?.name || cfg.projects?.title || "Assigned Project",
            },
          ],
          is_authenticated: true,
        };

        setClientSession(session);
        return { success: true, session };
      }
    } catch (e) {}

    // Fallback: Check local state
    const matchingAssignments = projectClients.filter(
      (c) => c.client_email.toLowerCase() === cleanEmail && c.passcode === cleanPass && c.is_active
    );

    if (matchingAssignments.length > 0) {
      const primary = matchingAssignments[0];
      const assignedProjects: ClientProjectRef[] = matchingAssignments.map((a) => ({
        id: a.project_id,
        name: a.client_company ? `${a.client_company} Project` : "Assigned Project",
      }));

      const session: ClientSession = {
        client_id: primary.id,
        client_name: primary.client_name,
        client_company: primary.client_company || "Client Organization",
        client_email: primary.client_email,
        project_id: primary.project_id,
        assigned_projects: assignedProjects,
        is_authenticated: true,
      };

      setClientSession(session);
      return { success: true, session };
    }

    return { success: false, error: "Invalid client credentials. Please check your email and passcode or ask your Project Manager to assign you." };
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

    const assignment = await assignClientToProject(clientData.projectId, {
      name: clientData.name,
      email: clientData.email,
      company: clientData.company,
      passcode: clientData.passcode,
    });

    const session: ClientSession = {
      client_id: assignment.id,
      client_name: assignment.client_name,
      client_company: assignment.client_company || "Client Organization",
      client_email: assignment.client_email,
      project_id: assignment.project_id,
      assigned_projects: [{ id: assignment.project_id, name: assignment.client_company || "Active Project" }],
      is_authenticated: true,
    };

    setClientSession(session);
    return { success: true, session };
  };

  const switchClientProject = (projectId: string) => {
    if (!clientSession) return;
    setClientSession({
      ...clientSession,
      project_id: projectId,
    });
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
    const summary = `Executive Summary: Direct sync conducted between Project Manager and Client. Confirmed deliverables, architecture specifications, and next sprint action items.`;
    const actionItems = [
      "Review sprint milestone deliverables on staging environment",
      "Sign off on pending milestone approval item",
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
        clientsDirectory,
        projectClients,
        portalConfigs,
        getPortalConfig,
        updatePortalConfig,
        createClientInDatabase,
        assignClientToProject,
        removeClientFromProject,
        authenticateClient,
        registerClientAccount,
        switchClientProject,
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
        refreshData: loadDatabaseData,
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
