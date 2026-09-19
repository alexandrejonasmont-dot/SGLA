import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Building2,
  CalendarClock,
  CalendarDays,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Plug,
  ScrollText,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { ThemeToggle } from "@/components/sgla/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { initials } from "@/lib/sgla/format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Painel executivo", icon: LayoutDashboard },
  { to: "/pendencias", label: "Central de pendências", icon: ListChecks },
  { to: "/clientes", label: "Empreendimentos", icon: Building2 },
  { to: "/processos", label: "Processos", icon: ScrollText },
  { to: "/condicionantes", label: "Condicionantes", icon: CalendarClock },
  { to: "/calendario", label: "Calendário ambiental", icon: CalendarDays },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/ia", label: "IA Ambiental", icon: Bot },
  { to: "/integracoes", label: "Integrações", icon: Plug },
] as const;

/** Ripple visual em qualquer clique de botão/link — feedback tátil corporativo. */
function useClickRipple() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(
        "button, a, [role='button'], .ripple-host",
      );
      if (!target || target.hasAttribute("data-no-ripple")) return;
      if (!target.classList.contains("ripple-host")) target.classList.add("ripple-host");
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ink = document.createElement("span");
      ink.className = "ripple-ink";
      ink.style.width = ink.style.height = `${size}px`;
      ink.style.left = `${e.clientX - rect.left - size / 2}px`;
      ink.style.top = `${e.clientY - rect.top - size / 2}px`;
      ink.style.opacity = "0.18";
      target.append(ink);
      setTimeout(() => ink.remove(), 640);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);
}

function Brand() {
  return (
    <Link to="/" className="press flex items-center gap-3 rounded-xl px-1 py-1">
      <span className="relative grid size-10 place-items-center rounded-xl border border-primary/35 bg-primary/12">
        <span className="font-display text-sm font-bold text-primary">SG</span>
        <span className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-sidebar bg-gold" />
      </span>
      <span className="leading-tight">
        <span className="font-display block text-base font-bold tracking-tight">SGLA</span>
        <span className="block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          Gestão Ambiental
        </span>
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "press ripple-host group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            ) : null}
            <item.icon
              className={cn(
                "size-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
                active && "text-primary",
              )}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useClickRipple();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-9 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Carregando SGLA</p>
        </div>
      </div>
    );
  }

  const email = user.email ?? "";
  const name = (user.user_metadata?.["full_name"] as string | undefined) || email;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden w-[268px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-7 flex-1">
          <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            Operação
          </p>
          <NavList />
        </div>
        <div className="surface mt-4 rounded-xl p-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/12 text-xs font-semibold text-primary">
              {initials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              void signOut().then(() => navigate({ to: "/auth" }));
            }}
            className="press mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-destructive/40 hover:text-destructive"
          >
            <LogOut className="size-3.5" /> Encerrar sessão
          </button>
        </div>
      </aside>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setOpen(false)}
                  className="press rounded-lg border border-border p-2"
                  aria-label="Fechar menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-6 flex-1">
                <NavList onNavigate={() => setOpen(false)} />
              </div>
              <button
                onClick={() => {
                  void signOut().then(() => navigate({ to: "/auth" }));
                }}
                className="press flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground"
              >
                <LogOut className="size-3.5" /> Encerrar sessão
              </button>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-xl lg:px-8">
          <button
            onClick={() => setOpen(true)}
            className="press rounded-lg border border-border p-2 lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="size-4" />
          </button>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <time
              dateTime={now.toISOString()}
              className="hidden items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground md:flex"
            >
              <CalendarDays className="size-3.5" />
              {now.toLocaleDateString("pt-BR")} · {now.toLocaleTimeString("pt-BR")}
            </time>
            <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success sm:inline-flex">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              Backend conectado
            </span>
            <ThemeToggle />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
