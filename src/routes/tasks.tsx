import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDownWideNarrow, Plus, X } from "lucide-react";
import { useState } from "react";
import { AiButton, ErrorCard, PageHeader, ThinkingIndicator } from "@/components/ai";
import { prioritizeTasks } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Manager — Workmate" },
      {
        name: "description",
        content:
          "Brain-dump your tasks and let your AI workmate sort them by what needs to be prioritized first.",
      },
      { property: "og:title", content: "Task Manager — Workmate" },
      {
        property: "og:description",
        content: "AI task prioritization for busy teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TaskManager,
});

type Prioritized = {
  task: string;
  priority: "high" | "medium" | "low";
  reason: string;
  suggestedOrder: number;
};

const PRIORITY_STYLES: Record<Prioritized["priority"], string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-primary/10 text-primary border-primary/30",
  low: "bg-secondary text-muted-foreground border-border",
};

function TaskManager() {
  const runPrioritize = useServerFn(prioritizeTasks);
  const [input, setInput] = useState("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [result, setResult] = useState<Prioritized[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTask() {
    const t = input.trim();
    if (!t) return;
    setTasks((prev) => [...prev, t]);
    setInput("");
    setResult(null);
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
    setResult(null);
  }

  async function handlePrioritize() {
    if (tasks.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runPrioritize({ data: { tasks } });
      setResult(res.tasks);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Task Manager"
        description="Brain-dump everything on your plate — your workmate sorts it by what matters most."
      />

      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <label className="mb-2 block text-sm font-medium" htmlFor="task-input">
            Add a task
          </label>
          <div className="flex gap-2">
            <input
              id="task-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTask();
                }
              }}
              placeholder="e.g. Reply to client's contract questions"
              className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
            />
            <button
              onClick={addTask}
              disabled={!input.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
            >
              <Plus className="size-4" /> Add
            </button>
          </div>

          {tasks.length > 0 && (
            <ul className="mt-4 space-y-2">
              {tasks.map((t, i) => (
                <li
                  key={`${t}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2"
                >
                  <span className="min-w-0 truncate text-sm">{t}</span>
                  <button
                    onClick={() => removeTask(i)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
                    aria-label={`Remove task: ${t}`}
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5">
            <AiButton onClick={handlePrioritize} loading={loading} disabled={tasks.length === 0}>
              <ArrowDownWideNarrow className="size-4" />
              Prioritize my tasks
            </AiButton>
          </div>
        </div>

        {loading && <ThinkingIndicator label="Sorting your priorities" />}
        {error && <ErrorCard message={error} />}

        {result && (
          <section className="animate-ai-in space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Your day, in the order you should tackle it
            </h2>
            {result.map((t, i) => (
              <div
                key={`${t.task}-${i}`}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{t.task}</span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        PRIORITY_STYLES[t.priority],
                      )}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{t.reason}</p>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
