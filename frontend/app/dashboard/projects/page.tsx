"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FolderOpen, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ProjectCard } from "@/components/dashboard/project-card";

const STATUS_FILTERS = ["all", "active", "draft", "review", "complete", "analyzing"];

export default function ProjectsPage() {
  const router = useRouter();
  const { projects } = useWorkspace();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-full bg-zinc-50/50 px-6 sm:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Projects</h1>
            <p className="text-sm text-zinc-400 mt-1">
              {projects.length} {projects.length === 1 ? "project" : "projects"} in your workspace
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/projects/new")}
            className="flex items-center gap-2 h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm shadow-indigo-500/20 hover:bg-indigo-700 active:scale-[0.98] transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search projects…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-9 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 transition-all"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-9 px-3 rounded-xl text-sm font-medium capitalize transition-all ${
                  statusFilter === s
                    ? "bg-zinc-900 text-white"
                    : "bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filteredProjects.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredProjects.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProjectCard
                  name={p.name}
                  description={p.description || "No description provided."}
                  status={p.status as any}
                  progress={p.status === "complete" ? 100 : p.status === "analyzing" ? 45 : p.status === "review" ? 80 : 10}
                  sources={[]}
                  tasksGenerated={0}
                  requirementsCount={0}
                  color={p.color || "from-indigo-500 to-violet-600"}
                  onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-100 p-14 text-center">
            <FolderOpen className="h-8 w-8 text-zinc-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-zinc-600">No projects found</p>
            <p className="text-xs text-zinc-400 mt-1">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "Create your first project to get started."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
                className="mt-4 text-sm text-indigo-600 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
