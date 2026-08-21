"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Shield, Key, Sparkles, Building2, HelpCircle, Save, CheckCircle2, Copy, Check, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const { organization, refreshOrganization } = useWorkspace();
  const [orgName, setOrgName] = React.useState("");
  const [orgSlug, setOrgSlug] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  
  // API Key state
  const [apiKey, setApiKey] = React.useState("orion_live_sk_8f7b2c9a1d4e6f3g5h7j9k2l8m0n");
  const [copied, setCopied] = React.useState(false);

  // Integrations state
  const [integrations, setIntegrations] = React.useState({
    jira: true,
    linear: false,
    github: true,
  });

  React.useEffect(() => {
    if (organization) {
      setOrgName(organization.name);
      setOrgSlug(organization.slug);
    }
  }, [organization]);

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id || !orgName.trim() || !orgSlug.trim()) return;

    setIsSaving(true);
    setSaveSuccess(false);

    const supabase = createClient() as any;
    const { error } = await supabase
      .from("organizations")
      .update({
        name: orgName.trim(),
        slug: orgSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      })
      .eq("id", organization.id);

    setIsSaving(false);
    if (error) {
      console.error("Error updating organization:", error.message);
      return;
    }

    setSaveSuccess(true);
    await refreshOrganization();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleIntegration = (platform: "jira" | "linear" | "github") => {
    setIntegrations(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  return (
    <div className="min-h-full bg-zinc-50/60 px-5 sm:px-8 py-7 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-zinc-900 tracking-tight">Workspace Settings</h1>
        <p className="text-xs font-medium text-zinc-500 mt-1">
          Customize organization settings, API credentials, integrations, and workspace profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Workspace Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-3">
            <Building2 className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Workspace Profile</h3>
          </div>

          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Workspace URL Slug</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-[10px] font-bold text-zinc-400 select-none">orion.ai/</span>
                  <input
                    type="text"
                    required
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    className="w-full pl-[56px] pr-3 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-50">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-400">
                  Plan Tier: <span className="font-black text-indigo-600 capitalize">{organization?.plan || "Free"}</span>
                </span>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="h-9 px-4 rounded-xl bg-indigo-600 text-xs font-bold text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {isSaving ? "Saving…" : saveSuccess ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Developer API Keys Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-3">
            <Key className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Developer API Credentials</h3>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Use this secret key to authenticate API requests with the Orion CLI or to query extracted requirements pipeline data directly from your CI/CD scripts.
            </p>

            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-xl p-3.5">
              <input
                type="password"
                readOnly
                value={apiKey}
                className="flex-1 bg-transparent border-none text-xs font-mono font-bold text-zinc-700 focus:outline-none select-all"
              />
              <button
                onClick={handleCopyKey}
                className="h-8 px-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-600 flex-shrink-0"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Sync Integrations Card */}
        <div className="bg-white p-6 rounded-2xl border border-zinc-150 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-zinc-50 pb-3">
            <Sparkles className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wide">Dynamic Project Sync</h3>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Automatically sync generated milestones, epics, sprint structures, and tasks directly to downstream project management platforms.
            </p>

            <div className="space-y-3">
              {[
                { key: "jira", name: "Atlassian Jira Integration", desc: "Push sprints and map tasks directly to Jira backlogs automatically." },
                { key: "linear", name: "Linear Platform Sync", desc: "Instantly create Linear issues, cycles, and teams from extracted requirements." },
                { key: "github", name: "GitHub Issues Integration", desc: "Sync generated milestones and tasks directly to GitHub repositories." },
              ].map((plat) => (
                <div key={plat.key} className="flex items-center justify-between p-4 bg-zinc-50 border border-zinc-100 rounded-xl">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-xs font-black text-zinc-800 leading-none">{plat.name}</h4>
                    <p className="text-[10px] text-zinc-400 font-semibold leading-relaxed mt-1">{plat.desc}</p>
                  </div>
                  
                  {/* Toggle button */}
                  <button
                    onClick={() => toggleIntegration(plat.key as any)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 focus:outline-none ${integrations[plat.key as keyof typeof integrations] ? "bg-indigo-600" : "bg-zinc-200"}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${integrations[plat.key as keyof typeof integrations] ? "translate-x-4.5" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
