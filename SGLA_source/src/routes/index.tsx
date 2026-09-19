import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  FileText,
  ListChecks,
  ScrollText,
  ShieldAlert,
} from "lucide-react";
import { useMemo } from "react";

import { AppShell } from "@/components/sgla/AppShell";
import { BarList } from "@/components/sgla/charts";
import {
  EmptyState,
  Field,
  LoadingRows,
  PageHeader,
  Panel,
  Pill,
  StatCard,
  priorityTone,
  statusTone,
} from "@/components/sgla/primitives";
import {
  OVERALL_TONE,
  buildPendencies,
  countBy,
  deadlineLevel,
  isConditionOpen,
  isDocumentPending,
  isLicense,
  isProcessActive,
  overallStatus,
} from "@/lib/sgla/alerts";
import { useClients, useConditions, useDocuments, useProcesses } from "@/lib/sgla/db";
import { daysUntil, fmtDate, maskCnpj } from "@/lib/sgla/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel executivo | SGLA — Licenciamento Ambiental" },
      {
        name: "description",
        content:
          "Painel executivo do SGLA com indicadores de empreendimentos, processos ambientais, condicionantes em vencimento e documentos técnicos emitidos.",
      },
      { property: "og:title", content: "Painel executivo | SGLA" },
      {
        property: "og:description",
        content:
          "Indicadores em tempo real de processos de licenciamento ambiental, prazos e documentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <Dashboard />
    </AppShell>
  ),
});

