// ─────────────────────────────────────────────────────────────────────────────
// Orion — Supabase Database Type Definitions
// Auto-sync this file whenever you run: npx supabase gen types typescript
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ────────────────────────────────────────────────────────────────────

export type ProjectStatus = "draft" | "active" | "analyzing" | "review" | "complete" | "archived";
export type SourceType = "srs_document" | "meeting_transcript" | "business_notes" | "client_email" | "manual_text" | "other";
export type SourceStatus = "pending" | "processing" | "processed" | "failed";
export type RequirementType = "functional" | "non_functional";
export type RequirementPriority = "critical" | "high" | "medium" | "low";
export type RequirementStatus = "draft" | "confirmed" | "rejected" | "deferred";
export type AnalysisStatus = "queued" | "running" | "completed" | "failed";
export type InsightSeverity = "info" | "warning" | "critical" | "opportunity";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type SprintStatus = "planned" | "active" | "completed" | "cancelled";
export type TaskStatus = "todo" | "in_progress" | "done" | "blocked";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type MemberRole = "owner" | "admin" | "member" | "viewer";

// ── Database Interface ────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Organization, "id" | "created_at">>;
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Omit<OrganizationMember, "joined_at">;
        Update: Partial<Pick<OrganizationMember, "role">>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Project, "id" | "created_at">>;
      };
      requirement_sources: {
        Row: RequirementSource;
        Insert: Omit<RequirementSource, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<RequirementSource, "id" | "created_at">>;
      };
      analysis_runs: {
        Row: AnalysisRun;
        Insert: Omit<AnalysisRun, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<AnalysisRun, "id" | "created_at">>;
      };
      project_intelligence: {
        Row: ProjectIntelligence;
        Insert: Omit<ProjectIntelligence, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<ProjectIntelligence, "id" | "created_at">>;
      };
      requirements: {
        Row: Requirement;
        Insert: Omit<Requirement, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Requirement, "id" | "created_at">>;
      };
      stakeholders: {
        Row: Stakeholder;
        Insert: Omit<Stakeholder, "id" | "created_at">;
        Update: Partial<Omit<Stakeholder, "id" | "created_at">>;
      };
      system_modules: {
        Row: SystemModule;
        Insert: Omit<SystemModule, "id" | "created_at">;
        Update: Partial<Omit<SystemModule, "id" | "created_at">>;
      };
      ai_insights: {
        Row: AiInsight;
        Insert: Omit<AiInsight, "id" | "created_at">;
        Update: Partial<Omit<AiInsight, "id" | "created_at">>;
      };
      risks: {
        Row: Risk;
        Insert: Omit<Risk, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Risk, "id" | "created_at">>;
      };
      sprints: {
        Row: Sprint;
        Insert: Omit<Sprint, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Sprint, "id" | "created_at">>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Task, "id" | "created_at">>;
      };
      project_reports: {
        Row: ProjectReport;
        Insert: Omit<ProjectReport, "id" | "created_at">;
        Update: Partial<Omit<ProjectReport, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      project_status: ProjectStatus;
      source_type: SourceType;
      source_status: SourceStatus;
      requirement_type: RequirementType;
      requirement_priority: RequirementPriority;
      requirement_status: RequirementStatus;
      analysis_status: AnalysisStatus;
      insight_severity: InsightSeverity;
      risk_level: RiskLevel;
      sprint_status: SprintStatus;
      task_status: TaskStatus;
      task_priority: TaskPriority;
      member_role: MemberRole;
    };
  };
}

// ── Row Type Definitions ──────────────────────────────────────────────────────

export interface Profile {
  id: string; // matches auth.users.id
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: "free" | "pro" | "enterprise";
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  domain: string | null; // e.g. "e-commerce", "healthcare", "fintech"
  tech_stack: string[] | null;
  team_size: number | null;
  color: string | null; // gradient CSS class or hex
  metadata: Json | null; // flexible extra fields
  created_at: string;
  updated_at: string;
}

/** 
 * A single uploaded source document for a project.
 * Could be a PDF, text paste, email body, transcript, etc.
 */
