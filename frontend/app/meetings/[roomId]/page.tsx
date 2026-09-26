"use client";

import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { VideoMeetingRoom } from "@/components/meeting/video-meeting-room";
import { ClientPortalProvider, useClientPortal } from "@/lib/contexts/client-portal-context";

export const dynamic = "force-dynamic";

function MeetingContainer() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (params?.roomId as string) || "orion-sync-789";

  const roleParam = searchParams.get("role") as "pm" | "client" | null;
  const { clientSession } = useClientPortal();

  const userRole = roleParam || (clientSession ? "client" : "pm");

  return (
    <VideoMeetingRoom
      roomId={roomId}
      userRole={userRole}
      userName={
        userRole === "pm"
          ? "Alex Rivera (Project Manager)"
          : clientSession?.client_name || "Sarah Jenkins (Client Lead)"
      }
      onLeave={() => {
        if (userRole === "pm") {
          router.push("/dashboard/meetings");
        } else {
          router.push("/client");
        }
      }}
    />
  );
}

export default function MeetingRoomPage() {
  return (
    <ClientPortalProvider>
      <React.Suspense fallback={<div className="h-screen w-full bg-zinc-950 flex items-center justify-center text-white text-xs">Loading Meeting Room…</div>}>
        <MeetingContainer />
      </React.Suspense>
    </ClientPortalProvider>
  );
}
