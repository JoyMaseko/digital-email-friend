import { Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{description}</p>
    </header>
  );
}

export function AiButton({
  children,
  loading,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  loading?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Sparkles className="size-4" />
      )}
      {children}
    </button>
  );
}

export function ThinkingIndicator({ label = "Workmate is thinking" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-ai-soft px-4 py-3.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="thinking-dot size-1.5 rounded-full bg-ai"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-accent-foreground">{label}…</span>
    </div>
  );
}

export function AiResultCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="animate-ai-in overflow-hidden rounded-2xl border border-ai/30 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-ai/20 bg-ai-soft px-5 py-3">
        <Sparkles className="size-4 text-ai" />
        <h2 className="text-sm font-semibold text-accent-foreground">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-sm max-w-none text-foreground [&_strong]:font-semibold [&_li]:my-0.5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export function ErrorCard({ message }: { message: string }) {
  return (
    <div className="animate-ai-in rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}
