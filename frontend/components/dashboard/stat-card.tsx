import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: number;
  trendLabel?: string;
  description?: string;
}

export function StatCard({ label, value, icon, iconBg = "bg-indigo-50", trend, trendLabel, description }: StatCardProps) {
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral = trend === 0;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200", iconBg)}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 text-[11px] font-bold rounded-full px-2 py-0.5",
            trendPositive && "bg-emerald-50 text-emerald-700",
            trendNegative && "bg-red-50 text-red-700",
            trendNeutral && "bg-zinc-100 text-zinc-500",
          )}>
            {trendPositive && <TrendingUp className="h-3 w-3" />}
            {trendNegative && <TrendingDown className="h-3 w-3" />}
            {trendNeutral && <Minus className="h-3 w-3" />}
            {trend > 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-black text-zinc-900 leading-none tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-zinc-500 mt-1">{label}</p>
        {(trendLabel || description) && (
          <p className="text-[10px] font-medium text-zinc-400 mt-2 leading-normal">
            {trendLabel ?? description}
          </p>
        )}
      </div>
    </div>
  );
}
