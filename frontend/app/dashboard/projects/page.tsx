"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderKanban, Plus, Search, Filter, ArrowUpDown, BrainCircuit, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ProjectCard } from "@/components/dashboard/project-card";
import { createClient } from "@/lib/supabase/client";

export default function ProjectsPage() {
  const router = useRouter();
  const { user, organization, projects, refreshProjects } = useWorkspace();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight">Projects</h1>
          <p className="text-xs font-medium text-zinc-500 mt-1">
            Manage your engineering workspaces and run requirement intelligence reports.
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard/projects/new")}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md shadow-indigo-500/25 hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-2xl border border-zinc-150 shadow-sm">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search projects by name or description…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
          />
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-8 pr-8 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="analyzing">Analyzing</option>
              <option value="draft">Draft</option>
              <option value="review">In Review</option>
              <option value="complete">Complete</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              name={p.name}
              description={p.description || "No description provided."}
              status={p.status as any}
              progress={p.status === "complete" ? 100 : p.status === "analyzing" ? 45 : p.status === "review" ? 85 : 0}
              sources={[]}
              tasksGenerated={0}
              requirementsCount={0}
              color={p.color || "from-indigo-500 to-violet-600"}
              onClick={() => router.push(`/dashboard/projects/${p.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-150 p-12 text-center shadow-sm">
          <FolderKanban className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-zinc-800">No projects found</h3>
          <p className="text-xs text-zinc-400 font-medium mt-1">
            {searchQuery || statusFilter !== "all" 
              ? "Try adjusting your filters or search query."
              : "Start by creating your first software project."}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}
              className="mt-4 text-xs font-bold text-indigo-600 hover:text-indigo-700"
            >
            </button>
          )}
        </div>
      )}
    </div>
  );
}
