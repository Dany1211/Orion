"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { HelpCircle, Sparkles, BookOpen, Terminal, ChevronDown, CheckCircle2 } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "What requirement sources does Orion support?",
    answer: "Orion is source-agnostic! You can upload full Software Requirement Specifications (SRS) in PDF or Word format, paste raw markdown notes, raw emails from clients, or upload meeting audio transcript text files. Orion parses them all into a normalized format."
  },
  {
    question: "How does the Requirement Intelligence Agent work?",
    answer: "The agent reads your uploaded text context, extracts system modules, maps stakeholders or actors involved, and categorizes functional and non-functional requirements. It then estimates complexity, predicts potential risks (e.g. scope creep), and structures them into actionable sprint plans."
  },
  {
    question: "Can I sync tasks back to my project management tools?",
    answer: "Yes! Orion integrates directly with Jira, Linear, and GitHub. You can toggle sync permissions in Workspace Settings, and with a single click push all generated milestones, epics, and tasks directly to your teams' board."
  },
  {
    question: "How are effort estimations calculated?",
    answer: "Effort estimation is powered by a specialized engineering estimation model trained on software projects complexity. The agent predicts estimates based on modular dependencies, user flow paths, and complexity indicators, generating a detailed timeline forecast."
  }
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = React.useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">Help & Documentation</h1>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Explore quick start guides, developer API snippets, and answers to frequently asked questions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Quick start guide */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-3">
            <BookOpen className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Quick Start Roadmap</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { idx: "1", title: "Add Project Context", text: "Create your project and define the system domain, team velocity, and active technology parameters." },
              { idx: "2", title: "Provide Source Specs", text: "Upload PRDs, raw documents, or kickoff transcripts to feed the Orion Requirement Intelligence parser." },
              { idx: "3", title: "Generate Deliverables", text: "Run the agent to dynamically extract requirements, predict risk factors, and build sprint boards." },
            ].map((step) => (
              <div key={step.idx} className="p-4 bg-zinc-50/50 border border-zinc-100 rounded-xl space-y-2 relative">
                <span className="text-2xl font-black text-zinc-200 absolute top-2 right-3 select-none">{step.idx}</span>
                <h4 className="text-xs font-black text-zinc-800 leading-snug">{step.title}</h4>
                <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed mt-1">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Code snippets */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-3">
            <Terminal className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Developer API Quickstart</h3>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Integrate Orion directly into your automated pipelines. Below is a sample curl script showing how to upload and trigger analysis runs on a file using your API keys.
            </p>

            {/* Code editor mockup */}
            <div className="rounded-xl bg-zinc-950 p-4 font-mono text-[10px] text-zinc-300 border border-zinc-900 overflow-x-auto select-all shadow-inner space-y-1.5 leading-normal">
              <p className="text-zinc-500"># Trigger requirement intelligence agent analysis via curl</p>
              <p>curl -X POST &quot;https://api.orion.ai/v1/projects/YOUR_PROJECT_ID/analyze&quot; \</p>
              <p>&nbsp;&nbsp;-H &quot;Authorization: Bearer YOUR_SECRET_API_KEY&quot; \</p>
              <p>&nbsp;&nbsp;-H &quot;Content-Type: application/json&quot; \</p>
              <p>&nbsp;&nbsp;-d &apos;&#123;</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&quot;source_title&quot;: &quot;Client Email Spec&quot;,</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&quot;source_type&quot;: &quot;client_email&quot;,</p>
              <p>&nbsp;&nbsp;&nbsp;&nbsp;&quot;raw_text&quot;: &quot;Create checkout flow supporting multi-currency billing...&quot;</p>
              <p>&nbsp;&nbsp;&#125;&apos;</p>
            </div>
          </div>
        </div>

        {/* FAQ Toggles */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-3">
            <HelpCircle className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, idx) => {
              const active = openFaq === idx;
              return (
                <div key={idx} className="border border-zinc-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-4 bg-zinc-50/50 hover:bg-zinc-50 text-left transition-colors"
                  >
                    <span className="text-xs font-black text-zinc-800 leading-snug">{faq.question}</span>
                    <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform duration-200 flex-shrink-0 ml-4 ${active ? "rotate-180" : ""}`} />
                  </button>
                  {active && (
                    <div className="p-4 bg-white border-t border-zinc-100 text-xs font-semibold text-zinc-500 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
