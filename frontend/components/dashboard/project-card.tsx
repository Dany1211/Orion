import * as React from "react";
import { cn } from "@/lib/utils";

type ProjectStatus = "active" | "analyzing" | "draft" | "complete" | "review";

export interface ProjectCardProps {
  id?: string;
  name: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  sources: Array<"doc" | "transcript" | "email" | "notes">;
  lastAnalysis?: string;
  tasksGenerated: number;
  requirementsCount: number;
  riskLevel?: "low" | "medium" | "high";
  teamSize?: number;
  color?: string;
  onClick?: () => void;
}

const statusConfig: Record<ProjectStatus, { label: string; dot: string }> = {
  active:    { label: "Active",     dot: "bg-emerald-500" },
  analyzing: { label: "Analyzing",  dot: "bg-indigo-500 animate-pulse" },
  draft:     { label: "Draft",      dot: "bg-zinc-400" },
  complete:  { label: "Complete",   dot: "bg-sky-500" },
  review:    { label: "In Review",  dot: "bg-amber-400" },
};

export function ProjectCard({
  name, description, status, progress, tasksGenerated, requirementsCount, color = "from-indigo-500 to-violet-600", onClick,
}: ProjectCardProps) {
  const { label, dot } = statusConfig[status];

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl border border-zinc-100 hover:border-zinc-200 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Thin color bar */}
      <div className={cn("h-0.5 w-full bg-gradient-to-r", color)} />

      <div className="p-5">
        {/* Status + name */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dot)} />
              <span className="text-[11px] text-zinc-400 font-medium">{label}</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 leading-tight truncate group-hover:text-indigo-600 transition-colors">
              {name}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1 leading-relaxed">{description}</p>
          </div>

          {/* Progress circle */}
          <div className="flex-shrink-0 relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#f4f4f5" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none"
                stroke="url(#grad)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 94.25} 94.25`}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-zinc-600">
              {progress}%
            </span>
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4 pt-3 border-t border-zinc-50">
          <div>
            <p className="text-sm font-semibold text-zinc-800">{requirementsCount}</p>
            <p className="text-[10px] text-zinc-400">Requirements</p>
          </div>
          <div className="w-px h-6 bg-zinc-100" />
          <div>
            <p className="text-sm font-semibold text-zinc-800">{tasksGenerated}</p>
            <p className="text-[10px] text-zinc-400">Tasks</p>
          </div>
        </div>
      </div>
    </div>
  );
}
