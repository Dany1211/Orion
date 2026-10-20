"use client";

import * as React from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { VideoMeetingRoom } from "@/components/meeting/video-meeting-room";
import { ClientPortalProvider, useClientPortal } from "@/lib/contexts/client-portal-context";
import { createClient } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

function MeetingContainer() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = (params?.roomId as string) || "orion-sync-789";

  const roleParam = searchParams.get("role") as "pm" | "client" | null;
  const { clientSession } = useClientPortal();

  // Resolve role: explicit ?role= param wins, then clientSession, then default pm
  const userRole = roleParam || (clientSession ? "client" : "pm");

  // ── Fetch real PM name from Supabase auth session ──
  const [pmDisplayName, setPmDisplayName] = React.useState<string>("Project Manager");

  React.useEffect(() => {
    if (userRole !== "pm") return;
    const supabase = createClient() as any;
    supabase.auth.getUser().then(({ data }: any) => {
      const u = data?.user;
      if (!u) return;
      // Try profile full_name first, then user_metadata, then email prefix
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .single()
        .then(({ data: profile }: any) => {
          const name =
            profile?.full_name ||
            u.user_metadata?.full_name ||
            u.user_metadata?.name ||
            u.email?.split("@")[0] ||
            "Project Manager";
          setPmDisplayName(name);
        });
    });
  }, [userRole]);

  const resolvedUserName =
    userRole === "pm"
      ? pmDisplayName
      : clientSession?.client_name || "Client";

  return (
    <VideoMeetingRoom
      roomId={roomId}
      userRole={userRole}
      userName={resolvedUserName}
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
      <React.Suspense
        fallback={
          <div className="h-screen w-full bg-zinc-950 flex items-center justify-center text-white text-xs">
            Loading Meeting Room…
          </div>
        }
      >
        <MeetingContainer />
      </React.Suspense>
    </ClientPortalProvider>
  );
}
