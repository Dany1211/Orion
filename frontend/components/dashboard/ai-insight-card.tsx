import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertOctagon, ArrowRight, Sparkles, TrendingUp, ShieldAlert } from "lucide-react";

type InsightSeverity = "info" | "warning" | "critical" | "opportunity";

export interface AiInsightCardProps {
  severity: InsightSeverity;
  title: string;
  description: string;
  project?: string;
  action?: string;
  metric?: string;
}

const severityConfig: Record<InsightSeverity, { icon: React.ElementType; border: string; header: string; badge: string; iconColor: string }> = {
  info: {
    icon: Info,
    border: "border-l-indigo-400",
    header: "bg-indigo-50",
    badge: "bg-indigo-100 text-indigo-700",
    iconColor: "text-indigo-500",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-l-amber-400",
    header: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    iconColor: "text-amber-500",
  },
  critical: {
    icon: AlertOctagon,
    border: "border-l-red-400",
    header: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    iconColor: "text-red-500",
  },
  opportunity: {
    icon: TrendingUp,
    border: "border-l-emerald-400",
    header: "bg-emerald-50",
    badge: "bg-emerald-100 text-emerald-700",
    iconColor: "text-emerald-500",
  },
};

export function AiInsightCard({ severity, title, description, project, action, metric }: AiInsightCardProps) {
  const { icon: Icon, border, header, badge, iconColor } = severityConfig[severity];

  return (
    <div className={cn("bg-white rounded-xl border border-zinc-100 border-l-4 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden", border)}>
      <div className={cn("px-4 py-2.5 flex items-center justify-between", header)}>
        <div className="flex items-center gap-2">
          <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", iconColor)} />
          <span className={cn("text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full", badge)}>
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-zinc-400" />
          <span className="text-[9px] font-bold text-zinc-400">AI Insight</span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-xs font-black text-zinc-900 leading-snug flex-1">{title}</h4>
          {metric && (
            <span className="text-xs font-black text-zinc-800 flex-shrink-0 bg-zinc-100 px-2 py-0.5 rounded-md">{metric}</span>
          )}
        </div>
        <p className="text-xs font-medium text-zinc-500 leading-relaxed">{description}</p>
        <div className="flex items-center justify-between pt-1">
          {project && (
            <span className="text-[10px] font-bold text-zinc-400">
              📁 {project}
            </span>
          )}
          {action && (
            <button className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors ml-auto">
              {action} <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
