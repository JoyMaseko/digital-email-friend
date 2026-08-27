import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { AiButton, AiResultCard, ErrorCard, Markdown, PageHeader, ThinkingIndicator } from "@/components/ai";
import { summarizeDocument } from "@/lib/ai.functions";

export const Route = createFileRoute("/summarize")({
  head: () => ({
    meta: [
      { title: "Document Summarizer — WorkBuddy" },
      {
        name: "description",
        content:
          "Upload a document and get a short AI summary with key points and action items in seconds.",
      },
      { property: "og:title", content: "Document Summarizer — WorkBuddy" },
      {
        property: "og:description",
        content: "AI document summaries with key points and action items.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Summarizer,
});

const ACCEPTED = ".txt,.md,.csv,.json,.log";

function Summarizer() {
  const runSummarize = useServerFn(summarizeDocument);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docTitle, setDocTitle] = useState("");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large — please use text files under 2 MB.");
      return;
    }
    const text = await file.text();
    if (!text.trim()) {
      toast.error("Couldn't read any text from that file.");
      return;
    }
    setDocTitle(file.name);
    setContent(text);
    setSummary(null);
    toast.success(`Loaded ${file.name}`);
  }

  async function handleSummarize() {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await runSummarize({
        data: { title: docTitle || "Pasted text", content },
      });
      setSummary(res.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function clearDoc() {
    setDocTitle("");
    setContent("");
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div>
      <PageHeader
        title="Document Summarizer"
        description="Upload a text document or paste its contents — get a short summary with key points and action items."
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-background px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/50"
          >
            <FileUp className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium">
              Drop a document here, or click to upload
            </span>
            <span className="text-xs text-muted-foreground">
              Text files (.txt, .md, .csv) up to 2 MB
            </span>
          </button>

          {docTitle && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
              <span className="truncate text-sm font-medium">{docTitle}</span>
              <button
                onClick={clearDoc}
                className="ml-2 rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Remove document"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            or paste text directly
            <div className="h-px flex-1 bg-border" />
          </div>

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (!docTitle) setDocTitle("");
            }}
            rows={7}
            placeholder="Paste the document text here…"
            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          />

          <div className="mt-4">
            <AiButton onClick={handleSummarize} loading={loading} disabled={!content.trim()}>
              Summarize
            </AiButton>
          </div>
        </div>

        {loading && <ThinkingIndicator label="Reading and summarizing" />}
        {error && <ErrorCard message={error} />}

        {summary && (
          <AiResultCard title="Summary">
            <Markdown content={summary} />
          </AiResultCard>
        )}
      </div>
    </div>
  );
}
