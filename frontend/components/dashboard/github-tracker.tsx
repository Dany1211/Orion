"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  FolderGit2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Users,
  Star,
  GitFork,
  Check,
  ChevronRight,
  Code2,
  Link as LinkIcon,
  Unlink,
  Layers,
  Flame,
  ArrowUpRight
} from "lucide-react";

function GithubIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

interface GithubTrackerProps {
  projectId: string;
  project: any;
  requirements: any[];
  sprints: any[];
  onProjectUpdate?: (updatedProject: any) => void;
}

export function GithubTracker({
  projectId,
  project,
  requirements = [],
  sprints = [],
  onProjectUpdate,
}: GithubTrackerProps) {
  const [repoInput, setRepoInput] = React.useState(project?.metadata?.github?.repoUrl || project?.metadata?.github?.fullName || "");
  const [branchInput, setBranchInput] = React.useState(project?.metadata?.github?.branch || "main");
  const [tokenInput, setTokenInput] = React.useState("");
  const [showTokenInput, setShowTokenInput] = React.useState(false);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<any>(null);
  const [activeSubTab, setActiveSubTab] = React.useState<"analysis" | "commits" | "pulls" | "contributors">("analysis");

  // Load existing data from database / server on mount
  React.useEffect(() => {
    let isMounted = true;

    async function loadSavedRepo() {
      if (!projectId) return;
      try {
        const res = await fetch(`/api/github/track?projectId=${projectId}`);
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json.success && json.repo) {
            setData(json);
            setRepoInput(json.repo.fullName || json.repo.url || "");
            setBranchInput(json.repo.currentBranch || "main");
            return;
          }
        }
      } catch (e) {
        console.error("Failed to fetch saved GitHub integration:", e);
      }

      // LocalStorage fallback
      const savedData = localStorage.getItem(`orion_gh_analysis_${projectId}`);
      if (savedData && isMounted) {
        try {
          const parsed = JSON.parse(savedData);
          setData(parsed);
          setRepoInput(parsed.repo?.fullName || "");
        } catch (e) {}
      } else if (project?.metadata?.github?.fullName && isMounted) {
        setRepoInput(project.metadata.github.fullName);
      }
    }

    loadSavedRepo();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleSync = async (overrideRepo?: string, overrideBranch?: string) => {
    const targetRepo = overrideRepo || repoInput.trim();
    const targetBranch = overrideBranch || branchInput.trim() || "main";

    if (!targetRepo) {
      setError("Please enter a GitHub repository (e.g. Dany1211/Orion or https://github.com/owner/repo)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/github/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          repoUrl: targetRepo,
          branch: targetBranch,
          token: tokenInput.trim() || undefined,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to fetch GitHub repository details");
      }

      setData(result);
      localStorage.setItem(`orion_gh_analysis_${projectId}`, JSON.stringify(result));

      if (onProjectUpdate && project) {
        onProjectUpdate({
          ...project,
          metadata: {
            ...project.metadata,
            github: {
              ...project.metadata?.github,
              fullName: result.repo.fullName,
              repoUrl: result.repo.url,
              branch: targetBranch,
              progressPercentage: result.aiAnalysis?.progressPercentage,
              lastSyncedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while syncing with GitHub.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Disconnect this GitHub repository from this project?")) {
      setData(null);
      setRepoInput("");
      localStorage.removeItem(`orion_gh_analysis_${projectId}`);
      try {
        await fetch(`/api/github/track?projectId=${projectId}`, { method: "DELETE" });
      } catch (e) {}
      if (onProjectUpdate && project) {
        const meta = { ...project.metadata };
        delete meta.github;
        onProjectUpdate({ ...project, metadata: meta });
      }
    }
  };

  const isConnected = Boolean(data?.repo || project?.metadata?.github?.fullName);

  return (
    <div className="space-y-6">
      {/* Top Banner / Connect Form */}
      {!isConnected ? (
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center text-white shadow-lg">
              <GithubIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Connect GitHub Repository
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI Code Tracking
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Orion AI tracks recent commits, pull requests, and merges to calculate real code progress against your extracted requirements.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSync();
            }}
            className="space-y-4 max-w-2xl mt-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  GitHub Repository <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={repoInput}
                    onChange={(e) => setRepoInput(e.target.value)}
                    placeholder="e.g. Dany1211/Orion or https://github.com/owner/repo"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Default Branch
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={branchInput}
                    onChange={(e) => setBranchInput(e.target.value)}
                    placeholder="main"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                {showTokenInput ? "− Hide Private Repo Token" : "+ Add Personal Access Token (for Private Repositories)"}
              </button>
              {showTokenInput && (
                <div className="mt-2">
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional, for private repos)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !repoInput.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Commits & Requirements...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Connect & Run AI Progress Analysis
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* Connected Repository Dashboard */
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md">
                  <GithubIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-zinc-900 flex items-center gap-1.5">
                      {data?.repo?.fullName || project?.metadata?.github?.fullName}
                    </h3>
                    <a
                      href={data?.repo?.url || project?.metadata?.github?.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded transition-colors"
                      title="Open on GitHub"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                    <span className="flex items-center gap-1 font-medium bg-zinc-100 px-2 py-0.5 rounded text-zinc-700">
                      <GitBranch className="w-3.5 h-3.5 text-zinc-500" />
                      {data?.repo?.currentBranch || project?.metadata?.github?.branch || "main"}
                    </span>
                    {data?.repo?.stars !== undefined && (
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {data.repo.stars} stars
                      </span>
                    )}
                    {data?.repo?.openIssues !== undefined && (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-zinc-400" />
                        {data.repo.openIssues} issues
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSync()}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-semibold text-xs transition-colors border border-indigo-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Syncing..." : "Sync & AI Analyze"}
                </button>

                <button
                  onClick={handleDisconnect}
                  title="Disconnect repository"
                  className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-zinc-200"
                >
                  <Unlink className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* AI Progress Overview Card */}
          {data?.aiAnalysis && (
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">AI Code Progress & Velocity</h4>
                    <p className="text-[11px] text-slate-400">Real-time analysis against project requirements</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    data.aiAnalysis.velocityStatus === "accelerating"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : data.aiAnalysis.velocityStatus === "on_track"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}>
                    {data.aiAnalysis.velocityStatus ? data.aiAnalysis.velocityStatus.replace("_", " ") : "Active"}
                  </span>
                </div>
              </div>

              {/* Progress Bar & Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 mb-4">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Estimated Code Implementation</span>
                    <span className="text-indigo-400 font-extrabold text-sm">{data.aiAnalysis.progressPercentage || 0}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, data.aiAnalysis.progressPercentage || 0)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {data.aiAnalysis.executiveSummary}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tracked Commits</span>
                  <p className="text-lg font-black text-white">{data.commits?.length || 0}</p>
                  <span className="text-[11px] text-slate-400">On branch {data.repo?.currentBranch || "main"}</span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">PRs & Issues</span>
                  <p className="text-lg font-black text-white">
                    {(data.pullRequests?.length || 0) + (data.issues?.length || 0)}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {data.pullRequests?.filter((p: any) => p.merged).length || 0} merged PRs
                  </span>
                </div>
              </div>

              {/* Action items & Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {data.aiAnalysis.keyHighlights?.length > 0 && (
                  <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
                    <span className="font-bold text-indigo-300 text-[11px] flex items-center gap-1.5 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" /> Key Highlights
                    </span>
                    <ul className="space-y-1 text-slate-300 text-[11px]">
                      {data.aiAnalysis.keyHighlights.map((hl: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-indigo-400 mt-0.5">•</span>
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.aiAnalysis.nextRecommendedAction && (
                  <div className="p-3 bg-indigo-950/40 rounded-xl border border-indigo-800/40">
                    <span className="font-bold text-blue-300 text-[11px] flex items-center gap-1.5 mb-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-400" /> Next Recommended Action
                    </span>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {data.aiAnalysis.nextRecommendedAction}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tabs: Requirement Traceability / Commits / PRs / Contributors */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-zinc-200 bg-zinc-50/70 px-4">
              {[
                { id: "analysis", label: "Requirement Traceability", icon: Layers, count: data?.aiAnalysis?.requirementProgress?.length },
                { id: "commits", label: "Recent Commits", icon: GitCommit, count: data?.commits?.length },
                { id: "pulls", label: "Pull Requests", icon: GitPullRequest, count: data?.pullRequests?.length },
                { id: "contributors", label: "Contributors", icon: Users, count: data?.contributors?.length },
              ].map((subTab) => {
                const active = activeSubTab === subTab.id;
                return (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveSubTab(subTab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-colors ${
                      active
                        ? "border-indigo-600 text-indigo-700 bg-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    <subTab.icon className={`w-3.5 h-3.5 ${active ? "text-indigo-600" : "text-zinc-400"}`} />
                    {subTab.label}
                    {subTab.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        active ? "bg-indigo-100 text-indigo-700" : "bg-zinc-200 text-zinc-600"
                      }`}>
                        {subTab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-5">
              {/* Requirement Traceability Matrix */}
              {activeSubTab === "analysis" && (
                <div className="space-y-3">
                  {data?.aiAnalysis?.requirementProgress?.length ? (
                    data.aiAnalysis.requirementProgress.map((item: any, idx: number) => {
                      const isCompleted = item.status === "completed";
                      const isInProgress = item.status === "in_progress";
                      return (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-zinc-100 hover:border-zinc-200 bg-zinc-50/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isInProgress
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-zinc-200 text-zinc-600"
                              }`}>
                                {item.status.replace("_", " ")}
                              </span>
                              <h5 className="text-xs font-bold text-zinc-900">{item.requirementTitle}</h5>
                            </div>
                            <p className="text-[11px] text-zinc-500">{item.note}</p>

                            {item.matchedCommits?.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-[10px] text-zinc-400 font-semibold">Matched commits:</span>
                                {item.matchedCommits.map((sha: string, cIdx: number) => (
                                  <span key={cIdx} className="font-mono text-[10px] bg-zinc-100 text-zinc-700 px-1.5 py-0.5 rounded border border-zinc-200">
                                    {sha}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">Confidence</span>
                            <p className="text-xs font-black text-zinc-700">{Math.round((item.confidence || 0.8) * 100)}%</p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-zinc-400 text-xs">
                      No requirement matches generated yet. Click "Sync & AI Analyze" to compute code progress.
                    </div>
                  )}
                </div>
              )}

              {/* Commits Feed */}
              {activeSubTab === "commits" && (
                <div className="space-y-2.5">
                  {data?.commits?.length ? (
                    data.commits.map((c: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 bg-white hover:bg-zinc-50/50 transition-all text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {c.authorAvatar ? (
                            <img src={c.authorAvatar} alt={c.author} className="w-6 h-6 rounded-full" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-zinc-200 flex items-center justify-center text-[10px] font-bold text-zinc-600">
                              {c.author?.[0] || "U"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 truncate max-w-lg">{c.message}</p>
                            <span className="text-[11px] text-zinc-400">
                              {c.author} committed {c.date ? new Date(c.date).toLocaleDateString() : ""}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-mono text-[11px] bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200">
                            {c.sha}
                          </span>
                          <a
                            href={c.htmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-zinc-700 p-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-zinc-400 text-xs">No commits tracked.</p>
                  )}
                </div>
              )}

              {/* Pull Requests */}
              {activeSubTab === "pulls" && (
                <div className="space-y-2.5">
                  {data?.pullRequests?.length ? (
                    data.pullRequests.map((p: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 bg-white text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <GitPullRequest className={`w-4 h-4 ${p.merged ? "text-purple-600" : p.state === "open" ? "text-emerald-600" : "text-rose-500"}`} />
                          <div>
                            <p className="font-bold text-zinc-900">
                              #{p.number} {p.title}
                            </p>
                            <span className="text-[11px] text-zinc-400">
                              by {p.author} • {p.merged ? "Merged" : p.state}
                            </span>
                          </div>
                        </div>

                        <a
                          href={p.htmlUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1"
                        >
                          View PR <ArrowUpRight className="w-3 h-3" />
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-6 text-zinc-400 text-xs">No pull requests found.</p>
                  )}
                </div>
              )}

              {/* Contributors */}
              {activeSubTab === "contributors" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {data?.contributors?.length ? (
                    data.contributors.map((ct: any, i: number) => (
                      <a
                        key={i}
                        href={ct.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50 transition-all text-xs"
                      >
                        <img src={ct.avatarUrl} alt={ct.login} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-bold text-zinc-900">{ct.login}</p>
                          <span className="text-[11px] text-zinc-500">{ct.contributions} commits</span>
                        </div>
                      </a>
                    ))
                  ) : (
                    <p className="text-center col-span-full py-6 text-zinc-400 text-xs">No contributors data available.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
