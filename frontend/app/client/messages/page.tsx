"use client";

import * as React from "react";
import { ClientMessagesHub } from "@/components/client/client-messages-hub";
import { useClientPortal } from "@/lib/contexts/client-portal-context";

export default function ClientMessagesPage() {
  const { clientSession } = useClientPortal();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Project Manager Direct Hub</h1>
          <p className="text-xs text-zinc-500 font-medium">
            Dedicated real-time discussion channel with your Lead Project Manager Alex Rivera.
          </p>
        </div>
      </div>

      <ClientMessagesHub
        currentRole="client"
        projectId={clientSession?.project_id || "default"}
        projectName="FinTech Mobile Gateway"
      />
    </div>
  );
}
