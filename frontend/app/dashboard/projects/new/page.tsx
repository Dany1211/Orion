"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, BrainCircuit, Sparkles, ChevronRight, ChevronLeft, 
  Settings2, Upload, FileText, CheckCircle2, Loader2, Code, Users, Calendar, X
} from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";

const DOMAINS = [
  "Fintech & Banking",
  "E-Commerce & Retail",
  "Healthcare & Biotech",
  "SaaS & Enterprise Platforms",
  "Artificial Intelligence / ML",
  "Logistics & Supply Chain",
  "Edtech & Learning Management",
  "Other / Custom Industry"
];

const TECH_SUGGESTIONS = [
  "React / Next.js", "Vue.js", "TypeScript", "Node.js", "Python / FastAPI", 
  "Go", "Java / Spring Boot", "PostgreSQL", "MongoDB", "Redis", 
  "Docker", "AWS", "Kubernetes", "Stripe API"
];

export default function NewProjectPage() {
  const router = useRouter();
  const { user, organization, refreshProjects } = useWorkspace();
  const [step, setStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successAnimation, setSuccessAnimation] = React.useState(false);

  // Form State
  // Step 1: Basic Info
  const [name, setName] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [domain, setDomain] = React.useState(DOMAINS[0]);

  // Step 2: Architecture & Planning
  const [techStack, setTechStack] = React.useState<string[]>([]);
  const [techInput, setTechInput] = React.useState("");
  const [teamSize, setTeamSize] = React.useState(5);
  const [sprintCycle, setSprintCycle] = React.useState("2_weeks");

  // Step 3: Raw Requirements Boostrap (Optional)
  const [sourceTitle, setSourceTitle] = React.useState("");
  const [sourceType, setSourceType] = React.useState("srs_document");
  const [sourceText, setSourceText] = React.useState("");

  const handleAddTech = (tech: string) => {
    const trimmed = tech.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
    }
    setTechInput("");
  };

  const handleRemoveTech = (tech: string) => {
    setTechStack(techStack.filter((t) => t !== tech));
  };

  const handleSubmit = async () => {
    if (!name.trim() || !organization?.id || !user?.id) return;

    setIsSubmitting(true);
    const supabase = createClient() as any;

    // Pick random gradient color scheme
    const colors = [
      "from-indigo-500 to-violet-600",
      "from-cyan-500 to-blue-600",
      "from-emerald-500 to-teal-600",
      "from-amber-500 to-orange-600",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // 1. Insert Project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        description: desc.trim() || null,
        organization_id: organization.id,
        created_by: user.id,
        status: sourceText.trim() ? "analyzing" : "draft",
        domain: domain,
        tech_stack: techStack,
        team_size: teamSize,
        color: randomColor,
        metadata: {
          sprint_cycle: sprintCycle,
        }
      })
      .select()
      .single();

    if (projectError) {
      console.error("Error creating project:", projectError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Insert Requirement Source if provided
    if (sourceText.trim()) {
      const { error: sourceError } = await supabase
        .from("requirement_sources")
        .insert({
          project_id: project.id,
          uploaded_by: user.id,
          source_type: sourceType,
          title: sourceTitle.trim() || "Initial Requirement Specifications",
          raw_text: sourceText.trim(),
          status: "processed",
        });

      if (sourceError) {
        console.error("Error saving project source:", sourceError.message);
      }
    }

    await refreshProjects();
    setIsSubmitting(false);
    
    // Trigger premium workspace generation transition
    setSuccessAnimation(true);
    
    // Redirect to dashboard after showing loading states
    setTimeout(() => {
      router.push("/dashboard");
    }, 3000);
  };

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 flex flex-col items-center justify-center relative">
      <AnimatePresence>
        {!successAnimation ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-2xl bg-white border border-zinc-150 rounded-2xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header & Steps indicator */}
            <div className="px-8 pt-8 pb-5 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-black text-zinc-900 tracking-tight">Configure Workspace</h1>
                <p className="text-xs font-semibold text-zinc-400 mt-1">Configure your product context & tech parameters.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-zinc-50 border border-zinc-200 px-3 py-1.5 rounded-xl">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                      step === s ? "bg-indigo-600 scale-110" : step > s ? "bg-indigo-300" : "bg-zinc-200"
                    }`}
                  />
                ))}
                <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider ml-1.5">Step {step} of 3</span>
              </div>
            </div>

            {/* Steps Container */}
            <div className="p-8 flex-1">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450 flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-zinc-400" /> Project Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Next-Gen Banking Core"
                        className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">Project Description</label>
                      <textarea
                        rows={4}
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Describe the business objectives, core problems, and desired outputs of this project workspace…"
                        className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">Business Domain</label>
                      <select
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        className="w-full pl-3 pr-8 h-11 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none cursor-pointer"
                      >
                        {DOMAINS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    {/* Tech Stack */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450 flex items-center gap-1">
                        <Code className="h-3 w-3 text-zinc-400" /> Technology Architecture
                      </label>
                      
                      {/* Tokens list */}
                      {techStack.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
                          {techStack.map((tech) => (
                            <span key={tech} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700">
                              {tech}
                              <button type="button" onClick={() => handleRemoveTech(tech)} className="hover:text-indigo-900">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={techInput}
                          onChange={(e) => setTechInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTech(techInput);
                            }
                          }}
                          placeholder="Type a technology (e.g. NextJS) and press Enter…"
                          className="flex-1 h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddTech(techInput)}
                          className="h-11 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Tech suggestions */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Quick Suggestions</span>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {TECH_SUGGESTIONS.slice(0, 7).map((sugg) => (
                            <button
                              type="button"
                              key={sugg}
                              onClick={() => handleAddTech(sugg)}
                              className="px-2 py-0.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                            >
                              + {sugg}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Team Size and Sprint Cycle */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-455 flex items-center gap-1">
                          <Users className="h-3 w-3 text-zinc-400" /> Target Team Size
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={teamSize}
                          onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                          className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-455 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-zinc-400" /> Sprint Cycle Duration
                        </label>
                        <select
                          value={sprintCycle}
                          onChange={(e) => setSprintCycle(e.target.value)}
                          className="w-full px-3 h-11 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none cursor-pointer"
                        >
                          <option value="1_week">1 Week Cycles</option>
                          <option value="2_weeks">2 Weeks Cycles</option>
                          <option value="3_weeks">3 Weeks Cycles</option>
                          <option value="4_weeks">4 Weeks Cycles</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                      <Sparkles className="h-4.5 w-4.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-indigo-800">Bootstrap Workspace (Optional)</p>
                        <p className="text-[10px] text-indigo-700 font-semibold leading-relaxed">
                          Paste initial requirements, kickoff logs, or PRDs. Orion will run its Requirement Intelligence Agent immediately to build your roadmap.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">Source Title</label>
                        <input
                          type="text"
                          value={sourceTitle}
                          onChange={(e) => setSourceTitle(e.target.value)}
                          placeholder="e.g. Project Specs Email"
                          className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450">Source Type</label>
                        <select
                          value={sourceType}
                          onChange={(e) => setSourceType(e.target.value)}
                          className="w-full px-3 h-11 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none cursor-pointer"
                        >
                          <option value="srs_document">SRS Document</option>
                          <option value="meeting_transcript">Meeting Transcript</option>
                          <option value="client_email">Client Email</option>
                          <option value="business_notes">Business Notes</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-450 flex items-center gap-1">
                        <FileText className="h-3 w-3 text-zinc-400" /> Specification Content
                      </label>
                      <textarea
                        rows={5}
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Paste requirement texts, client spec emails, or audio log transcripts here…"
                        className="w-full p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none resize-none"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Buttons */}
            <div className="px-8 py-5 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (step > 1) setStep(step - 1);
                  else router.push("/dashboard");
                }}
                className="h-10 px-4 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-100 bg-white transition-colors flex items-center gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                {step === 1 ? "Cancel" : "Back"}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (name.trim()) setStep(step + 1);
                  }}
                  disabled={!name.trim()}
                  className="h-10 px-4 rounded-xl bg-indigo-600 disabled:opacity-50 text-xs font-bold text-white shadow-md hover:bg-indigo-700 flex items-center gap-1.5"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-10 px-5 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating Workspace…
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="h-4 w-4" />
                      Generate Workspace
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* Dynamic Workspace Generation loading screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white border border-zinc-150 rounded-2xl p-8 shadow-2xl space-y-6 text-center"
          >
            <div className="relative h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-inner">
              <BrainCircuit className="h-8 w-8 animate-spin" />
              <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-black text-white">AI</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-black text-zinc-900 tracking-tight">Generating Workspace</h3>
              <p className="text-xs font-semibold text-zinc-400 leading-relaxed px-4">
                Configuring domain models, tech architectures, sprint plans, and bootstrapping RLS profiles…
              </p>
            </div>

            <div className="flex items-center justify-center gap-1.5 pt-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-50 animate-bounce" />
              <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-widest">Workspace Ready!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
