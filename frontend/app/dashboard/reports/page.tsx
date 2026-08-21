"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, FileJson, Sparkles, RefreshCw, Layers, Cpu, CheckCircle2, ArrowRight } from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";

// Mock reports data
const MOCK_REPORTS = [
  {
    id: "rep-1",
    title: "Software Requirement Specification (SRS) Summary",
    report_type: "requirement_summary",
    created_at: "2 hours ago",
    size: "1.2 MB",
    pages: 14,
  },
  {
    id: "rep-2",
    title: "AI-Generated Sprint Planning Roadmap",
    report_type: "sprint_plan",
    created_at: "1 day ago",
    size: "840 KB",
    pages: 6,
  },
  {
    id: "rep-3",
    title: "Complexity Estimation & Effort Report",
    report_type: "estimation",
    created_at: "2 days ago",
    size: "620 KB",
    pages: 4,
  },
  {
    id: "rep-4",
    title: "Project Scope Blocker & Risk Matrix",
    report_type: "risk_matrix",
    created_at: "3 days ago",
    size: "1.1 MB",
    pages: 8,
  }
];

export default function ReportsPage() {
  const { projects } = useWorkspace();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [genSuccess, setGenSuccess] = React.useState(false);

  React.useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  const handleGenerateReport = async () => {
    if (!selectedProjectId) return;
    setIsGenerating(true);
    setGenSuccess(false);

    // Simulate PDF report compilation
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setIsGenerating(false);
    setGenSuccess(true);
  };

  const getReportIcon = (type: string) => {
    return <FileText className="h-5 w-5 text-indigo-600" />;
  };

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">Reports & Deliverables</h1>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Export full software plans, estimation reports, sprint schedules, and risk matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Generate Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Action card */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Generate Intelligence Report</h3>
            </div>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Compile Orion's extracted modules, timeline estimation models, sprint boards, and technical risk matrices into a single client-facing PDF document.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Select Project Context</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full pl-3 pr-8 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
                >
                  {projects.length === 0 && <option value="">No Active Projects</option>}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>📁 {p.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || !selectedProjectId}
                className="w-full h-11 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Compiling Report…
                  </>
                ) : (
                  <>
                    <Cpu className="h-4.5 w-4.5" /> Compile New Master Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Success Banner */}
          <AnimatePresence>
            {genSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm"
              >
                <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-black text-emerald-900 leading-none">Master Plan Compiled</h4>
                  <p className="text-xs text-emerald-700 font-medium leading-relaxed mt-1">
                    Orion compiled the full SRS document, estimations, and sprint plans into your deliverables folder.
                  </p>
                  <button
                    onClick={() => setGenSuccess(false)}
                    className="mt-3 h-8 px-4 bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700 rounded-lg shadow-sm"
                  >
                    Download Compiled PDF
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Reports Grid list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Available Reports</h3>
            <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{MOCK_REPORTS.length} total</span>
          </div>

          <div className="space-y-3">
            {MOCK_REPORTS.map((report) => (
              <div
                key={report.id}
                className="bg-white p-4 rounded-2xl border border-zinc-150 shadow-sm hover:shadow-md hover:border-zinc-200 transition-all duration-200 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    {getReportIcon(report.report_type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-zinc-800 leading-tight truncate">{report.title}</h4>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                      {report.report_type.replace("_", " ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-50 pt-3 text-[10px] font-semibold text-zinc-400">
                  <span>{report.pages} pages · {report.size}</span>
                  <div className="flex items-center gap-1.5">
                    <button className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors" title="Export JSON">
                      <FileJson className="h-3.5 w-3.5" />
                    </button>
                    <button className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-indigo-600 transition-colors" title="Download PDF">
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
