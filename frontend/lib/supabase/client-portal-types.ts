export interface ProjectClient {
  id: string;
  project_id: string;
  client_name: string;
  client_email: string;
  client_company?: string;
  passcode: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientPortalConfig {
  id: string;
  project_id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  access_passcode?: string;
  is_portal_active: boolean;
  welcome_heading: string;
  welcome_message: string;
  show_overview: boolean;
  show_requirements: boolean;
  show_sprints: boolean;
  show_github: boolean;
  show_risks: boolean;
  show_reports: boolean;
  show_budget: boolean;
  show_meetings: boolean;
  allow_approvals: boolean;
  allow_direct_chat: boolean;
  live_preview_url?: string;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "pm" | "client" | "system";

export interface ClientMessage {
  id: string;
  project_id: string;
  sender_role: MessageRole;
  sender_name: string;
  sender_email?: string;
  sender_avatar?: string;
  content: string;
  topic: string;
  attachment_name?: string;
  attachment_url?: string;
  attachment_type?: string;
  is_pinned?: boolean;
  read_by_recipient: boolean;
  created_at: string;
}

export type MeetingStatus = "scheduled" | "live" | "completed" | "cancelled";

export interface ClientMeeting {
  id: string;
  project_id: string;
  project_name?: string;
  title: string;
  room_id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: MeetingStatus;
  host_name: string;
  client_attendee: string;
  agenda?: string;
  live_notes?: string;
  ai_summary?: string;
  action_items?: string[];
  meeting_url?: string;
  created_at: string;
  updated_at: string;
}

export type ApprovalStatus = "pending" | "approved" | "revision_requested";

export interface ClientApprovalItem {
  id: string;
  project_id: string;
  title: string;
  category: string;
  description?: string;
  item_type: "milestone" | "requirement" | "design" | "release";
  status: ApprovalStatus;
  requested_by: string;
  client_reviewer?: string;
  client_feedback?: string;
  decided_at?: string;
  created_at: string;
}

export interface ClientSession {
  client_id: string;
  client_name: string;
  client_company: string;
  client_email: string;
  project_id: string;
  avatar_url?: string;
  is_authenticated: boolean;
}