function Dashboard() {
  const clients = useClients();
  const processes = useProcesses();
  const conditions = useConditions();
  const documents = useDocuments();

  const clientName = (id?: string | null) =>
    clients.data?.find((c) => c.id === id)?.legal_name ?? "Empreendimento não vinculado";

  const kpis = useMemo(() => {
    const p = processes.data ?? [];
    const c = conditions.data ?? [];
    const d = documents.data ?? [];
    const openConditions = c.filter(isConditionOpen);
    return {
      clients: clients.data?.length ?? 0,
      processes: p.length,
      inProgress: p.filter((x) => x.status === "Protocolado" || x.status === "Finalizado").length,
      granted: p.filter((x) => x.status === "Deferido").length,
      pending: openConditions.length,
      overdue: openConditions.filter((x) => (daysUntil(x.due_date) ?? 99) < 0).length,
      criticalConditions: openConditions.filter((x) => {
        const lvl = deadlineLevel(x.due_date);
        return lvl === "vencido" || lvl === "critico";
      }).length,
      expiringLicenses: p.filter((x) => {
        if (!isLicense(x)) return false;
        const days = daysUntil(x.expires_at);
        return days != null && days >= 0 && days <= 120;
      }).length,
      pendingDocs: d.filter(isDocumentPending).length,
      docs: d.length,
    };
  }, [clients.data, processes.data, conditions.data, documents.data]);

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

  const status = overallStatus(pendencies);

  const charts = useMemo(() => {
    const p = processes.data ?? [];
    const c = conditions.data ?? [];
    const d = documents.data ?? [];
    return {
      byLicense: countBy(p, (x) => x.license_type).slice(0, 6),
      byStatus: countBy(p, (x) => x.status),
      byCondition: countBy(c, (x) =>
        x.done ? "Concluída" : (daysUntil(x.due_date) ?? 99) < 0 ? "Vencida" : x.status,
      ),
      byDoc: countBy(d, (x) => x.status),
    };
  }, [processes.data, conditions.data, documents.data]);

  const agenda = useMemo(
    () =>
      (conditions.data ?? [])
        .filter((c) => isConditionOpen(c) && c.due_date)
        .sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
        .slice(0, 6),
    [conditions.data],
  );

  const recent = useMemo(() => (processes.data ?? []).slice(0, 6), [processes.data]);

  const loading = clients.isLoading || processes.isLoading || conditions.isLoading;

  return (
    <>
      <PageHeader
        title="Painel executivo"
        subtitle="Visão consolidada da carteira de licenciamento e da conformidade ambiental."
        actions={
          <>
            <Pill tone={OVERALL_TONE[status]}>Situação geral: {status}</Pill>
            <Link
              to="/pendencias"
              className="press ripple-host inline-flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-sm font-medium"
            >
              <ListChecks className="size-4" /> Pendências
            </Link>
            <Link
              to="/documentos"
              className="press ripple-host inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
            >
              <FileText className="size-4" /> Emitir documento
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Processos em andamento"
          value={kpis.inProgress}
          icon={ScrollText}
          tone="info"
          hint="Protocolados e finalizados"
          delay={0}
        />
        <StatCard
          label="Licenças a vencer (120 dias)"
          value={kpis.expiringLicenses}
          icon={CalendarClock}
          tone={kpis.expiringLicenses ? "warning" : "success"}
          hint="Licenças deferidas com validade próxima"
          delay={0.05}
        />
        <StatCard
          label="Condicionantes pendentes"
          value={kpis.pending}
          icon={CheckCircle2}
          tone={kpis.pending ? "warning" : "success"}
          hint={`${kpis.overdue} vencida(s)`}
          delay={0.1}
        />
        <StatCard
          label="Condicionantes que exigem atenção"
          value={kpis.criticalConditions}
          icon={ShieldAlert}
          tone={kpis.criticalConditions ? "danger" : "success"}
          hint={`${kpis.overdue} vencida(s) • demais com prazo crítico`}
          delay={0.15}
        />
        <StatCard
          label="Documentos pendentes"
          value={kpis.pendingDocs}
          icon={FileText}
          tone={kpis.pendingDocs ? "warning" : "success"}
          hint={`${kpis.docs} documento(s) no total`}
          delay={0.2}
        />
        <StatCard
          label="Empreendimentos"
          value={kpis.clients}
          icon={Building2}
          hint="Cadastrados na carteira"
          delay={0.25}
        />
      </div>

      {pendencies.length ? (
        <Link
          to="/pendencias"
          className="press lift ripple-host mt-4 flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/8 p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <p className="text-sm">
              <span className="font-medium">{pendencies.length} pendência(s)</span> identificada(s)
              nos prazos e situações registradas.
            </p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      ) : null}

      <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Processos por tipo de licença" delay={0.1}>
          <BarList data={charts.byLicense} tone="primary" />
        </Panel>
        <Panel title="Processos por situação" delay={0.15}>
          <BarList data={charts.byStatus} tone="info" />
        </Panel>
        <Panel title="Condicionantes por situação" delay={0.2}>
          <BarList data={charts.byCondition} tone="warning" />
        </Panel>
        <Panel title="Documentos por situação" delay={0.25}>
          <BarList data={charts.byDoc} tone="success" />
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Panel
          title="Processos recentes"
          description="Últimas movimentações registradas na carteira."
          delay={0.2}
          actions={
            <Link to="/processos" className="press text-xs font-medium text-primary">
              Ver todos
            </Link>
          }
        >
          {loading ? (
            <LoadingRows />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title="Nenhum processo cadastrado"
              description="Cadastre um empreendimento e abra o primeiro processo de licenciamento para acompanhar prazos e documentos."
            />
          ) : (
            <ul className="space-y-2">
              {recent.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.35 }}
                >
                  <Link
                    to="/processos"
                    className="press lift ripple-host flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.license_type}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {clientName(p.client_id)} • {p.agency ?? "Órgão não definido"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Pill tone={priorityTone(p.priority)}>{p.priority}</Pill>
                      <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                      <ArrowUpRight className="size-4 text-muted-foreground" />
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Agenda de condicionantes"
          description="Próximos vencimentos por ordem de prazo."
          delay={0.25}
          actions={
            <Link to="/condicionantes" className="press text-xs font-medium text-primary">
              Gerenciar
            </Link>
          }
        >
          {loading ? (
            <LoadingRows rows={3} />
          ) : agenda.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Sem prazos em aberto"
              description="Todas as condicionantes com data definida estão cumpridas."
            />
          ) : (
            <ul className="space-y-2">
              {agenda.map((c, i) => {
                const d = daysUntil(c.due_date) ?? 0;
                const tone = d < 0 ? "danger" : d <= 15 ? "warning" : "info";
                return (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.35 }}
                    className="rounded-xl border border-border bg-card/60 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{c.title}</p>
                      <Pill tone={tone}>
                        {d < 0 ? `${Math.abs(d)}d em atraso` : d === 0 ? "vence hoje" : `${d}d`}
                      </Pill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {clientName(c.client_id)} • prazo {fmtDate(c.due_date)}
                    </p>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title="Carteira de empreendimentos"
        description="Empreendimentos sob responsabilidade técnica."
        className="mt-5"
        delay={0.3}
        actions={
          <Link to="/clientes" className="press text-xs font-medium text-primary">
            Abrir cadastro
          </Link>
        }
      >
        {clients.isLoading ? (
          <LoadingRows rows={2} />
        ) : (clients.data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum empreendimento cadastrado"
            description="Cadastre um empreendimento manualmente ou pela consulta de CNPJ para começar."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {clients.data!.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                to="/clientes"
                className="press lift ripple-host rounded-xl border border-border bg-card/60 p-4"
              >
                <p className="truncate text-sm font-medium">{c.legal_name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {c.cnpj ? maskCnpj(c.cnpj) : "CNPJ não informado"}
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2">
                  <Field label="Município" value={[c.city, c.uf].filter(Boolean).join("/")} />
                  <Field label="Situação" value={c.registration_status} />
                </dl>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
