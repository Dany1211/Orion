"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";

export interface TranscriptSegment {
  id?: string;
  speaker_name: string;
  speaker_role: "pm" | "client" | "system";
  text: string;
  confidence: number;
  started_at: string;
  segment_index: number;
  isPending?: boolean; // not yet flushed to DB
}

interface UseTranscriptOptions {
  meetingId: string | null;
  projectId: string | null;
  roomId: string;
  speakerName: string;
  speakerRole: "pm" | "client";
  enabled?: boolean;
}

interface UseTranscriptReturn {
  segments: TranscriptSegment[];
  isTranscribing: boolean;
  isSupported: boolean;
  startTranscription: () => void;
  stopTranscription: () => void;
  consolidateToSource: () => Promise<string | null>;
  fullTranscript: string;
  wordCount: number;
}

const FLUSH_INTERVAL_MS = 5000;   // flush pending segment every 5s of silence
const MIN_WORDS_TO_FLUSH = 4;     // don't flush tiny fragments

export function useMeetingTranscript({
  meetingId,
  projectId,
  roomId,
  speakerName,
  speakerRole,
  enabled = true,
}: UseTranscriptOptions): UseTranscriptReturn {
  const [segments, setSegments] = React.useState<TranscriptSegment[]>([]);
  const [isTranscribing, setIsTranscribing] = React.useState(false);
  const [isSupported] = React.useState(
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  const recognitionRef = React.useRef<any>(null);
  const segmentIndexRef = React.useRef(0);
  const pendingTextRef = React.useRef("");
  const flushTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTranscribingRef = React.useRef(false);
  const liveSegmentRef = React.useRef<TranscriptSegment | null>(null);

  // ── Flush a completed segment to Supabase ────────────────────────────────
  const flushSegment = React.useCallback(async (text: string, confidence: number) => {
    const trimmed = text.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

    if (!trimmed || wordCount < MIN_WORDS_TO_FLUSH) return;
    if (!meetingId || !projectId) {
      // No meeting ID yet — store locally only
      const seg: TranscriptSegment = {
        speaker_name: speakerName,
        speaker_role: speakerRole,
        text: trimmed,
        confidence,
        started_at: new Date().toISOString(),
        segment_index: segmentIndexRef.current++,
        isPending: true,
      };
      setSegments(prev => [...prev, seg]);
      return;
    }

    const idx = segmentIndexRef.current++;
    const seg: TranscriptSegment = {
      speaker_name: speakerName,
      speaker_role: speakerRole,
      text: trimmed,
      confidence,
      started_at: new Date().toISOString(),
      segment_index: idx,
      isPending: false,
    };

    // Optimistic UI
    setSegments(prev => [...prev, seg]);

    // Persist to Supabase
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase
        .from("meeting_transcript_segments")
        .insert({
          meeting_id:    meetingId,
          project_id:    projectId,
          room_id:       roomId,
          speaker_name:  speakerName,
          speaker_role:  speakerRole,
          text:          trimmed,
          confidence:    confidence,
          segment_index: idx,
          started_at:    seg.started_at,
        })
        .select("id")
        .single();

      if (!error && data?.id) {
        // Update the segment with its real DB id
        setSegments(prev =>
          prev.map(s =>
            s.segment_index === idx ? { ...s, id: data.id, isPending: false } : s
          )
        );
      }
    } catch (err) {
      console.warn("[Transcript] Supabase flush error:", err);
    }
  }, [meetingId, projectId, roomId, speakerName, speakerRole]);

  // ── Start Web Speech recognition ─────────────────────────────────────────
  const startTranscription = React.useCallback(() => {
    if (!isSupported || !enabled) return;
    if (isTranscribingRef.current) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsTranscribing(true);
      isTranscribingRef.current = true;
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "network") {
        console.warn("[Transcript] Network error — retrying in 2s");
        setTimeout(() => {
          if (isTranscribingRef.current) recognition.start();
        }, 2000);
        return;
      }
      console.warn("[Transcript] Speech error:", event.error);
    };

    recognition.onend = () => {
      // Auto-restart for continuous transcription
      if (isTranscribingRef.current) {
        try { recognition.start(); } catch { /* already running */ }
      } else {
        setIsTranscribing(false);
      }
    };

    recognition.onresult = (event: any) => {
      let interimText = "";
      let finalText = "";
      let finalConfidence = 1.0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
          finalConfidence = result[0].confidence || 1.0;
        } else {
          interimText += result[0].transcript;
        }
      }

      // Update live interim display
      if (interimText) {
        liveSegmentRef.current = {
          speaker_name: speakerName,
          speaker_role: speakerRole,
          text: interimText,
          confidence: 0.5,
          started_at: new Date().toISOString(),
          segment_index: -1, // mark as interim
          isPending: true,
        };
        // Trigger re-render for live preview
        setSegments(prev => {
          const withoutInterim = prev.filter(s => s.segment_index !== -1);
          return [...withoutInterim, liveSegmentRef.current!];
        });
      }

      // Flush finalized text
      if (finalText.trim()) {
        // Clear interim
        setSegments(prev => prev.filter(s => s.segment_index !== -1));
        liveSegmentRef.current = null;

        // Clear any pending flush timer
        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }

        pendingTextRef.current += " " + finalText;

        // Flush immediately if enough words accumulated
        const wordCount = pendingTextRef.current.trim().split(/\s+/).length;
        if (wordCount >= 15) {
          const toFlush = pendingTextRef.current;
          pendingTextRef.current = "";
          flushSegment(toFlush, finalConfidence);
        } else {
          // Defer flush in case more words come quickly
          flushTimerRef.current = setTimeout(() => {
            const toFlush = pendingTextRef.current;
            pendingTextRef.current = "";
            if (toFlush.trim()) flushSegment(toFlush, finalConfidence);
          }, FLUSH_INTERVAL_MS);
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn("[Transcript] Could not start recognition:", err);
    }
  }, [isSupported, enabled, speakerName, speakerRole, flushSegment]);

  // ── Stop transcription ────────────────────────────────────────────────────
  const stopTranscription = React.useCallback(() => {
    isTranscribingRef.current = false;
    setIsTranscribing(false);

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    // Flush whatever's still pending
    if (pendingTextRef.current.trim()) {
      flushSegment(pendingTextRef.current, 1.0);
      pendingTextRef.current = "";
    }

    try {
      recognitionRef.current?.stop();
      recognitionRef.current?.abort();
    } catch { /* already stopped */ }
    recognitionRef.current = null;
  }, [flushSegment]);

  // ── Auto-start / stop when enabled changes (e.g. mic mute/unmute) ─────────
  React.useEffect(() => {
    if (enabled && isSupported) {
      const timer = setTimeout(() => {
        startTranscription();
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      stopTranscription();
    }
  }, [enabled, isSupported, startTranscription, stopTranscription]);

  // ── Load existing segments from DB on mount ───────────────────────────────
  React.useEffect(() => {
    if (!meetingId) return;
    const supabase = createClient() as any;
    supabase
      .from("meeting_transcript_segments")
      .select("*")
      .eq("meeting_id", meetingId)
      .order("segment_index", { ascending: true })
      .then(({ data }: any) => {
        if (data?.length) {
          setSegments(data.map((d: any) => ({
            id: d.id,
            speaker_name: d.speaker_name,
            speaker_role: d.speaker_role,
            text: d.text,
            confidence: d.confidence || 1,
            started_at: d.started_at,
            segment_index: d.segment_index,
            isPending: false,
          })));
          segmentIndexRef.current = Math.max(...data.map((d: any) => d.segment_index)) + 1;
        }
      });
  }, [meetingId]);

  // ── Supabase Realtime: subscribe to new segments from the other participant ─
  React.useEffect(() => {
    if (!meetingId) return;
    const supabase = createClient() as any;
    const channel = supabase
      .channel(`transcript:${meetingId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "meeting_transcript_segments", filter: `meeting_id=eq.${meetingId}` },
        (payload: any) => {
          const newSeg = payload.new;
          // Only add segments from OTHER speakers (avoid duplicates of own segments)
          if (newSeg.speaker_name !== speakerName || newSeg.speaker_role !== speakerRole) {
            setSegments(prev => {
              const exists = prev.some(s => s.id === newSeg.id);
              if (exists) return prev;
              return [...prev.filter(s => s.segment_index !== -1), {
                id: newSeg.id,
                speaker_name: newSeg.speaker_name,
                speaker_role: newSeg.speaker_role,
                text: newSeg.text,
                confidence: newSeg.confidence || 1,
                started_at: newSeg.started_at,
                segment_index: newSeg.segment_index,
                isPending: false,
              }].sort((a, b) => a.segment_index - b.segment_index);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [meetingId, speakerName, speakerRole]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  React.useEffect(() => {
    return () => {
      isTranscribingRef.current = false;
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      try { recognitionRef.current?.abort(); } catch { /* safe */ }
    };
  }, []);

  // ── Consolidate: call DB function to merge all segments into a source ─────
  const consolidateToSource = React.useCallback(async (): Promise<string | null> => {
    if (!meetingId) return null;
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase.rpc("consolidate_meeting_transcript", {
        p_meeting_id: meetingId,
      });
      if (error) {
        console.error("[Transcript] Consolidation error:", error);
        return null;
      }
      return data as string; // returns the requirement_source UUID
    } catch (err) {
      console.error("[Transcript] consolidateToSource error:", err);
      return null;
    }
  }, [meetingId]);

  // ── Computed values ───────────────────────────────────────────────────────
  const fullTranscript = React.useMemo(() => {
    return segments
      .filter(s => s.segment_index !== -1) // exclude interim
      .sort((a, b) => a.segment_index - b.segment_index)
      .map(s => `[${s.speaker_name}]: ${s.text}`)
      .join("\n");
  }, [segments]);

  const wordCount = React.useMemo(() => {
    return segments
      .filter(s => s.segment_index !== -1)
      .reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0);
  }, [segments]);

  return {
    segments,
    isTranscribing,
    isSupported,
    startTranscription,
    stopTranscription,
    consolidateToSource,
    fullTranscript,
    wordCount,
  };
}