export interface RequirementSource {
  id: string;
  project_id: string;
  uploaded_by: string;
  source_type: SourceType;
  title: string;
  description: string | null;
  // For file uploads: the path in Supabase Storage
  file_path: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  // For manual text / email body pastes
  raw_text: string | null;
  // After extraction, cleaned text is stored here
  extracted_text: string | null;
  status: SourceStatus;
  word_count: number | null;
  page_count: number | null;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Each time the Requirement Intelligence Agent runs on a project,
 * it creates an AnalysisRun record to track the job.
 */
export interface AnalysisRun {
  id: string;
  project_id: string;
  triggered_by: string;
  status: AnalysisStatus;
  source_ids: string[]; // which RequirementSources were included
  model_used: string | null; // e.g. "gemini-2.5-pro"
  tokens_used: number | null;
  duration_ms: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * The structured output of the Requirement Intelligence Agent.
 * One record per analysis run. This is the "knowledge base" artifact.
 */
export interface ProjectIntelligence {
  id: string;
  project_id: string;
  analysis_run_id: string;
  // ── Core extractions (each is a structured JSON object) ──
  project_overview: ProjectOverview | null;
  business_objectives: BusinessObjective[] | null;
  assumptions: string[] | null;
  constraints: string[] | null;
  dependencies: ProjectDependency[] | null;
  technology_recommendations: TechnologyRecommendation[] | null;
  out_of_scope: string[] | null;
  glossary: GlossaryTerm[] | null;
  // ── Agent metadata ──
  confidence_score: number | null; // 0.0 – 1.0
  ambiguity_flags: AmbiguityFlag[] | null;
  raw_agent_output: Json | null; // full LLM response for debugging
  created_at: string;
  updated_at: string;
}

/**
 * Individual software requirements extracted by the agent.
 * Stored separately for granular querying, validation, and linking to tasks.
 */
export interface Requirement {
  id: string;
  project_id: string;
  analysis_run_id: string;
  source_ids: string[]; // which sources this req was extracted from
  req_type: RequirementType;
  category: string | null; // e.g. "Authentication", "Payment", "Reporting"
  module: string | null; // linked system module name
  title: string;
  description: string;
  acceptance_criteria: string[] | null;
  priority: RequirementPriority;
  status: RequirementStatus;
  complexity: "simple" | "medium" | "complex" | null;
  estimated_effort_hours: number | null;
  tags: string[] | null;
  // Traceability
  original_text: string | null; // quote from source doc
  source_line_ref: string | null; // "Page 3, Section 2.1"
  linked_requirement_ids: string[] | null; // dependencies between reqs
  created_at: string;
  updated_at: string;
}

/** Actors / users / personas identified in the project sources */
export interface Stakeholder {
  id: string;
  project_id: string;
  analysis_run_id: string;
  name: string; // e.g. "End User", "Admin", "Payment Gateway"
  type: "internal" | "external" | "system";
  description: string | null;
  goals: string[] | null;
  interactions: string[] | null; // list of features they interact with
  created_at: string;
}

/** High-level system modules / components identified */
export interface SystemModule {
  id: string;
  project_id: string;
  analysis_run_id: string;
  name: string; // e.g. "Authentication", "Notification Service"
  description: string | null;
  sub_modules: string[] | null;
  key_features: string[] | null;
  dependencies: string[] | null; // names of other modules
  created_at: string;
}

/** AI-generated insights surfaced during or after analysis */
export interface AiInsight {
  id: string;
  project_id: string;
  analysis_run_id: string | null;
  severity: InsightSeverity;
  category: "scope" | "risk" | "ambiguity" | "opportunity" | "dependency" | "effort";
  title: string;
  description: string;
  affected_requirement_ids: string[] | null;
  metric_label: string | null; // e.g. "+40% Effort"
  action_label: string | null; // e.g. "View Analysis"
  is_dismissed: boolean;
  created_at: string;
}

export interface Risk {
  id: string;
  project_id: string;
  analysis_run_id: string | null;
  title: string;
  description: string;
  category: "technical" | "resource" | "scope" | "timeline" | "external" | "security";
  level: RiskLevel;
  probability: number | null; // 0.0 – 1.0
  impact: number | null; // 0.0 – 1.0
  mitigation_strategy: string | null;
  affected_requirement_ids: string[] | null;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string; // "Sprint 1 — Authentication"
  goal: string | null;
  sprint_number: number;
  status: SprintStatus;
  start_date: string | null;
  end_date: string | null;
  velocity_points: number | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  sprint_id: string | null;
  requirement_id: string | null;
  created_by: string;
  assigned_to: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  story_points: number | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  tags: string[] | null;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectReport {
  id: string;
  project_id: string;
  analysis_run_id: string | null;
  generated_by: string;
  report_type: "requirement_summary" | "sprint_plan" | "risk_matrix" | "full_project_plan" | "estimation";
  title: string;
  file_path: string | null; // path in Supabase Storage
  content: Json | null; // structured report data
  is_published: boolean;
  created_at: string;
}

// ── Nested JSON Shape Definitions ────────────────────────────────────────────

export interface ProjectOverview {
  summary: string;
  domain: string;
  target_users: string;
  core_problem: string;
  proposed_solution: string;
  success_criteria: string[];
}

export interface BusinessObjective {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  measurable_outcome: string | null;
}

export interface ProjectDependency {
  name: string;
  type: "third_party_api" | "internal_system" | "external_service" | "library" | "database";
  description: string;
  is_critical: boolean;
}

export interface TechnologyRecommendation {
  layer: string; // e.g. "Frontend", "Backend", "Database", "Auth"
  recommended: string; // e.g. "Next.js 14"
  rationale: string;
  alternatives: string[];
}

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export interface AmbiguityFlag {
  text: string; // the ambiguous phrase from source
  reason: string; // why it's ambiguous
  suggestion: string; // how to resolve it
  source_id: string | null;
}
