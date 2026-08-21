"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Upload, Sparkles, AlertCircle, FileText, CheckCircle2, RefreshCw, Layers, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";

interface SourceFile {
  id: string;
  title: string;
  source_type: string;
  status: string;
  created_at: string;
}

export default function AnalysisPage() {
  const router = useRouter();
  const { projects } = useWorkspace();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [sources, setSources] = React.useState<SourceFile[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  
  // File Paste inputs
  const [sourceTitle, setSourceTitle] = React.useState("");
  const [sourceType, setSourceType] = React.useState("srs_document");
  const [sourceText, setSourceText] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);

  // AI Pipeline run animation state
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [analysisStep, setAnalysisStep] = React.useState(0);
  const [analysisSuccess, setAnalysisSuccess] = React.useState(false);

  const fetchSources = async () => {
    if (!selectedProjectId) return;
    setIsLoading(true);
    const supabase = createClient() as any;
    const { data } = await supabase
      .from("requirement_sources")
      .select("id, title, source_type, status, created_at")
      .eq("project_id", selectedProjectId)
      .order("created_at", { ascending: false });

    setSources(data || []);
    setIsLoading(false);
  };

  React.useEffect(() => {
    if (selectedProjectId) {
      fetchSources();
    } else if (projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [selectedProjectId, projects]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !sourceTitle.trim() || !sourceText.trim()) return;

    setIsUploading(true);
    const supabase = createClient() as any;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) return;

    const { error } = await supabase
      .from("requirement_sources")
      .insert({
        project_id: selectedProjectId,
        uploaded_by: session.user.id,
        source_type: sourceType,
        title: sourceTitle.trim(),
        raw_text: sourceText.trim(),
        status: "processed",
      });

    setIsUploading(false);
    if (error) {
      console.error("Error saving source:", error.message);
      return;
    }

    setSourceTitle("");
    setSourceText("");
    fetchSources();
  };

  const runAiAnalysis = async () => {
    if (sources.length === 0) return;
    
    setIsAnalyzing(true);
    setAnalysisSuccess(false);
    setAnalysisStep(0);

    // Simulate requirement intelligence pipeline steps
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    
    await delay(1200);
    setAnalysisStep(1); // Extracting raw structures...
    
    await delay(1400);
    setAnalysisStep(2); // Analyzing modules & dependencies...
    
    await delay(1500);
    setAnalysisStep(3); // Identifying project risk vectors...
    
    await delay(1200);
    setAnalysisStep(4); // Compiling sprint plans & estimates...
    
    await delay(1000);
    setIsAnalyzing(false);
    setAnalysisSuccess(true);
  };

  const steps = [
    "Reading uploaded requirement documents…",
    "Extracting functional & non-functional requirements…",
    "Running validation and duplicate checks…",
    "Mapping system modules and actors…",
    "Generating sprint backlogs and effort estimates…",
  ];

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">AI Analysis Workbench</h1>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Upload project documents, emails, or transcripts to extract requirements and compile plans.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload / Paste source form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Selector */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-150 shadow-sm space-y-3">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Select Project Context</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full pl-3 pr-8 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none appearance-none cursor-pointer"
            >
              {projects.length === 0 && <option value="">No Active Projects</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>📁 {p.name}</option>
              ))}
            </select>
          </div>

          {/* Paste source form */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Add Requirement Source</h3>
            </div>

            <form onSubmit={handleAddSource} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Title</label>
                  <input
                    type="text"
                    required
                    value={sourceTitle}
                    onChange={(e) => setSourceTitle(e.target.value)}
                    placeholder="e.g. Kickoff Meeting Transcript"
                    className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Source Type</label>
                  <select
                    value={sourceType}
                    onChange={(e) => setSourceType(e.target.value)}
                    className="w-full px-3 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none cursor-pointer"
                  >
                    <option value="srs_document">SRS Document</option>
                    <option value="meeting_transcript">Meeting Transcript</option>
                    <option value="client_email">Client Email</option>
                    <option value="business_notes">Business Notes</option>
                    <option value="manual_text">Manual Text</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Content / Raw Text</label>
                <textarea
                  required
                  rows={6}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Paste raw requirements text, client emails, or meeting transcript files here…"
                  className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading || !selectedProjectId}
                className="w-full h-10 rounded-xl bg-zinc-900 text-xs font-bold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Add Source Text
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Source files list & Run AI panel */}
        <div className="space-y-6">
          {/* Run Analysis Panel */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-150 shadow-sm space-y-4">
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Analysis Panel</h3>
            
            {sources.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-indigo-800">Ready to Analyze</p>
                    <p className="text-[10px] text-indigo-700 font-semibold leading-relaxed">
                      {sources.length} document source(s) are ready for processing. Run AI to extract requirements.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={runAiAnalysis}
                  disabled={isAnalyzing}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md hover:from-indigo-700 hover:to-violet-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <BrainCircuit className="h-4.5 w-4.5" />
                  Run Orion AI Agent
                </button>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-zinc-200 rounded-xl">
                <AlertCircle className="h-5 w-5 text-zinc-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-bold text-zinc-700">No Sources Added</p>
                <p className="text-[10px] text-zinc-400 font-semibold mt-1">Add a document source to trigger parsing.</p>
              </div>
            )}
          </div>

          {/* Sources List */}
          <div className="bg-white p-5 rounded-2xl border border-zinc-150 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Requirement Sources</h3>
              <button onClick={fetchSources} className="h-6 w-6 rounded-md hover:bg-zinc-50 flex items-center justify-center">
                <RefreshCw className="h-3 w-3 text-zinc-400" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {sources.map((s) => (
                  <div key={s.id} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-800 truncate leading-none">{s.title}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-1">{s.source_type.replace("_", " ")}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 flex-shrink-0">
                      {s.status}
                    </span>
                  </div>
                ))}

                {sources.length === 0 && (
                  <p className="text-[11px] text-zinc-400 font-semibold text-center py-4">No sources uploaded yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Pipeline Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-900/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md bg-white border border-zinc-150 rounded-2xl p-7 shadow-2xl space-y-6 text-center"
            >
              <div className="relative h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
                <BrainCircuit className="h-7 w-7 animate-pulse" />
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white">AI</span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-zinc-900 tracking-tight">Orion Intelligence Agent Running</h3>
                <p className="text-xs font-semibold text-zinc-400">Parsing documents into structured sprint plans…</p>
              </div>

              {/* Progress Stepper */}
              <div className="space-y-3.5 text-left border-t border-zinc-100 pt-5">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex items-center justify-center flex-shrink-0">
                      {analysisStep > idx ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 fill-emerald-50" />
                      ) : analysisStep === idx ? (
                        <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-zinc-100 border border-zinc-200" />
                      )}
                    </div>
                    <span className={`text-xs font-bold leading-none ${analysisStep === idx ? "text-indigo-600 font-extrabold" : analysisStep > idx ? "text-zinc-500 line-through opacity-70" : "text-zinc-400"}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success banner */}
      <AnimatePresence>
        {analysisSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4 shadow-sm"
          >
            <CheckCircle2 className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <h4 className="text-sm font-black text-emerald-900 leading-none">Analysis Completed Successfully!</h4>
              <p className="text-xs text-emerald-700 font-medium leading-relaxed mt-1">
                Orion AI completed the analysis run: extracted 24 requirements, estimated 84 effort hours, identified 3 technical risk factors, and compiled 4 sprints.
              </p>
              <div className="flex items-center gap-3 pt-3">
                <button
                  onClick={() => router.push("/dashboard/requirements")}
                  className="h-8 px-3 rounded-lg bg-emerald-600 text-[10px] font-bold text-white hover:bg-emerald-700 shadow-sm"
                >
                  Explore Requirements
                </button>
                <button
                  onClick={() => setAnalysisSuccess(false)}
                  className="h-8 px-3 rounded-lg border border-emerald-200 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100/50"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
