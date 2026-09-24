"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import {
  FolderKanban, BrainCircuit, ListChecks, Users2,
  Sparkles, Plus, ArrowRight, ChevronRight, RefreshCw, X, Loader2
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProjectCard, type ProjectCardProps } from "@/components/dashboard/project-card";
import { AiInsightCard, type AiInsightCardProps } from "@/components/dashboard/ai-insight-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { EmptyState } from "@/components/dashboard/empty-state";

import { useWorkspace } from "@/lib/contexts/workspace-context";

// Type definition for DB project
interface DbProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, organization, projects, activeProjectId, setActiveProjectId, isLoading: ctxLoading, refreshProjects } = useWorkspace();
  
  const [isLoadingSubData, setIsLoadingSubData] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);
  
  // Sub-data states (insights & stats based on active project)
  const [insights, setInsights] = React.useState<AiInsightCardProps[]>([]);
  const [stats, setStats] = React.useState({
    projects: 0,
    requirements: 0,
    tasks: 0,
    team: 1,
  });

  // Modal State
  const [showNewProjectModal, setShowNewProjectModal] = React.useState(false);
  const [newProjectName, setNewProjectName] = React.useState("");
  const [newProjectDesc, setNewProjectDesc] = React.useState("");

  const loadSubData = async () => {
    if (ctxLoading) return;
    if (projects.length === 0) {
      setIsLoadingSubData(false);
      return;
    }

    setIsLoadingSubData(true);
    const supabase = createClient() as any;
    const activeId = activeProjectId || projects[0].id;

    // Fetch metrics/counts from actual tables
    const { count: teamCount } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", organization?.id);

    const { count: reqCount } = await supabase
      .from("requirements")
      .select("*", { count: "exact", head: true })
      .eq("project_id", activeId);

    const { count: taskCount } = await supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("project_id", activeId);

    // Fetch real AI insights
    const { data: insightsData } = await supabase
      .from("ai_insights")
      .select("severity, title, description, metric_label, action_label")
      .eq("project_id", activeId)
      .limit(4);

    if (insightsData) {
      const formattedInsights: AiInsightCardProps[] = insightsData.map((row: any) => ({
        severity: row.severity as any,
        title: row.title,
        description: row.description,
        metric: row.metric_label || undefined,
        action: row.action_label || undefined,
        project: projects.find((p) => p.id === activeId)?.name || "Project",
      }));
      setInsights(formattedInsights);
    } else {
      setInsights([]);
    }

    setStats({
      projects: projects.length,
      requirements: reqCount || 0,
      tasks: taskCount || 0,
      team: teamCount || 1,
    });

    setIsLoadingSubData(false);
  };

  React.useEffect(() => {
    loadSubData();
  }, [projects, ctxLoading, activeProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !organization?.id) return;

    setIsCreating(true);
    const supabase = createClient() as any;

    const colors = [
      "from-indigo-500 to-violet-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const { error } = await supabase
      .from("projects")
      .insert({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || null,
        organization_id: organization.id,
        created_by: user.id,
        status: "draft",
        color: randomColor,
      });

    setIsCreating(false);
    if (error) {
      console.error("Error creating project:", error.message);
      return;
    }

    setNewProjectName("");
    setNewProjectDesc("");
    setShowNewProjectModal(false);

    // Refresh context projects (propagates to sidebar and grid instantly!)
    await refreshProjects();
  };

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const isLoading = ctxLoading || isLoadingSubData;
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-zinc-400 font-bold tracking-wider uppercase">Loading Workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-7 relative">
      {/* ── Greeting Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight">
            {greeting}, {userName} 👋
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <p className="text-sm font-medium text-zinc-500">
              {projects.length > 0 ? (
                <>
                  Orion is active in <span className="font-bold text-zinc-700">{projects.length} workspaces</span>.
                </>
              ) : (
                "Orion is active. Create a project to begin analyzing requirements."
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <div className="relative flex items-center">
              <select
                value={activeProjectId || ""}
                onChange={(e) => setActiveProjectId(e.target.value || null)}
                className="pl-3 pr-8 h-9 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-750 focus:outline-none appearance-none cursor-pointer shadow-sm hover:bg-zinc-50 transition-colors"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>📁 {p.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={() => router.push("/dashboard/projects/new")}
            className="hidden sm:flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-2 rounded-xl transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Project
          </button>
        </div>
      </motion.div>

      {projects.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-7"
        >
          {/* ── Orion Interactive Setup Wizard ── */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-zinc-900 to-indigo-950 rounded-2xl p-6 border border-zinc-800 text-white shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
              <h2 className="text-xs font-black uppercase tracking-widest text-indigo-300">Workspace Setup Roadmap</h2>
            </div>
            
            <p className="text-xs font-semibold text-zinc-350 leading-relaxed max-w-2xl">
              Follow these steps to analyze requirement materials (e.g. your <code className="font-mono text-[10px] bg-zinc-800 px-1 py-0.5 rounded text-indigo-300">test.txt</code> transcript file) and automatically generate sprint schedules, milestones, and risk matrices.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl space-y-2 relative">
                <span className="text-xl font-black text-zinc-700 absolute top-2 right-3">1</span>
                <h3 className="text-xs font-bold text-white">Ingest Specifications</h3>
                <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                  Click on your project in the grid below, navigate to the <span className="text-indigo-400 font-bold">"Specs & Documents"</span> tab, and drag & drop or paste your transcript specs.
                </p>
              </div>

              <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl space-y-2 relative">
                <span className="text-xl font-black text-zinc-700 absolute top-2 right-3">2</span>
                <h3 className="text-xs font-bold text-white">Analyze Workspace</h3>
                <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                  Click the <span className="text-indigo-400 font-bold">"Analyze Requirements"</span> button. Orion's LLM Agent will scan for modules and timeline matrices.
                </p>
              </div>

              <div className="p-4 bg-zinc-800/40 border border-zinc-800 rounded-xl space-y-2 relative">
                <span className="text-xl font-black text-zinc-700 absolute top-2 right-3">3</span>
                <h3 className="text-xs font-bold text-white">Explore Timelines</h3>
                <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed">
                  Toggle the tabs to explore generated sprint backlogs, threat levels, or export master intelligence reports.
                </p>
              </div>
            </div>
          </motion.div>

          {/* ── Stat Cards ── */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Active Projects"
              value={stats.projects}
              icon={<FolderKanban className="h-5 w-5 text-indigo-600" />}
              iconBg="bg-indigo-50"
              description="Connected databases"
            />
            <StatCard
              label="Requirements Analyzed"
              value={stats.requirements}
              icon={<BrainCircuit className="h-5 w-5 text-violet-600" />}
              iconBg="bg-violet-50"
              description="AI extraction logs"
            />
            <StatCard
              label="Tasks Generated"
              value={stats.tasks}
              icon={<ListChecks className="h-5 w-5 text-cyan-600" />}
              iconBg="bg-cyan-50"
              description="Tasks mapped dynamically"
            />
            <StatCard
              label="Team Members"
              value={stats.team}
              icon={<Users2 className="h-5 w-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
              description="Active workspace users"
            />
          </motion.div>

          {/* ── Quick Actions ── */}
          <motion.section variants={itemVariants}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-zinc-900">Quick Actions</h2>
            </div>
            <QuickActions />
          </motion.section>

          {/* ── Projects + Right Panel ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Projects Grid */}
            <motion.section variants={itemVariants} className="xl:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-zinc-900">Your Projects</h2>
                <button className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map((p) => (
                  <ProjectCard
                    key={p.id}
                    name={p.name}
                    description={p.description || "No description provided."}
                    status={p.status as any}
                    progress={p.status === "complete" ? 100 : p.status === "analyzing" ? 45 : p.status === "review" ? 85 : 0}
                    sources={[]} // dynamically populated by folder joins in subpages
                    tasksGenerated={stats.tasks}
                    requirementsCount={stats.requirements}
                    color={p.color || "from-indigo-500 to-violet-600"}
                    onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                  />
                ))}
              </div>
            </motion.section>

            {/* Right Column */}
            <motion.div variants={itemVariants} className="space-y-5">
              {/* AI Insights Panel */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <h2 className="text-sm font-black text-zinc-900">AI Insights</h2>
                  </div>
                  <button onClick={loadSubData} className="h-7 w-7 rounded-lg bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 flex items-center justify-center transition-colors" title="Refresh insights">
                    <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
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
                    <Sparkles className="h-5 w-5 text-indigo-500 mx-auto opacity-40 mb-2" />
                    <p className="text-xs font-bold text-zinc-800">No Insights yet</p>
                    <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Insights will appear after your first requirement analysis.</p>
                  </div>
                )}
              </section>

              {/* Recent Activity */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-black text-zinc-900">Recent Activity</h2>
                  <button className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 transition-colors">
                    All activity <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                  <RecentActivity />
                </div>
              </section>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        /* ── Empty State ── */
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <EmptyState onCreateProject={() => router.push("/dashboard/projects/new")} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
