"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface TranscriptSegment {
  id: string;
  speaker_name: string;
  speaker_role: "pm" | "client" | "system";
  text: string;
  confidence: number;
  started_at: string;
  segment_index: number;
  isPending?: boolean;
}

interface UseTranscriptOptions {
  meetingId: string | null;
  projectId: string | null;
  roomId: string;
  speakerName: string;
  speakerRole: "pm" | "client";
  enabled?: boolean;
  onSegmentFinalized?: (seg: TranscriptSegment) => void;
}

interface UseTranscriptReturn {
  segments: TranscriptSegment[];
  interimText: string;
  isTranscribing: boolean;
  isSupported: boolean;
  error: string | null;
  startTranscription: () => void;
  stopTranscription: () => void;
  addRemoteSegment: (seg: TranscriptSegment) => void;
  consolidateToSource: () => Promise<string | null>;
  fullTranscript: string;
  wordCount: number;
  clearTranscript: () => void;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(val: any): boolean {
  return typeof val === "string" && UUID_REGEX.test(val);
}

function checkIsSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /Safari/i.test(ua) && !/Chrome|Chromium|Edg|Android/i.test(ua);
}

export function useMeetingTranscript({
  meetingId,
  projectId,
  roomId,
  speakerName,
  speakerRole,
  enabled = true,
  onSegmentFinalized,
}: UseTranscriptOptions): UseTranscriptReturn {
  // ── States ────────────────────────────────────────────────────────────────
  const [segments, setSegments] = React.useState<TranscriptSegment[]>(() => {
    if (typeof window !== "undefined" && roomId) {
      try {
        const cached = sessionStorage.getItem(`orion_transcript_${roomId}`);
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return [];
  });

  const [interimText, setInterimText] = React.useState<string>("");
  const [isTranscribing, setIsTranscribing] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const [isSupported] = React.useState<boolean>(
    typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  // ── Stable refs to prevent closure stale state ────────────────────────────
  const recognitionRef = React.useRef<any>(null);
  const isTranscribingRef = React.useRef<boolean>(false);
  const segmentIndexRef = React.useRef<number>(segments.length);
  const restartTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSafariRef = React.useRef<boolean>(false);

  React.useEffect(() => {
    isSafariRef.current = checkIsSafari();
  }, []);

  const optionsRef = React.useRef({
    meetingId,
    projectId,
    roomId,
    speakerName,
    speakerRole,
    enabled,
    onSegmentFinalized,
  });

  React.useEffect(() => {
    optionsRef.current = {
      meetingId,
      projectId,
      roomId,
      speakerName,
      speakerRole,
      enabled,
      onSegmentFinalized,
    };
  }, [meetingId, projectId, roomId, speakerName, speakerRole, enabled, onSegmentFinalized]);

  // Persist segments to sessionStorage for instant recovery
  React.useEffect(() => {
    if (typeof window !== "undefined" && roomId && segments.length > 0) {
      try {
        sessionStorage.setItem(`orion_transcript_${roomId}`, JSON.stringify(segments));
      } catch {}
    }
  }, [segments, roomId]);

  // ── Add segment received from remote participant (via broadcast or DB) ────
  const addRemoteSegment = React.useCallback((seg: TranscriptSegment) => {
    if (!seg || !seg.text) return;
    setSegments((prev) => {
      // Avoid duplicate segment
      const exists = prev.some(
        (s) =>
          s.id === seg.id ||
          (s.text.trim().toLowerCase() === seg.text.trim().toLowerCase() &&
            Math.abs(new Date(s.started_at).getTime() - new Date(seg.started_at).getTime()) < 3000)
      );
      if (exists) return prev;
      const updated = [...prev, seg].sort((a, b) => a.segment_index - b.segment_index);
      segmentIndexRef.current = Math.max(segmentIndexRef.current, updated.length);
      return updated;
    });
  }, []);

  // ── Save segment to Supabase (non-blocking) ──────────────────────────────
  const persistSegmentToDb = React.useCallback(
    async (seg: TranscriptSegment) => {
      const { meetingId: mId, projectId: pId, roomId: rId } = optionsRef.current;
      const validMeetingId = isUuid(mId) ? mId : null;
      const validProjectId = isUuid(pId) ? pId : null;

      try {
        const supabase = createClient() as any;
        const insertPayload: Record<string, any> = {
          room_id: rId,
          speaker_name: seg.speaker_name,
          speaker_role: seg.speaker_role,
          text: seg.text,
          confidence: seg.confidence,
          segment_index: seg.segment_index,
          started_at: seg.started_at,
        };

        if (validMeetingId) insertPayload.meeting_id = validMeetingId;
        if (validProjectId) insertPayload.project_id = validProjectId;

        const { data, error } = await supabase
          .from("meeting_transcript_segments")
          .insert(insertPayload)
          .select("id")
          .maybeSingle();

        if (!error && data?.id) {
          setSegments((prev) =>
            prev.map((s) => (s.id === seg.id ? { ...s, id: data.id, isPending: false } : s))
          );
        }
      } catch (err) {
        console.warn("[Transcript] Supabase background sync notice:", err);
      }
    },
    []
  );

  // ── Start Web Speech Recognition ──────────────────────────────────────────
  const startTranscription = React.useCallback(() => {
    if (!isSupported) {
      setErrorMessage("Speech recognition not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isTranscribingRef.current) return;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage("SpeechRecognition engine not found in this browser.");
      return;
    }

    let recognition: any;
    try {
      recognition = new SpeechRecognition();
    } catch (e) {
      console.warn("[Transcript] Could not construct SpeechRecognition:", e);
      return;
    }

    const isSafari = isSafariRef.current;
    // CRITICAL: Safari fails immediately if continuous=true! Chrome/Edge require continuous=true.
    recognition.continuous = !isSafari;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    // Set language matching user locale with en-US fallback
    try {
      recognition.lang = typeof navigator !== "undefined" ? (navigator.language || "en-US") : "en-US";
    } catch {
      recognition.lang = "en-US";
    }

    recognition.onstart = () => {
      isTranscribingRef.current = true;
      setIsTranscribing(true);
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let liveInterim = "";
      const currentSpeaker = optionsRef.current.speakerName || "Speaker";
      const currentRole = optionsRef.current.speakerRole || "pm";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcriptChunk = res[0]?.transcript || "";
        const conf = res[0]?.confidence || 0.95;

        if (res.isFinal) {
          const finalClean = transcriptChunk.trim();
          if (finalClean.length > 0) {
            const nextIdx = segmentIndexRef.current++;
            const newSegment: TranscriptSegment = {
              id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              speaker_name: currentSpeaker,
              speaker_role: currentRole,
              text: finalClean,
              confidence: conf,
              started_at: new Date().toISOString(),
              segment_index: nextIdx,
              isPending: true,
            };

            // IMMEDIATELY commit to local state
            setSegments((prev) => [...prev, newSegment]);
            setInterimText("");

            // Notify parent room to broadcast in real time to the other participant!
            if (optionsRef.current.onSegmentFinalized) {
              optionsRef.current.onSegmentFinalized(newSegment);
            }

            // Save to database
            persistSegmentToDb(newSegment);
          }
        } else {
          liveInterim += transcriptChunk;
        }
      }

      if (liveInterim.trim()) {
        setInterimText(liveInterim.trim());
      }
    };

    recognition.onerror = (event: any) => {
      // Benign non-fatal events:
      if (event.error === "no-speech" || event.error === "aborted") {
        return;
      }
      if (event.error === "not-allowed") {
        setErrorMessage(
          "Microphone speech access was blocked. Please grant microphone permissions in your browser and macOS System Settings."
        );
        setIsTranscribing(false);
        isTranscribingRef.current = false;
        return;
      }
      if (event.error === "audio-capture") {
        setErrorMessage("No microphone detected or microphone is currently locked by another app.");
        return;
      }
      if (event.error === "network") {
        // In Chrome/Safari, network error can occur on pause; retry gently
        console.warn("[Transcript] Speech network pause, auto-recovering...");
        return;
      }
      console.warn("[Transcript] Recognition notice:", event.error);
    };

    recognition.onend = () => {
      setInterimText("");
      // Continuous loop restart
      if (isTranscribingRef.current && optionsRef.current.enabled) {
        if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
        const delay = isSafariRef.current ? 80 : 250;
        restartTimerRef.current = setTimeout(() => {
          if (isTranscribingRef.current && optionsRef.current.enabled) {
            try {
              recognition.start();
            } catch (err: any) {
              if (err.name !== "InvalidStateError") {
                console.warn("[Transcript] Restart notice:", err);
              }
            }
          }
        }, delay);
      } else {
        setIsTranscribing(false);
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err: any) {
      if (err.name !== "InvalidStateError") {
        console.warn("[Transcript] start() failed:", err);
      }
    }
  }, [isSupported, persistSegmentToDb]);

  // ── Stop Transcription ────────────────────────────────────────────────────
  const stopTranscription = React.useCallback(() => {
    isTranscribingRef.current = false;
    setIsTranscribing(false);
    setInterimText("");

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    try {
      recognitionRef.current?.stop();
    } catch {}
    recognitionRef.current = null;
  }, []);

  // ── Auto-start with User Gesture Fallback ──────────────────────────────────
  React.useEffect(() => {
    if (!enabled || !isSupported) {
      stopTranscription();
      return;
    }

    // Try starting after brief mount pause
    const timer = setTimeout(() => {
      startTranscription();
    }, 600);

    // If browser blocks startTranscription due to user-gesture requirement:
    // Listen for the first click or keypress anywhere on the page to start it
    const handleFirstGesture = () => {
      if (!isTranscribingRef.current && optionsRef.current.enabled) {
        startTranscription();
      }
    };

    window.addEventListener("click", handleFirstGesture, { passive: true });
    window.addEventListener("touchstart", handleFirstGesture, { passive: true });
    window.addEventListener("keydown", handleFirstGesture, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleFirstGesture);
      window.removeEventListener("touchstart", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
    };
  }, [enabled, isSupported, startTranscription, stopTranscription]);

  // ── Fetch existing segments from Supabase on mount ────────────────────────
  React.useEffect(() => {
    if (!roomId) return;
    let active = true;

    const supabase = createClient() as any;
    supabase
      .from("meeting_transcript_segments")
      .select("*")
      .eq("room_id", roomId)
      .order("segment_index", { ascending: true })
      .then(({ data, error }: any) => {
        if (!error && data?.length && active) {
          setSegments((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const existingTexts = new Set(prev.map((s) => s.text.trim().toLowerCase()));
            const remoteSegments: TranscriptSegment[] = data
              .filter((d: any) => !existingIds.has(d.id) && !existingTexts.has(d.text?.trim().toLowerCase()))
              .map((d: any) => ({
                id: d.id,
                speaker_name: d.speaker_name,
                speaker_role: d.speaker_role,
                text: d.text,
                confidence: d.confidence ?? 1.0,
                started_at: d.started_at,
                segment_index: d.segment_index,
                isPending: false,
              }));

            const merged = [...prev, ...remoteSegments].sort(
              (a, b) => a.segment_index - b.segment_index
            );
            segmentIndexRef.current = Math.max(segmentIndexRef.current, merged.length);
            return merged;
          });
        }
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  // ── Supabase Realtime Postgres Changes ────────────────────────────────────
  React.useEffect(() => {
    if (!roomId) return;

    const supabase = createClient() as any;
    const channel = supabase
      .channel(`transcript_room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meeting_transcript_segments",
          filter: `room_id=eq.${roomId}`,
        },
        (payload: any) => {
          const newSeg = payload.new;
          if (!newSeg?.text) return;

          addRemoteSegment({
            id: newSeg.id,
            speaker_name: newSeg.speaker_name,
            speaker_role: newSeg.speaker_role,
            text: newSeg.text,
            confidence: newSeg.confidence ?? 1.0,
            started_at: newSeg.started_at,
            segment_index: newSeg.segment_index,
            isPending: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, addRemoteSegment]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  React.useEffect(() => {
    return () => {
      isTranscribingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      try {
        recognitionRef.current?.abort();
      } catch {}
    };
  }, []);

  // ── Clear transcript ──────────────────────────────────────────────────────
  const clearTranscript = React.useCallback(() => {
    setSegments([]);
    setInterimText("");
    segmentIndexRef.current = 0;
    if (typeof window !== "undefined" && roomId) {
      try {
        sessionStorage.removeItem(`orion_transcript_${roomId}`);
      } catch {}
    }
  }, [roomId]);

  // ── Full transcript formatted for AI / download ───────────────────────────
  const fullTranscript = React.useMemo(() => {
    return segments
      .map((s) => `[${s.speaker_name} (${s.speaker_role.toUpperCase()})]: ${s.text}`)
      .join("\n");
  }, [segments]);

  const wordCount = React.useMemo(() => {
    return segments.reduce(
      (acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length,
      0
    );
  }, [segments]);

  // ── Consolidate to requirements source ─────────────────────────────────────
  const consolidateToSource = React.useCallback(async (): Promise<string | null> => {
    const { meetingId: mId, projectId: pId, roomId: rId } = optionsRef.current;
    if (segments.length === 0) return null;

    const transcriptBody = fullTranscript;
    const totalWords = wordCount;

    try {
      const supabase = createClient() as any;

      if (isUuid(mId)) {
        const { data, error } = await supabase.rpc("consolidate_meeting_transcript", {
          p_meeting_id: mId,
        });
        if (!error && data) return data as string;
      }

      if (isUuid(pId)) {
        const title = `Meeting Transcript: Room ${rId}`;
        const fileName = `transcript_${rId}.txt`;

        const { data: sourceData, error: sourceError } = await supabase
          .from("requirement_sources")
          .insert({
            project_id: pId,
            source_type: "meeting_transcript",
            title,
            file_name: fileName,
            mime_type: "text/plain",
            raw_text: transcriptBody,
            extracted_text: transcriptBody,
            word_count: totalWords,
            status: "processed",
          })
          .select("id")
          .maybeSingle();

        if (!sourceError && sourceData?.id) {
          if (isUuid(mId)) {
            await supabase
              .from("client_meetings")
              .update({
                transcript_source_id: sourceData.id,
                total_words_spoken: totalWords,
              })
              .eq("id", mId);
          }
          return sourceData.id;
        }
      }

      if (isUuid(mId) || rId) {
        await supabase
          .from("client_meetings")
          .update({
            live_notes: `=== MEETING TRANSCRIPT ===\n${transcriptBody}`,
          })
          .eq(isUuid(mId) ? "id" : "room_id", isUuid(mId) ? mId : rId);
      }

      return "consolidated-local";
    } catch (err) {
      console.warn("[Transcript] consolidateToSource fallback notice:", err);
      return null;
    }
  }, [segments, fullTranscript, wordCount]);

  return {
    segments,
    interimText,
    isTranscribing,
    isSupported,
    error: errorMessage,
    startTranscription,
    stopTranscription,
    addRemoteSegment,
    consolidateToSource,
    fullTranscript,
    wordCount,
    clearTranscript,
  };
}
