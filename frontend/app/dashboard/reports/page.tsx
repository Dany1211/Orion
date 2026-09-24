"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, FileJson, Sparkles, RefreshCw, Cpu, CheckCircle2, Loader2, FileX } from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";

interface Report {
  id: string;
  title: string;
  report_type: string;
  created_at: string;
  is_published: boolean;
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  requirement_summary: "Requirement Summary",
  sprint_plan: "Sprint Plan",
  risk_matrix: "Risk Matrix",
  full_project_plan: "Full Project Plan",
  estimation: "Estimation Report",
};

export default function ReportsPage() {
  const { projects, activeProjectId, setActiveProjectId, user } = useWorkspace();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(activeProjectId || "");
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [genSuccess, setGenSuccess] = React.useState(false);
  const [reportType, setReportType] = React.useState("requirement_summary");

  React.useEffect(() => {
    if (activeProjectId) setSelectedProjectId(activeProjectId);
    else if (projects.length > 0 && !selectedProjectId) setSelectedProjectId(projects[0].id);
  }, [activeProjectId, projects]);

  const handleProjectChange = (val: string) => {
    setSelectedProjectId(val);
    setActiveProjectId(val || null);
  };

  const fetchReports = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    const supabase = createClient() as any;
    const { data } = await supabase
      .from("project_reports")
      .select("id, title, report_type, created_at, is_published")
      .eq("project_id", selectedProjectId)
      .order("created_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchReports();
  }, [selectedProjectId]);

  const handleGenerateReport = async () => {
    if (!selectedProjectId || !user?.id) return;
    setIsGenerating(true);
    setGenSuccess(false);

    const supabase = createClient() as any;
    const project = projects.find((p) => p.id === selectedProjectId);
    const title = `${REPORT_TYPE_LABELS[reportType] || "Report"} — ${project?.name || "Project"}`;

    const { error } = await supabase.from("project_reports").insert({
      project_id: selectedProjectId,
      generated_by: user.id,
      report_type: reportType,
      title,
      is_published: false,
      content: { generated_at: new Date().toISOString(), status: "compiled" },
    });

    setIsGenerating(false);
    if (!error) {
      setGenSuccess(true);
      fetchReports();
      setTimeout(() => setGenSuccess(false), 4000);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6">
      <div>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">Reports & Deliverables</h1>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Export full software plans, estimation reports, sprint schedules, and risk matrices.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Generate Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Generate Intelligence Report</h3>
            </div>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Compile Orion's extracted modules, timeline estimation models, sprint boards, and technical risk matrices into a client-facing report.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full pl-3 pr-8 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
                >
                  {projects.length === 0 && <option value="">No Active Projects</option>}
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>📁 {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full pl-3 pr-8 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
                >
                  {Object.entries(REPORT_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || !selectedProjectId}
                className="w-full h-11 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isGenerating ? (
                  <><RefreshCw className="h-4 w-4 animate-spin" /> Compiling Report…</>
                ) : (
                  <><Cpu className="h-4 w-4" /> Generate Report</>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {genSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-black text-emerald-900">Report Generated!</h4>
                  <p className="text-xs text-emerald-700 font-medium mt-1">Your report has been saved and appears in the list.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Reports List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Available Reports</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{reports.length} total</span>
              <button onClick={fetchReports} className="h-6 w-6 rounded-md hover:bg-zinc-100 flex items-center justify-center">
                <RefreshCw className="h-3 w-3 text-zinc-400" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10 bg-white rounded-2xl border border-zinc-100">
              <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center">
              <FileX className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-zinc-600">No reports yet</p>
              <p className="text-[10px] text-zinc-400 mt-1">Generate your first report using the panel.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id} className="bg-white p-4 rounded-2xl border border-zinc-150 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-zinc-800 leading-tight truncate">{report.title}</h4>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">
                        {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-50 pt-3 text-[10px] font-semibold text-zinc-400">
                    <span>{formatDate(report.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      <button className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors" title="Export JSON">
                        <FileJson className="h-3.5 w-3.5" />
                      </button>
                      <button className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-indigo-600 transition-colors" title="Download">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
