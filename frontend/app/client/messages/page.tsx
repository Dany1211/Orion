"use client";

import * as React from "react";
import { ClientMessagesHub } from "@/components/client/client-messages-hub";
import { useClientPortal } from "@/lib/contexts/client-portal-context";

export default function ClientMessagesPage() {
  const { clientSession } = useClientPortal();

  const currentProjectName =
    clientSession?.assigned_projects?.find((p) => p.id === clientSession.project_id)?.name ||
    clientSession?.client_company ||
    "Assigned Project";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Project Manager Direct Communication</h1>
          <p className="text-xs text-zinc-500 font-medium">
            Real-time project discussion, feedback, and deliverable review with your engineering team.
          </p>
        </div>
      </div>

      <ClientMessagesHub
        currentRole="client"
        projectId={clientSession?.project_id || "default"}
        projectName={currentProjectName}
      />
    </div>
  );
}
