import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AiButton, AiResultCard, ErrorCard, PageHeader, ThinkingIndicator } from "@/components/ai";
import { polishEmail } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Assistant — WorkBuddy" },
      {
        name: "description",
        content:
          "Write what you want to say in plain words and let AI polish it into a professional email in your chosen tone.",
      },
      { property: "og:title", content: "Email Assistant — WorkBuddy" },
      {
        property: "og:description",
        content: "AI-powered email polishing for professional communication.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailAssistant,
});

const TONES = ["Professional", "Friendly", "Formal", "Concise"] as const;

function EmailAssistant() {
  const runPolish = useServerFn(polishEmail);
  const [draft, setDraft] = useState("");
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handlePolish() {
    if (!draft.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runPolish({
        data: { draft, tone: tone.toLowerCase(), recipient: recipient || undefined },
      });
      setResult(res.email);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success("Email copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <PageHeader
        title="Email Assistant"
        description="Write what you want to say in your own words — your workmate turns it into a polished, professional email."
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium" htmlFor="recipient">
            To <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="recipient"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="e.g. Thandi from Finance"
            className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          />

          <label className="mb-2 block text-sm font-medium" htmlFor="draft">
            What do you want to say?
          </label>
          <textarea
            id="draft"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={6}
            placeholder="e.g. hey thandi, need those invoice numbers from last month ASAP, finance is chasing me. also can we push our catch-up to friday?"
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Tone:</span>
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  tone === t
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-accent",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <AiButton onClick={handlePolish} loading={loading} disabled={!draft.trim()}>
              Polish my email
            </AiButton>
            {result && (
              <button
                onClick={() => {
                  setResult(null);
                  setDraft("");
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" /> Start over
              </button>
            )}
          </div>
        </div>

        {loading && <ThinkingIndicator label="Polishing your email" />}
        {error && <ErrorCard message={error} />}

        {result && (
          <AiResultCard title="Your polished email">
            <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{result}</pre>
            <div className="mt-4 border-t border-border pt-4">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                {copied ? (
                  <Check className="size-4 text-ai" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Copied" : "Copy email"}
              </button>
            </div>
          </AiResultCard>
        )}
      </div>
    </div>
  );
}
