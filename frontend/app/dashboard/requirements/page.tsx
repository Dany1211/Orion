"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, Sparkles, Filter, Search, ChevronRight, X, ShieldAlert, Cpu, Loader2 } from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";

// Mock template requirements to display if user has no requirements yet
const MOCK_REQUIREMENTS = [
  {
    id: "req-1",
    title: "Biometric Authentication Login",
    description: "The mobile banking application must allow users to securely authenticate and sign in using iOS FaceID or Android fingerprint scan.",
    req_type: "functional",
    priority: "critical",
    status: "confirmed",
    complexity: "medium",
    estimated_effort_hours: 12,
    category: "Security",
    acceptance_criteria: [
      "User can enable biometric login from Account Settings.",
      "FaceID / TouchID biometric scanner prompt is triggered on app launch.",
      "System falls back to 6-digit backup PIN if biometrics fail 3 times."
    ]
  },
  {
    id: "req-2",
    title: "Real-time Inventory Sync",
    description: "Multi-vendor inventory quantities must synchronize automatically in real-time when checkout events occur, preventing double-selling.",
    req_type: "functional",
    priority: "high",
    status: "confirmed",
    complexity: "complex",
    estimated_effort_hours: 24,
    category: "Inventory",
    acceptance_criteria: [
      "Inventory database updates within 200ms of transaction confirmation.",
      "Vendors receive immediate push notification on stock thresholds < 5.",
      "Out-of-stock items dynamically render checkout disable flags."
    ]
  },
  {
    id: "req-3",
    title: "API Performance Latency < 100ms",
    description: "All core product page queries and gateway endpoint requests must respond within 100 milliseconds under a concurrent load of 5,000 active sessions.",
    req_type: "non_functional",
    priority: "medium",
    status: "draft",
    complexity: "complex",
    estimated_effort_hours: 18,
    category: "Performance",
    acceptance_criteria: [
      "95th percentile api latency is tested below 100ms during stress tests.",
      "Edge caching policies are enforced on static product catalog headers.",
      "Redis instances are optimized for quick key-value session lookups."
    ]
  },
  {
    id: "req-4",
    title: "Payment Gateway Encryption standard",
    description: "All checkout queries and credit card transmission lines must fully comply with PCI-DSS guidelines using TLS 1.3 key exchanges.",
    req_type: "non_functional",
    priority: "critical",
    status: "confirmed",
    complexity: "simple",
    estimated_effort_hours: 8,
    category: "Compliance",
    acceptance_criteria: [
      "Credit card raw values are never stored directly in SQL DB.",
      "HTTPS endpoints block TLS versions below 1.2 during client handshakes.",
      "Tokens are validated via Stripe elements secure gateway fields."
    ]
  }
];

