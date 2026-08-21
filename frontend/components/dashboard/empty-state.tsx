import * as React from "react";
import { BrainCircuit, Upload, GitBranch, ArrowRight, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: <BrainCircuit className="h-6 w-6 text-indigo-600" />,
    bg: "bg-indigo-50",
    title: "Create a Project",
    description: "Define your software project and set context for the AI engine.",
  },
  {
    step: "02",
    icon: <Upload className="h-6 w-6 text-cyan-600" />,
    bg: "bg-cyan-50",
    title: "Upload Requirements",
    description: "Add SRS documents, meeting transcripts, client emails, or business notes.",
  },
  {
    step: "03",
    icon: <GitBranch className="h-6 w-6 text-emerald-600" />,
    bg: "bg-emerald-50",
    title: "Generate Your Plan",
    description: "Orion AI extracts requirements, estimates effort, and builds sprint plans instantly.",
  },
];

interface EmptyStateProps {
  onCreateProject?: () => void;
}

export function EmptyState({ onCreateProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center max-w-2xl mx-auto">
      {/* AI Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-bold text-indigo-700 select-none mb-8">
        <Sparkles className="h-3 w-3 animate-pulse" />
        Orion AI is ready to analyze your first project
      </div>

      {/* Graphic placeholder */}
      <div className="relative w-40 h-40 mb-8 select-none">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-100 via-violet-100 to-cyan-100 flex items-center justify-center">
          <div className="h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-inner">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </div>
        </div>
        {/* Orbit dots */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute h-3 w-3 rounded-full bg-indigo-300 border-2 border-white shadow-sm"
            style={{
              top: `${50 - 45 * Math.sin((deg * Math.PI) / 180)}%`,
              left: `${50 + 45 * Math.cos((deg * Math.PI) / 180)}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
      </div>

      <h2 className="text-2xl font-black text-zinc-900 tracking-tight mb-3">
        Welcome to Orion
      </h2>
      <p className="text-sm font-medium text-zinc-500 leading-relaxed mb-10 max-w-md">
        Orion transforms your unstructured project information into a complete execution plan — requirements, risks, sprints, and timelines — powered by AI.
      </p>

      {/* 3-step guide */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {steps.map(({ step, icon, bg, title, description }, i) => (
          <div key={step} className="relative flex flex-col items-center text-center p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
            <span className="text-[10px] font-extrabold text-zinc-300 uppercase tracking-widest mb-3">{step}</span>
            <div className={`h-12 w-12 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              {icon}
            </div>
            <h3 className="text-xs font-black text-zinc-900 mb-1">{title}</h3>
            <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">{description}</p>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-200" />
            )}
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onCreateProject}
        className="inline-flex items-center justify-center h-12 rounded-xl bg-indigo-600 px-8 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/30 active:scale-[0.98] transition-all duration-200"
      >
        <BrainCircuit className="mr-2 h-4 w-4" />
        Create Your First Project
      </button>
    </div>
  );
}
