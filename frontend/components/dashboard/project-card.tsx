import * as React from "react";
import { cn } from "@/lib/utils";
import { ProgressRing } from "./progress-ring";
import { FileText, Mic, Mail, StickyNote, ExternalLink, BrainCircuit, PlayCircle, MoreHorizontal, Clock } from "lucide-react";

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

const statusConfig: Record<ProjectStatus, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  analyzing: { label: "Analyzing…", className: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  draft: { label: "Draft", className: "bg-zinc-100 text-zinc-600 border-zinc-200" },
  complete: { label: "Complete", className: "bg-cyan-50 text-cyan-700 border-cyan-200" },
  review: { label: "In Review", className: "bg-amber-50 text-amber-700 border-amber-200" },
};

const sourceIcons: Record<string, { icon: React.ElementType; label: string }> = {
  doc: { icon: FileText, label: "Document" },
  transcript: { icon: Mic, label: "Transcript" },
  email: { icon: Mail, label: "Email" },
  notes: { icon: StickyNote, label: "Notes" },
};

const riskColors: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50",
  medium: "text-amber-600 bg-amber-50",
  high: "text-red-600 bg-red-50",
};

const ringColors: Record<ProjectStatus, string> = {
  active: "#10b981",
  analyzing: "#6366f1",
  draft: "#a1a1aa",
  complete: "#06b6d4",
  review: "#f59e0b",
};

export function ProjectCard({
  name, description, status, progress, sources, lastAnalysis,
  tasksGenerated, requirementsCount, riskLevel, teamSize, color = "from-indigo-500 to-violet-600", onClick,
}: ProjectCardProps) {
  const { label, className } = statusConfig[status];

  return (
    <div onClick={onClick} className="group bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-zinc-200 transition-all duration-250 overflow-hidden cursor-pointer">
      {/* Color accent top bar */}
      <div className={cn("h-1 w-full bg-gradient-to-r", color)} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", className)}>
                {label}
              </span>
              {riskLevel && (
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", riskColors[riskLevel])}>
                  {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-zinc-900 leading-snug truncate">{name}</h3>
            <p className="text-xs font-medium text-zinc-500 mt-0.5 line-clamp-1">{description}</p>
          </div>
          <ProgressRing value={progress} size={44} strokeWidth={3.5} color={ringColors[status]} />
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center py-2 bg-zinc-50 rounded-xl">
            <p className="text-base font-black text-zinc-800 leading-none">{requirementsCount}</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Reqs</p>
          </div>
          <div className="text-center py-2 bg-zinc-50 rounded-xl">
            <p className="text-base font-black text-zinc-800 leading-none">{tasksGenerated}</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Tasks</p>
          </div>
          <div className="text-center py-2 bg-zinc-50 rounded-xl">
            <p className="text-base font-black text-zinc-800 leading-none">{teamSize ?? "—"}</p>
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">Team</p>
          </div>
        </div>

        {/* Source types */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">Sources</span>
          {sources.map((s) => {
            const { icon: Icon, label } = sourceIcons[s];
            return (
              <div key={s} title={label} className="h-6 w-6 rounded-md bg-zinc-100 hover:bg-indigo-50 flex items-center justify-center transition-colors">
                <Icon className="h-3.5 w-3.5 text-zinc-500 hover:text-indigo-600" />
              </div>
            );
          })}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between border-t border-zinc-50 pt-3">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-400">
            <Clock className="h-3 w-3" />
            {lastAnalysis ? `Last run ${lastAnalysis}` : "Not analyzed yet"}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors">
              <BrainCircuit className="h-3 w-3" /> Analyze
            </button>
            <button className="h-6 w-6 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
