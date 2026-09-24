"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
export type MemberRole = "owner" | "admin" | "member" | "viewer";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

interface WorkspaceContextType {
  user: any | null;
  organization: Organization | null;
  /** The signed-in user's role within the organization */
  role: MemberRole | null;
  projects: any[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  /** True if user is owner or admin */
  canManage: boolean;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<any | null>(null);
  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [role, setRole] = React.useState<MemberRole | null>(null);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  // Prevent repeated redirect/signOut on re-renders
  const hasRedirected = React.useRef(false);

  const fetchSessionAndProfile = async () => {
    const supabase = createClient() as any;

    // 1. Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setUser(null);
      setOrganization(null);
      setRole(null);
      setProjects([]);
      setIsLoading(false);
      router.push("/login");
      return;
    }

    setUser(session.user);

    // 2. Get user's profile + organization_id in one query
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.warn("Profile has no organization_id — signing out.", profileError?.message);
      setIsLoading(false);
      // Guard: only sign out + redirect once to avoid loops
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        await supabase.auth.signOut();
        router.push("/login?error=no_org");
      }
      return;
    }

    const orgId = profile.organization_id;

    // 3. Fetch organization details + user's membership role — parallel
    const [orgResult, memberResult] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, slug, plan")
        .eq("id", orgId)
        .single(),
      supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", session.user.id)
        .single(),
    ]);

    if (orgResult.error) {
      console.error("Error fetching organization:", orgResult.error);
      // Org ID in profile points to a deleted/missing org — redirect
      if (!hasRedirected.current) {
        hasRedirected.current = true;
        await supabase.auth.signOut();
        router.push("/login?error=no_org");
      }
      return;
    } else {
      setOrganization(orgResult.data);
    }

    if (memberResult.error) {
      // Missing membership row — auto-insert as 'member' so the user can proceed
      console.warn("No membership row found, inserting default 'member' role.");
      await supabase
        .from("organization_members")
        .upsert({ organization_id: orgId, user_id: session.user.id, role: "member" }, { onConflict: "organization_id,user_id" });
      setRole("member");
    } else {
      setRole(memberResult.data?.role as MemberRole ?? "member");
    }

    // 4. Fetch projects scoped to organization
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", orgId)
      .order("updated_at", { ascending: false });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
    } else {
      const fetchedProjects = projectsData || [];
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0) {
        setActiveProjectId(fetchedProjects[0].id);
      }
    }

    setIsLoading(false);
  };

  const refreshProjects = async () => {
    if (!organization?.id) return;
    const supabase = createClient() as any;
    const { data: projectsData } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", organization.id)
      .order("updated_at", { ascending: false });
    const fetchedProjects = projectsData || [];
    setProjects(fetchedProjects);
    if (fetchedProjects.length > 0) {
      setActiveProjectId((prev) => {
        if (prev && fetchedProjects.some((p: any) => p.id === prev)) return prev;
        return fetchedProjects[0].id;
      });
    }
  };

  const refreshOrganization = async () => {
    if (!user?.id) return;
    const supabase = createClient() as any;
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profile?.organization_id) {
      const [orgResult, memberResult] = await Promise.all([
        supabase
          .from("organizations")
          .select("id, name, slug, plan")
          .eq("id", profile.organization_id)
          .single(),
        supabase
          .from("organization_members")
          .select("role")
          .eq("organization_id", profile.organization_id)
          .eq("user_id", user.id)
          .single(),
      ]);
      if (!orgResult.error) setOrganization(orgResult.data);
      if (!memberResult.error) setRole(memberResult.data?.role as MemberRole ?? "member");
    }
  };

  React.useEffect(() => {
    fetchSessionAndProfile();
  }, []);

  const canManage = role === "owner" || role === "admin";

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        organization,
        role,
        projects,
        activeProjectId,
        setActiveProjectId,
        isLoading,
        refreshProjects,
        refreshOrganization,
        canManage,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
