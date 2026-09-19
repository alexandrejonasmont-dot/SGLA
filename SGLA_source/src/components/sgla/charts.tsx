import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

export interface BarDatum {
  name: string;
  value: number;
}

const TONE_BG: Record<string, string> = {
  primary: "bg-primary",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};

/**
 * Gráfico de barras horizontais leve (sem dependências extras).
 * Usado no painel para distribuição por tipo de licença, situação, etc.
 */
export function BarList({
  data,
  tone = "primary",
  empty = "Sem dados para exibir.",
  className,
}: {
  data: BarDatum[];
  tone?: keyof typeof TONE_BG;
  empty?: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="py-6 text-center text-xs text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className={cn("space-y-2.5", className)}>
      {data.map((d, i) => (
        <li key={d.name}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-xs font-medium">{d.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{d.value}</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(d.value / max) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.04 * i }}
              className={cn("h-full rounded-full", TONE_BG[tone] ?? TONE_BG["primary"])}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
