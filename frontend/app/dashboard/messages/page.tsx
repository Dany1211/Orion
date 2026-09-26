"use client";

import * as React from "react";
import { ClientMessagesHub } from "@/components/client/client-messages-hub";
import { useWorkspace } from "@/lib/contexts/workspace-context";
import { ClientPortalProvider } from "@/lib/contexts/client-portal-context";

function MessagesPageContent() {
  const { projects, activeProjectId } = useWorkspace();
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(activeProjectId || "default");

  const activeProject = projects.find((p) => p.id === selectedProjectId) || {
    id: "default",
    title: "FinTech Mobile Gateway",
  };

  return (
    <div className="p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Client Communication & Discussions</h1>
          <p className="text-xs text-zinc-500 font-medium">
            Direct real-time messaging, deliverable clarifications, and milestone reviews with your clients.
          </p>
        </div>

        {projects.length > 0 && (
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-semibold rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-800 focus:outline-none focus:border-indigo-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <ClientMessagesHub
        currentRole="pm"
        projectId={selectedProjectId}
        projectName={activeProject.title}
      />
    </div>
  );
}

export default function PMDirectMessagesPage() {
  return (
    <ClientPortalProvider>
      <MessagesPageContent />
    </ClientPortalProvider>
  );
}
