"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants } from "framer-motion";
import {
  FolderKanban, BrainCircuit, ListChecks, Users2,
  Sparkles, Plus, RefreshCw, Loader2, ArrowRight
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProjectCard, type ProjectCardProps } from "@/components/dashboard/project-card";
import { AiInsightCard, type AiInsightCardProps } from "@/components/dashboard/ai-insight-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { EmptyState } from "@/components/dashboard/empty-state";

import { useWorkspace } from "@/lib/contexts/workspace-context";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, organization, projects, activeProjectId, setActiveProjectId, isLoading: ctxLoading, refreshProjects } = useWorkspace();

  const [isLoadingSubData, setIsLoadingSubData] = React.useState(true);
  const [insights, setInsights] = React.useState<AiInsightCardProps[]>([]);
  const [stats, setStats] = React.useState({ projects: 0, requirements: 0, tasks: 0, team: 1 });

  const loadSubData = async () => {
    if (ctxLoading) return;
    if (projects.length === 0) { setIsLoadingSubData(false); return; }

    setIsLoadingSubData(true);
    const supabase = createClient() as any;
    const activeId = activeProjectId || projects[0].id;

    const [{ count: teamCount }, { count: reqCount }, { count: taskCount }, { data: insightsData }] = await Promise.all([
      supabase.from("organization_members").select("*", { count: "exact", head: true }).eq("organization_id", organization?.id),
      supabase.from("requirements").select("*", { count: "exact", head: true }).eq("project_id", activeId),
      supabase.from("tasks").select("*", { count: "exact", head: true }).eq("project_id", activeId),
      supabase.from("ai_insights").select("severity, title, description, metric_label, action_label").eq("project_id", activeId).limit(3),
    ]);

    setInsights((insightsData || []).map((row: any) => ({
      severity: row.severity as any,
      title: row.title,
      description: row.description,
      metric: row.metric_label || undefined,
      action: row.action_label || undefined,
      project: projects.find((p) => p.id === activeId)?.name || "Project",
    })));

    setStats({ projects: projects.length, requirements: reqCount || 0, tasks: taskCount || 0, team: teamCount || 1 });
    setIsLoadingSubData(false);
  };

  React.useEffect(() => { loadSubData(); }, [projects, ctxLoading, activeProjectId]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const isLoading = ctxLoading || isLoadingSubData;
  const userName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
        <p className="text-xs text-zinc-400">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50/50 px-6 sm:px-8 py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-6xl mx-auto space-y-8"
      >
        {/* Greeting */}
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
              {greeting}, {userName}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {projects.length > 0
                ? `${projects.length} active ${projects.length === 1 ? "project" : "projects"} in your workspace`
                : "Create a project to get started"
              }
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/projects/new")}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </motion.div>

        {projects.length > 0 ? (
          <>
            {/* Stats row */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Projects" value={stats.projects} icon={<FolderKanban className="h-4 w-4 text-indigo-500" />} iconBg="bg-indigo-50" description="in workspace" />
              <StatCard label="Requirements" value={stats.requirements} icon={<BrainCircuit className="h-4 w-4 text-violet-500" />} iconBg="bg-violet-50" description="extracted by AI" />
              <StatCard label="Tasks" value={stats.tasks} icon={<ListChecks className="h-4 w-4 text-sky-500" />} iconBg="bg-sky-50" description="generated" />
              <StatCard label="Team" value={stats.team} icon={<Users2 className="h-4 w-4 text-emerald-500" />} iconBg="bg-emerald-50" description="members" />
            </motion.div>

            {/* Projects + sidebar */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
              {/* Projects */}
              <motion.section variants={itemVariants} className="xl:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-zinc-800">Your Projects</h2>
                  <button
                    onClick={() => router.push("/dashboard/projects")}
                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                  >
                    View all <ArrowRight className="h-3 w-3" />
                  </button>
                </div>

                {/* Project selector for stats */}
                {projects.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Showing stats for:</span>
                    <select
                      value={activeProjectId || ""}
                      onChange={(e) => setActiveProjectId(e.target.value || null)}
                      className="text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      name={p.name}
                      description={p.description || "No description provided."}
                      status={p.status as any}
                      progress={p.status === "complete" ? 100 : p.status === "analyzing" ? 45 : p.status === "review" ? 85 : 10}
                      sources={[]}
                      tasksGenerated={stats.tasks}
                      requirementsCount={stats.requirements}
                      color={p.color || "from-indigo-500 to-violet-600"}
                      onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                    />
                  ))}
                </div>
              </motion.section>

              {/* Right column */}
              <motion.div variants={itemVariants} className="space-y-6">
                {/* AI Insights */}
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      AI Insights
                    </h2>
                    <button
                      onClick={loadSubData}
                      className="h-7 w-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="h-3 w-3 text-zinc-500" />
                    </button>
                  </div>

                  {insights.length > 0 ? (
                    <div className="space-y-2.5">
                      {insights.map((insight, i) => (
                        <AiInsightCard key={i} {...insight} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center">
                      <Sparkles className="h-5 w-5 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-medium text-zinc-500">No insights yet</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Run AI analysis on a project to generate insights.</p>
                    </div>
                  )}
                </section>

                {/* Recent Activity */}
                <section>
                  <h2 className="text-sm font-semibold text-zinc-800 mb-3">Recent Activity</h2>
                  <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                    <RecentActivity />
                  </div>
                </section>
              </motion.div>
            </div>
          </>
        ) : (
          <motion.div variants={itemVariants}>
            <div className="bg-white rounded-2xl border border-zinc-100">
              <EmptyState onCreateProject={() => router.push("/dashboard/projects/new")} />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
