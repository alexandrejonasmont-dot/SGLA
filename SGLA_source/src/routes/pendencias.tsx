import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ListChecks } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/sgla/AppShell";
import {
  EmptyState,
  LoadingRows,
  PageHeader,
  Panel,
  Pill,
  StatCard,
} from "@/components/sgla/primitives";
import {
  DEADLINE_LABEL,
  LEVEL_TONE,
  OVERALL_TONE,
  buildPendencies,
  deadlineText,
  overallStatus,
  type PendencyCategory,
} from "@/lib/sgla/alerts";
import { useClients, useConditions, useDocuments, useProcesses } from "@/lib/sgla/db";
import { fmtDate } from "@/lib/sgla/format";

export const Route = createFileRoute("/pendencias")({
  head: () => ({
    meta: [
      { title: "Central de pendências | SGLA" },
      {
        name: "description",
        content:
          "Central de pendências do SGLA: processos parados, exigências técnicas, condicionantes vencidas, licenças a vencer e documentos aguardando emissão.",
      },
      { property: "og:title", content: "Central de pendências | SGLA" },
      {
        property: "og:description",
        content:
          "Reúne automaticamente todas as pendências de licenciamento ambiental por criticidade.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <PendenciesPage />
    </AppShell>
  ),
});

const CATEGORIES: (PendencyCategory | "Todas")[] = [
  "Todas",
  "Processos",
  "Condicionantes",
  "Licenças",
  "Documentos",
];

function PendenciesPage() {
  const clients = useClients();
  const processes = useProcesses();
  const conditions = useConditions();
  const documents = useDocuments();

  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todas");

  const loading =
    clients.isLoading || processes.isLoading || conditions.isLoading || documents.isLoading;

  const pendencies = useMemo(
    () =>
      buildPendencies({
        clients: clients.data ?? [],
        processes: processes.data ?? [],
        conditions: conditions.data ?? [],
        documents: documents.data ?? [],
      }),
    [clients.data, processes.data, conditions.data, documents.data],
  );

  const list = useMemo(
    () => (cat === "Todas" ? pendencies : pendencies.filter((p) => p.category === cat)),
    [pendencies, cat],
  );

  const status = overallStatus(pendencies);
  const overdue = pendencies.filter((p) => p.level === "vencido").length;
  const critical = pendencies.filter((p) => p.level === "critico").length;

  const countOf = (c: PendencyCategory) => pendencies.filter((p) => p.category === c).length;

  return (
    <>
      <PageHeader
        title="Central de pendências"
        subtitle="Tudo o que exige ação, reunido automaticamente a partir dos dados já cadastrados."
        actions={<Pill tone={OVERALL_TONE[status]}>Situação geral: {status}</Pill>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Pendências totais"
          value={pendencies.length}
          icon={ListChecks}
          tone={pendencies.length ? "warning" : "success"}
          hint="Itens que exigem acompanhamento"
        />
        <StatCard
          label="Vencidas"
          value={overdue}
          icon={AlertTriangle}
          tone={overdue ? "danger" : "success"}
          hint="Prazo já ultrapassado"
          delay={0.05}
        />
        <StatCard
          label="Críticas (até 6 dias)"
          value={critical}
          icon={AlertTriangle}
          tone={critical ? "danger" : "success"}
          hint="Ação imediata recomendada"
          delay={0.1}
        />
        <StatCard
          label="Condicionantes"
          value={countOf("Condicionantes")}
          icon={CheckCircle2}
          tone={countOf("Condicionantes") ? "warning" : "success"}
          hint="Obrigações em aberto com prazo próximo"
          delay={0.15}
        />
      </div>

      <Panel className="mt-5" delay={0.2}>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`press ripple-host rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                cat === c
                  ? "border-primary/45 bg-primary/12 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
              {c !== "Todas" ? ` (${countOf(c as PendencyCategory)})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingRows />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nenhuma pendência nesta visão"
            description="Nada com prazo crítico ou situação pendente foi identificado nos registros atuais."
          />
        ) : (
          <ul className="space-y-2.5">
            {list.map((p, i) => (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(0.03 * i, 0.3), duration: 0.3 }}
              >
                <Link
                  to={p.to}
                  className="press lift ripple-host flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <Pill tone={LEVEL_TONE[p.level]}>{DEADLINE_LABEL[p.level]}</Pill>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{p.subtitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.category} • {p.reason}
                      {p.date ? ` • prazo ${fmtDate(p.date)} (${deadlineText(p.date)})` : ""}
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
