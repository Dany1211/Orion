"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface WorkspaceContextType {
  user: any | null;
  organization: { id: string; name: string; slug: string; plan: string } | null;
  projects: any[];
  isLoading: boolean;
  refreshProjects: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = React.useState<any | null>(null);
  const [organization, setOrganization] = React.useState<any | null>(null);
  const [projects, setProjects] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchSessionAndProfile = async () => {
    const supabase = createClient() as any;
    
    // 1. Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      setUser(null);
      setOrganization(null);
      setProjects([]);
      setIsLoading(false);
      router.push("/login");
      return;
    }

    setUser(session.user);

    // 2. Get user's profile and organization_id
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", session.user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error("Profile or organization missing:", profileError);
      setIsLoading(false);
      return;
    }

    // 3. Fetch active organization details
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, plan")
      .eq("id", profile.organization_id)
      .single();

    if (orgError) {
      console.error("Error fetching organization:", orgError);
    } else {
      setOrganization(orgData);
    }

    // 4. Fetch projects
    const { data: projectsData, error: projectsError } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("updated_at", { ascending: false });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
    } else {
      setProjects(projectsData || []);
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
    setProjects(projectsData || []);
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
      const { data: orgData } = await supabase
        .from("organizations")
        .select("id, name, slug, plan")
        .eq("id", profile.organization_id)
        .single();
      setOrganization(orgData);
    }
  };

  React.useEffect(() => {
    fetchSessionAndProfile();
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        user,
        organization,
        projects,
        isLoading,
        refreshProjects,
        refreshOrganization,
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
