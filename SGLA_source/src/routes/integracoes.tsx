import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink, Plug, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/sgla/AppShell";
import { Btn } from "@/components/sgla/form";
import { LoadingRows, PageHeader, Panel, Pill } from "@/components/sgla/primitives";
import { healthCheck } from "@/lib/sgla/cnpj.functions";
import {
  INTEGRATIONS,
  STATUS_LABEL,
  type IntegrationStatus,
} from "@/lib/sgla/constants";
import { fmtDateTime } from "@/lib/sgla/format";

export const Route = createFileRoute("/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações e conformidade | SGLA" },
      {
        name: "description",
        content:
          "Status transparente das integrações do SGLA: consulta cadastral de CNPJ, IA no backend, banco multiusuário e fluxos externos com órgãos ambientais.",
      },
      { property: "og:title", content: "Integrações e conformidade | SGLA" },
      {
        property: "og:description",
        content: "Situação real de cada integração usada no licenciamento ambiental.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <IntegrationsPage />
    </AppShell>
  ),
});

const toneOf = (s: IntegrationStatus) =>
  s === "operacional" ? "success" : s === "contingencia" ? "warning" : s === "externo" ? "info" : "neutral";

function IntegrationsPage() {
  const check = useServerFn(healthCheck);
  const health = useQuery({ queryKey: ["integration-health"], queryFn: () => check({}) });

  const statusFor = (key: string): IntegrationStatus => {
    const h = health.data;
    if (key === "cnpj") return h?.serproConfigured ? "operacional" : "contingencia";
    if (key === "ai") return h?.aiConfigured ? "operacional" : "nao_configurado";
    if (key === "db") return h?.databaseConfigured ? "operacional" : "nao_configurado";
    return "externo";
  };

  return (
    <>
      <PageHeader
        title="Integrações"
        subtitle="Transparência sobre o que é oficial, o que é contingência e o que continua sendo fluxo externo."
        actions={
          <Btn variant="outline" onClick={() => void health.refetch()} disabled={health.isFetching}>
            <RefreshCw className={`size-4 ${health.isFetching ? "animate-spin" : ""}`} /> Verificar
          </Btn>
        }
      />

      <Panel
        title="Verificação do ambiente"
        description={
          health.data ? `Última verificação em ${fmtDateTime(health.data.checkedAt)}` : "Consultando o backend…"
        }
      >
        {health.isLoading ? (
          <LoadingRows rows={2} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {INTEGRATIONS.map((it) => {
              const st = statusFor(it.key);
              return (
                <article key={it.key} className="lift rounded-xl border border-border bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{it.name}</p>
                      <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        {it.category}
                      </p>
                    </div>
                    <Pill tone={toneOf(st)}>{STATUS_LABEL[st]}</Pill>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
                    {it.description}
                  </p>
                  {it.portal ? (
                    <a
                      href={it.portal}
                      target="_blank"
                      rel="noreferrer"
                      className="press mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
                    >
                      Abrir portal oficial <ExternalLink className="size-3.5" />
                    </a>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Como interpretar" delay={0.1} className="mt-5">
        <ul className="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
          <li className="flex gap-2">
            <Plug className="mt-0.5 size-3.5 shrink-0 text-success" />
            <span>
              <strong className="text-foreground">Operacional:</strong> integração ativa e executada
              no backend, sem exposição de credenciais ao navegador.
            </span>
          </li>
          <li className="flex gap-2">
            <Plug className="mt-0.5 size-3.5 shrink-0 text-warning" />
            <span>
              <strong className="text-foreground">Contingência:</strong> a fonte oficial não está
              configurada; os dados vêm de base pública não oficial e devem ser confirmados antes de
              qualquer protocolo.
            </span>
          </li>
          <li className="flex gap-2">
            <Plug className="mt-0.5 size-3.5 shrink-0 text-info" />
            <span>
              <strong className="text-foreground">Fluxo externo:</strong> o órgão não disponibiliza
              API pública. Protocolo e acompanhamento ocorrem no portal oficial e o resultado é
              registrado manualmente no SGLA.
            </span>
          </li>
        </ul>
      </Panel>
    </>
  );
}
