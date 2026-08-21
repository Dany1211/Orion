"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Cpu, GitBranch, ShieldAlert } from "lucide-react";

export function VisualPanel() {
  const features = [
    {
      title: "AI Requirement Analysis",
      description: "Parse documentation and auto-generate stories, epics, and specifications.",
      icon: <Cpu className="h-4.5 w-4.5 text-indigo-600" />,
    },
    {
      title: "Intelligent Project Planning",
      description: "Automate timelines, task dependencies, and resource mapping seamlessly.",
      icon: <GitBranch className="h-4.5 w-4.5 text-cyan-600" />,
    },
    {
      title: "Risk & Effort Prediction",
      description: "Forecast bottlenecks, identify scope creep, and predict delivery targets.",
      icon: <ShieldAlert className="h-4.5 w-4.5 text-indigo-600" />,
    },
  ];

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-12 lg:p-16 overflow-hidden bg-gradient-to-br from-zinc-50 via-slate-50 to-indigo-50/30 border-r border-zinc-100 select-none">
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-bg-light opacity-80 pointer-events-none" />

      {/* Subtle colorful background glows */}
      <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[70px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[70px] pointer-events-none" />

      {/* Top Section: Orion Branding */}
      <div className="relative z-10 flex items-center space-x-3.5">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-primary to-cyan-500 flex items-center justify-center shadow-md shadow-primary/20">
          <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 leading-none">
            Orion
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">
            Requirement Intelligence
          </p>
        </div>
      </div>

      {/* Middle Section: Tagline & Features */}
      <div className="relative z-10 flex-1 flex flex-col justify-center my-10 max-w-xl">
        <div className="space-y-4">
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Transform Software Requirements into{" "}
            <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              Intelligent Project Plans.
            </span>
          </h2>
          <p className="text-sm font-medium text-zinc-500 leading-relaxed max-w-md">
            Align your product and engineering teams immediately with AI-driven scopes, epics, sprint tasks, and risk mitigation.
          </p>
        </div>

        {/* Feature Checklists */}
        <div className="mt-10 space-y-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="flex items-start space-x-4 group"
            >
              <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-white border border-zinc-150 flex items-center justify-center shadow-sm group-hover:border-primary/25 transition-all duration-200">
                {feature.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="h-4.5 w-4.5 rounded-full bg-emerald-50 border border-emerald-150 flex items-center justify-center">
                    <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-800">{feature.title}</h3>
                </div>
                <p className="text-xs font-medium text-zinc-500 max-w-sm leading-normal">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom Section: SVG network illustration */}
      <div className="relative z-10 flex items-center justify-between border-t border-zinc-100 pt-6">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-4.5 w-4.5 text-primary animate-pulse" />
          <span className="text-xs font-bold text-zinc-600">Enterprise AI Engine v1.0</span>
        </div>
        <span className="text-[10px] font-bold text-zinc-400">Strictly Light Theme Mode</span>
      </div>
    </div>
  );
}
