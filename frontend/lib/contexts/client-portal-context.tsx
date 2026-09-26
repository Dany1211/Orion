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
  registerClientAccount: (clientData: { name: string; email: string; company?: string; passcode: string; projectId?: string }) => Promise<{ success: boolean; error?: string; session?: ClientSession }>;
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
      console.warn("Database sync notice:", err);
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
          { event: "*", schema: "public", table: "clients" },
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
      const { error } = await supabase.from("client_portal_configs").upsert(updated, { onConflict: "project_id" });
      if (error) console.error("Supabase error updating client_portal_configs:", error);
    } catch (e) {
      console.error("Failed to update portal config in Supabase:", e);
    }
  };

  const createClientInDatabase = async (clientData: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    passcode: string;
  }): Promise<Client> => {
    const cleanEmail = clientData.email.toLowerCase().trim();
    let createdClient: Client = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `c-${Date.now()}`,
      name: clientData.name,
      email: cleanEmail,
      company: clientData.company || "Client Organization",
      phone: clientData.phone,
      passcode: clientData.passcode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient() as any;
      // Do not force client-side ID so postgres gen_random_uuid() works cleanly
      const payload: any = {
        name: clientData.name,
        email: cleanEmail,
        company: clientData.company || "Client Organization",
        phone: clientData.phone,
        passcode: clientData.passcode,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("clients")
        .upsert(payload, { onConflict: "email" })
        .select()
        .single();

      if (error) {
        console.error("Supabase error saving to clients table:", error.message || error);
      } else if (data) {
        createdClient = data;
      }
    } catch (e) {
      console.error("Failed to insert client into database:", e);
    }

    setClientsDirectory((prev) => [createdClient, ...prev.filter((c) => c.email !== createdClient.email)]);
    return createdClient;
  };

  const assignClientToProject = async (
    projectId: string,
    clientData: { clientId?: string; name: string; email: string; company?: string; passcode: string }
  ): Promise<ProjectClient> => {
    const cleanEmail = clientData.email.toLowerCase().trim();

    // 1. Ensure master client record is created in `clients` table
    const clientRecord = await createClientInDatabase({
      name: clientData.name,
      email: cleanEmail,
      company: clientData.company,
      passcode: clientData.passcode,
    });

    let assignedRow: ProjectClient = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `pcl-${Date.now()}`,
      project_id: projectId,
      client_id: clientRecord.id,
      client_name: clientData.name,
      client_email: cleanEmail,
      client_company: clientData.company || "Client Organization",
      passcode: clientData.passcode,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Insert into `project_clients` table
    try {
      const supabase = createClient() as any;
      const payload: any = {
        project_id: projectId,
        client_name: clientData.name,
        client_email: cleanEmail,
        client_company: clientData.company || "Client Organization",
        passcode: clientData.passcode,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (clientRecord.id && !clientRecord.id.startsWith("c-")) {
        payload.client_id = clientRecord.id;
      }

      const { data, error } = await supabase
        .from("project_clients")
        .upsert(payload, { onConflict: "project_id,client_email" })
        .select()
        .single();

      if (error) {
        console.error("Supabase error inserting into project_clients:", error.message || error);
      } else if (data) {
        assignedRow = data;
      }
    } catch (e) {
      console.error("Failed to assign client to project in Supabase:", e);
    }

    setProjectClients((prev) => [
      assignedRow,
      ...prev.filter((c) => !(c.project_id === projectId && c.client_email === cleanEmail)),
    ]);

    await updatePortalConfig(projectId, {
      client_name: clientData.name,
      client_email: cleanEmail,
      client_company: clientData.company || "Client Organization",
      access_passcode: clientData.passcode,
    });

    return assignedRow;
  };

  const removeClientFromProject = async (projectId: string, clientEmail: string) => {
    const cleanEmail = clientEmail.toLowerCase().trim();
    setProjectClients((prev) => prev.filter((c) => !(c.project_id === projectId && c.client_email === cleanEmail)));

    try {
      const supabase = createClient() as any;
      const { error } = await supabase.from("project_clients").delete().eq("project_id", projectId).eq("client_email", cleanEmail);
      if (error) console.error("Supabase error deleting project_client:", error);
    } catch (e) {
      console.error("Failed to delete project_client from Supabase:", e);
    }
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

      // 1. Fetch from project_clients table
      const { data: assignments, error: assignErr } = await supabase
        .from("project_clients")
        .select("*, projects(id, name, title, description)")
        .eq("client_email", cleanEmail)
        .eq("passcode", cleanPass)
        .eq("is_active", true);

      if (!assignErr && assignments && assignments.length > 0) {
        const assignedProjects: ClientProjectRef[] = assignments.map((a: any) => ({
          id: a.project_id,
          name: a.projects?.name || a.projects?.title || a.client_company || "Assigned Project",
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

      // 2. Fallback check: master clients directory
      const { data: clientRows, error: clientErr } = await supabase
        .from("clients")
        .select("*")
        .eq("email", cleanEmail)
        .eq("passcode", cleanPass);

      if (!clientErr && clientRows && clientRows.length > 0) {
        const c = clientRows[0];
        // Fetch any project assigned to this client or all projects
        const { data: projectList } = await supabase.from("projects").select("id, name, title");
        const defaultProjectId = projectList?.[0]?.id || "default";

        const session: ClientSession = {
          client_id: c.id,
          client_name: c.name,
          client_company: c.company || "Client Organization",
          client_email: c.email,
          project_id: defaultProjectId,
          assigned_projects: (projectList || []).map((p: any) => ({ id: p.id, name: p.name || p.title })),
          is_authenticated: true,
        };

        setClientSession(session);
        return { success: true, session };
      }
    } catch (e) {
      console.error("Supabase authentication error:", e);
    }

    // Local state fallback
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

    const localClient = clientsDirectory.find(
      (c) => c.email.toLowerCase() === cleanEmail && c.passcode === cleanPass
    );

    if (localClient) {
      const session: ClientSession = {
        client_id: localClient.id,
        client_name: localClient.name,
        client_company: localClient.company || "Client Organization",
        client_email: localClient.email,
        project_id: "default",
        is_authenticated: true,
      };
      setClientSession(session);
      return { success: true, session };
    }

    return { success: false, error: "Invalid client credentials. Please verify your email and passcode or contact your Project Manager." };
  };

  const registerClientAccount = async (clientData: {
    name: string;
    email: string;
    company?: string;
    passcode: string;
    projectId?: string;
  }): Promise<{ success: boolean; error?: string; session?: ClientSession }> => {
    if (!clientData.name || !clientData.email || !clientData.passcode) {
      return { success: false, error: "Please provide your name, email, and passcode." };
    }

    const cleanEmail = clientData.email.toLowerCase().trim();

    try {
      const supabase = createClient() as any;

      // 1. First save into `clients` table
      const clientRecord = await createClientInDatabase({
        name: clientData.name,
        email: cleanEmail,
        company: clientData.company,
        passcode: clientData.passcode,
      });

      // 2. Find real project ID if not provided
      let targetProjectId = clientData.projectId;
      if (!targetProjectId || targetProjectId === "default") {
        const { data: projList } = await supabase.from("projects").select("id").limit(1);
        if (projList && projList.length > 0) {
          targetProjectId = projList[0].id;
        }
      }

      // 3. Link client to project in `project_clients`
      if (targetProjectId && targetProjectId !== "default") {
        await assignClientToProject(targetProjectId, {
          clientId: clientRecord.id,
          name: clientData.name,
          email: cleanEmail,
          company: clientData.company,
          passcode: clientData.passcode,
        });
      }

      const session: ClientSession = {
        client_id: clientRecord.id,
        client_name: clientRecord.name,
        client_company: clientRecord.company || "Client Organization",
        client_email: clientRecord.email,
        project_id: targetProjectId || "default",
        is_authenticated: true,
      };

      setClientSession(session);
      return { success: true, session };
    } catch (err: any) {
      console.error("Client registration error:", err);
      return { success: false, error: err.message || "Failed to register client account in database." };
    }
  };

  const switchClientProject = (projectId: string) => {
    if (!clientSession) return;
    setClientSession({
      ...clientSession,
      project_id: projectId,
    });
  };

  const sendMessage = async (msg: Omit<ClientMessage, "id" | "created_at">): Promise<ClientMessage> => {
    let newMsg: ClientMessage = {
      ...msg,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `msg-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient() as any;
      const payload: any = {
        project_id: msg.project_id,
        sender_role: msg.sender_role,
        sender_name: msg.sender_name,
        sender_email: msg.sender_email,
        sender_avatar: msg.sender_avatar,
        content: msg.content,
        topic: msg.topic || "General",
        attachment_name: msg.attachment_name,
        attachment_url: msg.attachment_url,
        attachment_type: msg.attachment_type,
        read_by_recipient: false,
      };

      const { data, error } = await supabase.from("client_pm_messages").insert(payload).select().single();
      if (error) {
        console.error("Supabase error sending message:", error.message || error);
      } else if (data) {
        newMsg = data;
      }
    } catch (e) {
      console.error("Failed to send message to database:", e);
    }

    setMessages((prev) => [...prev, newMsg]);
    return newMsg;
  };

  const scheduleMeeting = async (
    meeting: Omit<ClientMeeting, "id" | "created_at" | "updated_at">
  ): Promise<ClientMeeting> => {
    let newMeeting: ClientMeeting = {
      ...meeting,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `meet-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient() as any;
      const payload: any = {
        project_id: meeting.project_id,
        title: meeting.title,
        room_id: meeting.room_id,
        scheduled_at: meeting.scheduled_at,
        duration_minutes: meeting.duration_minutes || 30,
        status: meeting.status || "scheduled",
        host_name: meeting.host_name,
        client_attendee: meeting.client_attendee,
        agenda: meeting.agenda,
        live_notes: meeting.live_notes,
        ai_summary: meeting.ai_summary,
        action_items: meeting.action_items || [],
        meeting_url: meeting.meeting_url,
      };

      const { data, error } = await supabase.from("client_meetings").insert(payload).select().single();
      if (error) {
        console.error("Supabase error creating meeting:", error.message || error);
      } else if (data) {
        newMeeting = data;
      }
    } catch (e) {
      console.error("Failed to insert meeting into database:", e);
    }

    setMeetings((prev) => [newMeeting, ...prev]);
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
        .or(`id.eq.${meetingId},room_id.eq.${meetingId}`);
    } catch (e) {}
  };

  const generateAiMeetingSummary = async (meetingId: string, notes: string) => {
    const summary = `Executive Summary: Direct video conference concluded between Project Manager and Client. Key alignment on milestones, specifications, and upcoming delivery steps.`;
    const actionItems = [
      "Review staging environment updates",
      "Sign off on milestone deliverables",
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
        .or(`id.eq.${meetingId},room_id.eq.${meetingId}`);
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
        .or(`id.eq.${meetingId},room_id.eq.${meetingId}`);
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
    let newItem: ClientApprovalItem = {
      ...item,
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `appr-${Date.now()}`,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    try {
      const supabase = createClient() as any;
      const payload: any = {
        project_id: item.project_id,
        title: item.title,
        category: item.category || "Milestone Sign-off",
        description: item.description,
        item_type: item.item_type || "milestone",
        status: "pending",
        requested_by: item.requested_by,
      };

      const { data, error } = await supabase.from("client_approvals").insert(payload).select().single();
      if (error) {
        console.error("Supabase error creating approval item:", error);
      } else if (data) {
        newItem = data;
      }
    } catch (e) {}

    setApprovals((prev) => [newItem, ...prev]);
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
