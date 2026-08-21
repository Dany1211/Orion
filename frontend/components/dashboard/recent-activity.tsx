import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BrainCircuit, Upload, GitBranch, AlertTriangle, FileCheck, Plus, UserPlus, Sparkles,
} from "lucide-react";

type ActivityType = "analysis" | "upload" | "sprint" | "risk" | "report" | "project" | "team" | "insight";

interface Activity {
  type: ActivityType;
  title: string;
  project?: string;
  time: string;
  description?: string;
}

const activityData: Activity[] = [
  { type: "analysis", title: "AI Analysis Completed", project: "E-Commerce Platform", time: "2 minutes ago", description: "Extracted 42 requirements from 3 sources" },
  { type: "risk", title: "Critical Risk Detected", project: "HR Management System", time: "18 minutes ago", description: "Payment integration scope significantly underestimated" },
  { type: "sprint", title: "Sprint Plan Generated", project: "E-Commerce Platform", time: "1 hour ago", description: "8 sprints created with 94 tasks auto-assigned" },
  { type: "upload", title: "Document Uploaded", project: "Mobile Banking App", time: "3 hours ago", description: "client_requirements_v3.pdf — 24 pages" },
  { type: "insight", title: "AI Recommendation", project: "HR Management System", time: "5 hours ago", description: "Suggested microservices architecture based on requirements" },
  { type: "report", title: "Report Exported", project: "E-Commerce Platform", time: "Yesterday", description: "Full project plan PDF generated" },
  { type: "project", title: "New Project Created", project: "Mobile Banking App", time: "2 days ago" },
];

const activityConfig: Record<ActivityType, { icon: React.ElementType; bg: string; color: string }> = {
  analysis: { icon: BrainCircuit, bg: "bg-indigo-100", color: "text-indigo-600" },
  upload: { icon: Upload, bg: "bg-cyan-100", color: "text-cyan-600" },
  sprint: { icon: GitBranch, bg: "bg-violet-100", color: "text-violet-600" },
  risk: { icon: AlertTriangle, bg: "bg-red-100", color: "text-red-600" },
  report: { icon: FileCheck, bg: "bg-emerald-100", color: "text-emerald-600" },
  project: { icon: Plus, bg: "bg-zinc-100", color: "text-zinc-600" },
  team: { icon: UserPlus, bg: "bg-amber-100", color: "text-amber-600" },
  insight: { icon: Sparkles, bg: "bg-purple-100", color: "text-purple-600" },
};

export function RecentActivity() {
  return (
    <div className="space-y-1">
      {activityData.map((item, i) => {
        const { icon: Icon, bg, color } = activityConfig[item.type];
        return (
          <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-50 transition-colors group cursor-pointer">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center flex-shrink-0 mt-0.5">
              <div className={cn("h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0", bg)}>
                <Icon className={cn("h-3.5 w-3.5", color)} />
              </div>
              {i < activityData.length - 1 && (
                <div className="w-px h-4 bg-zinc-100 mt-1" />
              )}
            </div>
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-zinc-800 truncate">{item.title}</p>
                <span className="text-[10px] font-medium text-zinc-400 flex-shrink-0">{item.time}</span>
              </div>
              {item.project && (
                <p className="text-[10px] font-bold text-indigo-600 mt-0.5">📁 {item.project}</p>
              )}
              {item.description && (
                <p className="text-[10px] font-medium text-zinc-400 mt-0.5 leading-relaxed line-clamp-1">{item.description}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
