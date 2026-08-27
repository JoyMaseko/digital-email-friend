import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mic, Pause, Play, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AiButton, AiResultCard, ErrorCard, Markdown, PageHeader, ThinkingIndicator } from "@/components/ai";
import { processMeetingNotes } from "@/lib/ai.functions";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Notes — WorkBuddy" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into clear decisions and action items, with an audio briefing you can listen to.",
      },
      { property: "og:title", content: "Meeting Notes — WorkBuddy" },
      {
        property: "og:description",
        content: "AI meeting note breakdowns with audio briefings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetingNotes,
});

// Browser SpeechRecognition (Chrome/Edge) — optional dictation aid.
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"] ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

function MeetingNotes() {
  const runProcess = useServerFn(processMeetingNotes);
  const [notes, setNotes] = useState("");
  const [breakdown, setBreakdown] = useState<string | null>(null);
  const [spoken, setSpoken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dictating, setDictating] = useState(false);
  const [audioState, setAudioState] = useState<"idle" | "playing" | "paused">("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const canDictate = typeof window !== "undefined" && getSpeechRecognition() !== null;
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  function toggleDictation() {
    const Rec = getSpeechRecognition();
    if (!Rec) return;
    if (dictating) {
      recognitionRef.current?.stop();
      setDictating(false);
      return;
    }
    const rec = new Rec();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const transcript = last?.[0]?.transcript;
      if (transcript) setNotes((prev) => (prev ? prev + " " : "") + transcript.trim());
    };
    rec.onend = () => setDictating(false);
    recognitionRef.current = rec;
    rec.start();
    setDictating(true);
    toast.info("Listening… speak your meeting notes");
  }

  async function handleProcess() {
    if (!notes.trim()) return;
    window.speechSynthesis?.cancel();
    setAudioState("idle");
    setLoading(true);
    setError(null);
    setBreakdown(null);
    setSpoken(null);
    try {
      const res = await runProcess({ data: { notes } });
      setBreakdown(res.breakdown);
      setSpoken(res.spoken);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleAudio() {
    if (!spoken || !canSpeak) return;
    const synth = window.speechSynthesis;
    if (audioState === "playing") {
      synth.pause();
      setAudioState("paused");
      return;
    }
    if (audioState === "paused") {
      synth.resume();
      setAudioState("playing");
      return;
    }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.rate = 1;
    utterance.onend = () => setAudioState("idle");
    synth.speak(utterance);
    setAudioState("playing");
  }

  function stopAudio() {
    window.speechSynthesis?.cancel();
    setAudioState("idle");
  }

  return (
    <div>
      <PageHeader
        title="Meeting Notes"
        description="Paste or dictate your meeting notes — get a clear breakdown and a short audio briefing of what was said."
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium" htmlFor="notes">
              Meeting notes
            </label>
            {canDictate && (
              <button
                onClick={toggleDictation}
                className={
                  dictating
                    ? "inline-flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground"
                    : "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                }
              >
                <Mic className="size-3.5" />
                {dictating ? "Stop dictating" : "Dictate notes"}
              </button>
            )}
          </div>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={8}
            placeholder={
              "Paste raw notes from your meeting here…\n\ne.g. Sprint planning 27 Aug — Sarah: API migration slipping to next week, devs need specs from design by Fri. Decided to cut dark mode from this release. Kagiso to follow up with vendor on pricing."
            }
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          />
          <div className="mt-4">
            <AiButton onClick={handleProcess} loading={loading} disabled={!notes.trim()}>
              Break down my meeting
            </AiButton>
          </div>
        </div>

        {loading && <ThinkingIndicator label="Breaking down your meeting" />}
        {error && <ErrorCard message={error} />}

        {breakdown && (
          <AiResultCard title="Meeting breakdown">
            <Markdown content={breakdown} />
          </AiResultCard>
        )}

        {spoken && (
          <AiResultCard title="Audio briefing">
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{spoken}</p>
            {canSpeak ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className="inline-flex items-center gap-2 rounded-lg bg-ai px-4 py-2 text-sm font-semibold text-ai-foreground transition-all hover:brightness-110 active:scale-[0.98]"
                >
                  {audioState === "playing" ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {audioState === "playing"
                    ? "Pause"
                    : audioState === "paused"
                      ? "Resume"
                      : "Play briefing"}
                </button>
                {audioState !== "idle" && (
                  <button
                    onClick={stopAudio}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent"
                  >
                    <Square className="size-3.5" /> Stop
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Audio playback isn't supported in this browser.
              </p>
            )}
          </AiResultCard>
        )}
      </div>
    </div>
  );
}