export default function RequirementsPage() {
  const { projects } = useWorkspace();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("all");
  const [reqType, setReqType] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedReq, setSelectedReq] = React.useState<any>(null);
  const [dbRequirements, setDbRequirements] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchRequirements = async () => {
    if (selectedProjectId === "all") {
      setDbRequirements([]);
      return;
    }
    setLoading(true);
    const supabase = createClient() as any;
    const { data } = await supabase
      .from("requirements")
      .select("*")
      .eq("project_id", selectedProjectId);
    setDbRequirements(data || []);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchRequirements();
  }, [selectedProjectId]);

  // Fallback to mock requirements if project is "all" or database returns empty list
  const displayRequirements = dbRequirements.length > 0 ? dbRequirements : MOCK_REQUIREMENTS;

  const filteredRequirements = displayRequirements.filter((req) => {
    const matchesSearch = req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.category && req.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = reqType === "all" || req.req_type === reqType;
    const matchesPriority = priorityFilter === "all" || req.priority === priorityFilter;

    return matchesSearch && matchesType && matchesPriority;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "critical": return "bg-red-50 text-red-700 border-red-200";
      case "high": return "bg-orange-50 text-orange-700 border-orange-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-zinc-50 text-zinc-600 border-zinc-200";
    }
  };

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6 relative overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">Requirements Explorer</h1>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Explore functional and non-functional requirements extracted by the Orion Intelligence Agent.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-zinc-150 shadow-sm">
        {/* Project Selector */}
        <div className="relative">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full pl-3 pr-8 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-700 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">📁 All Project Templates</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>📁 {p.name}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search title, description, or category…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={reqType}
            onChange={(e) => setReqType(e.target.value)}
            className="w-full px-3 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="functional">Functional</option>
            <option value="non_functional">Non-Functional</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="w-full px-3 h-9 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 focus:outline-none"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredRequirements.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedReq(req)}
              className="bg-white p-5 rounded-2xl border border-zinc-150 shadow-sm hover:shadow-md hover:border-zinc-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-2 flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${getPriorityBadge(req.priority)}`}>
                    {req.priority}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${req.req_type === "functional" ? "bg-indigo-50 text-indigo-700" : "bg-cyan-50 text-cyan-700"}`}>
                    {req.req_type === "functional" ? "Functional" : "Non-Functional"}
                  </span>
                  {req.category && (
                    <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-150">
                      {req.category}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black text-zinc-900 truncate leading-snug group-hover:text-indigo-600 transition-colors">{req.title}</h3>
                <p className="text-xs font-medium text-zinc-500 line-clamp-1 leading-relaxed">{req.description}</p>
              </div>

              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black text-zinc-800">{req.estimated_effort_hours || 0} hrs</p>
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{req.complexity || "Simple"}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
              </div>
            </div>
          ))}

          {filteredRequirements.length === 0 && (
            <div className="bg-white border border-zinc-150 rounded-2xl p-12 text-center shadow-sm">
              <FileSearch className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-zinc-800">No requirements matched your filters</h3>
              <p className="text-xs text-zinc-400 font-medium mt-1">Try adjusting the search input or selecting another project.</p>
            </div>
          )}
        </div>
      )}

      {/* Details Slide-over Panel */}
      <AnimatePresence>
        {selectedReq && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReq(null)}
              className="absolute inset-0 bg-black"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl z-10 flex flex-col"
            >
              {/* Slide header */}
              <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                  <span className="text-xs font-black text-zinc-900 uppercase tracking-wide">Requirement Details</span>
                </div>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="h-7 w-7 rounded-md hover:bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Slide content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${getPriorityBadge(selectedReq.priority)}`}>
                      {selectedReq.priority}
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${selectedReq.req_type === "functional" ? "bg-indigo-50 text-indigo-700" : "bg-cyan-50 text-cyan-700"}`}>
                      {selectedReq.req_type === "functional" ? "Functional" : "Non-Functional"}
                    </span>
                    {selectedReq.category && (
                      <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 px-2.5 py-0.5 rounded-full border border-zinc-150">
                        {selectedReq.category}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-black text-zinc-900 leading-snug">{selectedReq.title}</h2>
                  <p className="text-xs font-semibold text-zinc-500 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">{selectedReq.description}</p>
                </div>

                {/* Estimate Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="border border-zinc-100 bg-zinc-50/50 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Effort</p>
                    <p className="text-base font-black text-zinc-800 mt-1">{selectedReq.estimated_effort_hours || 0} hrs</p>
                  </div>
                  <div className="border border-zinc-100 bg-zinc-50/50 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Complexity</p>
                    <p className="text-xs font-black text-zinc-800 capitalize mt-1.5">{selectedReq.complexity || "Simple"}</p>
                  </div>
                  <div className="border border-zinc-100 bg-zinc-50/50 p-3.5 rounded-xl text-center">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Status</p>
                    <p className="text-xs font-black text-emerald-700 capitalize mt-1.5">{selectedReq.status}</p>
                  </div>
                </div>

                {/* Acceptance Criteria */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wide">AI-Generated Acceptance Criteria</h4>
                  </div>
                  {selectedReq.acceptance_criteria && selectedReq.acceptance_criteria.length > 0 ? (
                    <ul className="space-y-2">
                      {selectedReq.acceptance_criteria.map((criteria: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-semibold text-zinc-600 leading-relaxed">
                          <span className="h-5 w-5 rounded-md bg-indigo-50 text-indigo-700 font-extrabold flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">{idx + 1}</span>
                          <span className="flex-1">{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-medium text-zinc-400 italic">No acceptance criteria defined.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
