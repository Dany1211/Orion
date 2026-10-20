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

  // Initial role inference: query param wins, then client portal session, default to pm
  const [userRole, setUserRole] = React.useState<"pm" | "client">(
    roleParam || (clientSession ? "client" : "pm")
  );

  // Dynamic user name
  const [displayName, setDisplayName] = React.useState<string>(
    roleParam === "client"
      ? clientSession?.client_name || "Client Guest"
      : "Project Manager"
  );

  React.useEffect(() => {
    const supabase = createClient() as any;

    supabase.auth.getUser().then(({ data }: any) => {
      const u = data?.user;
      if (u) {
        // Logged-in Orion PM or team member
        if (!roleParam && !clientSession) {
          setUserRole("pm");
        }
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
            if (!roleParam || roleParam === "pm") {
              setDisplayName(name);
            }
          });
      } else {
        // No Supabase auth session: if no explicit role, treat as client guest
        if (!roleParam && !clientSession) {
          setUserRole("client");
          setDisplayName("Client Guest");
        }
      }
    });

    if (roleParam === "client" && clientSession?.client_name) {
      setDisplayName(clientSession.client_name);
    }
  }, [roleParam, clientSession]);

  return (
    <VideoMeetingRoom
      roomId={roomId}
      userRole={userRole}
      userName={displayName}
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
