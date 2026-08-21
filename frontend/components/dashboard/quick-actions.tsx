import * as React from "react";
import { cn } from "@/lib/utils";
import { Plus, Upload, BrainCircuit, FileBarChart, ArrowRight } from "lucide-react";

interface QuickAction {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  bg: string;
  ring: string;
}

const actions: QuickAction[] = [
  {
    icon: Plus,
    title: "New Project",
    description: "Start a new software project workspace",
    color: "text-indigo-600",
    bg: "bg-indigo-50 hover:bg-indigo-100",
    ring: "ring-indigo-200",
  },
  {
    icon: Upload,
    title: "Upload Requirements",
    description: "Add docs, transcripts, emails or notes",
    color: "text-cyan-600",
    bg: "bg-cyan-50 hover:bg-cyan-100",
    ring: "ring-cyan-200",
  },
  {
    icon: BrainCircuit,
    title: "Run AI Analysis",
    description: "Extract requirements & generate plans",
    color: "text-violet-600",
    bg: "bg-violet-50 hover:bg-violet-100",
    ring: "ring-violet-200",
  },
  {
    icon: FileBarChart,
    title: "Generate Report",
    description: "Export project plan and risk matrix",
    color: "text-emerald-600",
    bg: "bg-emerald-50 hover:bg-emerald-100",
    ring: "ring-emerald-200",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map(({ icon: Icon, title, description, color, bg, ring }) => (
        <button
          key={title}
          className={cn(
            "group relative flex flex-col items-start gap-3 p-4 rounded-2xl border border-transparent text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-zinc-100",
            bg
          )}
        >
          <div className={cn("h-9 w-9 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200 group-hover:scale-110", color)}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-black text-zinc-900">{title}</p>
            <p className="text-[10px] font-medium text-zinc-500 mt-0.5 leading-relaxed">{description}</p>
          </div>
          <ArrowRight className="absolute bottom-4 right-4 h-3.5 w-3.5 text-zinc-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
        </button>
      ))}
    </div>
  );
}
