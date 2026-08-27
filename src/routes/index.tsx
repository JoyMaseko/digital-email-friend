import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, FileText, ListTodo, Mail, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ai";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "WorkBuddy — AI Workplace Productivity Assistant" },
      {
        name: "description",
        content:
          "Your AI workbuddy for everyday office tasks: polish emails, summarize documents, break down meeting notes, and prioritize your tasks — all in one dashboard.",
      },
      { property: "og:title", content: "WorkBuddy — AI Workplace Productivity Assistant" },
      {
        property: "og:description",
        content:
          "Polish emails, summarize documents, break down meeting notes, and prioritize tasks with one AI workmate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overview,
});

const TOOLS = [
  {
    to: "/email",
    icon: Mail,
    title: "Email Assistant",
    description:
      "Write what you want to say in plain words. Your workmate rewrites it as a polished, professional email in the tone you choose.",
    tag: "Write less, say it better",
  },
  {
    to: "/summarize",
    icon: FileText,
    title: "Document Summarizer",
    description:
      "Upload a document and get the short version: a quick overview, the key points, and the action items — without reading every page.",
    tag: "Skip the 40-page read",
  },
  {
    to: "/meetings",
    icon: CalendarCheck,
    title: "Meeting Notes",
    description:
      "Paste or dictate raw meeting notes. Get a structured breakdown of decisions and action items, plus a short audio briefing you can listen to.",
    tag: "Never re-read notes again",
  },
  {
    to: "/tasks",
    icon: ListTodo,
    title: "Task Manager",
    description:
      "Brain-dump everything on your plate and let AI sort it by urgency and importance — so you always know what to do first.",
    tag: "Know what to do first",
  },
] as const;

function Overview() {
  return (
    <div>
      <PageHeader
        title="Good to see you"
        description="Your AI workmate handles the busywork — pick a tool below to get started."
      />

      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-ai/30 bg-ai-soft p-5">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-ai" />
        <div>
          <p className="text-sm font-semibold text-accent-foreground">
            Everything runs on Lovable AI
          </p>
          <p className="mt-1 text-sm leading-relaxed text-accent-foreground/80">
            Emails are polished, documents summarized, meetings broken down, and tasks ranked
            by your AI assistant — no setup, no switching between apps.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS.map(({ to, icon: Icon, title, description, tag }) => (
          <Link
            key={to}
            to={to}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="size-5 text-primary" />
            </div>
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{tag}</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
