import { Link, useRouterState } from "@tanstack/react-router";
import {
  CalendarCheck,
  FileText,
  LayoutDashboard,
  ListTodo,
  Mail,
  Sparkles,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/email", label: "Email Assistant", icon: Mail },
  { to: "/summarize", label: "Doc Summarizer", icon: FileText },
  { to: "/meetings", label: "Meeting Notes", icon: CalendarCheck },
  { to: "/tasks", label: "Task Manager", icon: ListTodo },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const nav = (
    <nav className="flex flex-col gap-1 px-3">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar py-5 md:flex">
        <div className="mb-8 flex items-center gap-2.5 px-6">
          <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary">
            <Sparkles className="size-4 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold text-sidebar-primary-foreground">
            Workmate
          </span>
        </div>
        {nav}
        <div className="mt-auto px-6 pt-6">
          <p className="text-xs text-sidebar-foreground/50">
            AI-powered workplace suite
          </p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary">
            <Sparkles className="size-3.5 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">Workmate</span>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium"
        >
          Menu
        </button>
      </div>
      {mobileOpen && (
        <div className="fixed inset-x-0 top-[53px] z-40 border-b border-sidebar-border bg-sidebar py-3 md:hidden">
          {nav}
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 pb-16 pt-[72px] md:px-10 md:pt-8">
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
