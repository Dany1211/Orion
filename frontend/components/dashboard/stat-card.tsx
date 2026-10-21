import * as React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  description?: string;
}

export function StatCard({ label, value, icon, iconBg = "bg-indigo-50", description }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 hover:shadow-sm transition-all duration-200 group">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-zinc-900 tracking-tight leading-none">{value}</p>
      <p className="text-sm text-zinc-500 mt-1">{label}</p>
      {description && (
        <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
      )}
    </div>
  );
}
