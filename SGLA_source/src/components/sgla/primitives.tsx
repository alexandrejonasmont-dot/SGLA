import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/* ------------------------------ Page heading ------------------------------ */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display text-2xl font-semibold sm:text-[1.75rem]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </motion.div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* --------------------------------- Panel ---------------------------------- */

export function Panel({
  children,
  className,
  title,
  description,
  actions,
  delay = 0,
}: {
  children?: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn("surface rounded-2xl p-5 sm:p-6", className)}
    >
      {(title || actions) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="font-display text-base font-semibold">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      )}
      {children}
    </motion.section>
  );
}

/* --------------------------------- Stats ---------------------------------- */

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  delay = 0,
  onClick,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  delay?: number;
  onClick?: () => void;
}) {
  const tones = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
  } as const;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "surface lift press ripple-host group w-full rounded-2xl p-5 text-left",
        !onClick && "cursor-default",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
        <Icon
          className={cn("size-4 shrink-0 transition-transform group-hover:scale-110", tones[tone])}
        />
      </div>
      <div className={cn("mt-3 font-display text-3xl font-semibold tabular-nums", tones[tone])}>
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </motion.button>
  );
}

/* --------------------------------- Badges --------------------------------- */

const badgeTones = {
  neutral: "bg-muted text-muted-foreground border-border",
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/12 text-warning border-warning/30",
  danger: "bg-destructive/12 text-destructive border-destructive/30",
  info: "bg-info/12 text-info border-info/30",
  gold: "bg-gold/12 text-gold border-gold/30",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function statusTone(status?: string | null): BadgeTone {
  const s = String(status ?? "");
  if (s === "Deferido" || s === "Aprovado" || s === "Finalizado") return "success";
  if (s === "Indeferido" || s === "Exigência técnica") return "danger";
  if (s === "Em análise" || s === "Protocolado") return "info";
  if (s === "Aguardando vistoria" || s === "Em revisão") return "warning";
  if (s === "Arquivado") return "neutral";
  return "gold";
}

export function priorityTone(p?: string | null): BadgeTone {
  if (p === "Crítica") return "danger";
  if (p === "Alta") return "warning";
  if (p === "Baixa") return "neutral";
  return "info";
}

/* ------------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-12 text-center">
      <div className="mb-3 rounded-full border border-border bg-muted/50 p-3">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <p className="font-display text-sm font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-xs text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* -------------------------------- Skeleton -------------------------------- */

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl border border-border bg-muted/40" />
      ))}
    </div>
  );
}

/* ----------------------------- Definition list ---------------------------- */

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-sm">{value || "—"}</dd>
    </div>
  );
}
