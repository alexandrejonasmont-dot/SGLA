import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/sgla/AppShell";
import { EmptyState, LoadingRows, PageHeader, Panel, Pill } from "@/components/sgla/primitives";
import { DEADLINE_LABEL, LEVEL_TONE, buildAgenda, type AgendaEvent } from "@/lib/sgla/alerts";
import { useClients, useConditions, useProcesses } from "@/lib/sgla/db";
import { fmtDate } from "@/lib/sgla/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário ambiental | SGLA" },
      {
        name: "description",
        content:
          "Calendário ambiental do SGLA com vencimento de licenças, prazos de condicionantes, vistorias e exigências técnicas em visão mensal, semanal ou em lista.",
      },
      { property: "og:title", content: "Calendário ambiental | SGLA" },
      {
        property: "og:description",
        content: "Agenda consolidada de prazos ambientais por mês, semana ou lista.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <CalendarPage />
    </AppShell>
  ),
});

const VIEWS = ["Mês", "Semana", "Lista"] as const;
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function CalendarPage() {
  const clients = useClients();
  const processes = useProcesses();
  const conditions = useConditions();

  const [view, setView] = useState<(typeof VIEWS)[number]>("Mês");
  const [cursor, setCursor] = useState(() => new Date());

  const loading = clients.isLoading || processes.isLoading || conditions.isLoading;

  const events = useMemo(
    () =>
      buildAgenda({
        clients: clients.data ?? [],
        processes: processes.data ?? [],
        conditions: conditions.data ?? [],
      }),
    [clients.data, processes.data, conditions.data],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, AgendaEvent[]>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  const shift = (n: number) => {
    setCursor((c) => {
      const x = new Date(c);
      if (view === "Semana") x.setDate(x.getDate() + n * 7);
      else x.setMonth(x.getMonth() + n);
      return x;
    });
  };

  const monthLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = startOfWeek(first);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i)),
    [cursor],
  );

  const upcoming = useMemo(() => {
    const today = iso(new Date());
    return events.filter((e) => e.date >= today).slice(0, 40);
  }, [events]);

  return (
    <>
      <PageHeader
        title="Calendário ambiental"
        subtitle="Vencimento de licenças, prazos de condicionantes, vistorias e exigências — a partir das datas já registradas."
        actions={
          <div className="flex flex-wrap gap-1.5">
            {VIEWS.map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`press ripple-host rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === v
                    ? "border-primary/45 bg-primary/12 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        }
      />

      <Panel>
        {view !== "Lista" ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => shift(-1)}
              className="press rounded-lg border border-border p-2"
              aria-label="Período anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-medium capitalize">
              {view === "Mês"
                ? monthLabel
                : `${fmtDate(iso(weekDays[0]!))} — ${fmtDate(iso(weekDays[6]!))}`}
            </p>
            <button
              onClick={() => shift(1)}
              className="press rounded-lg border border-border p-2"
              aria-label="Próximo período"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        ) : null}

        {loading ? (
          <LoadingRows />
        ) : events.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Nenhum prazo registrado"
            description="Cadastre datas de validade em processos e prazos em condicionantes para que os eventos apareçam aqui."
          />
        ) : view === "Mês" ? (
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((w) => (
              <p
                key={w}
                className="pb-1 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
              >
                {w}
              </p>
            ))}
            {monthDays.map((d) => {
              const key = iso(d);
              const dayEvents = byDate.get(key) ?? [];
              const otherMonth = d.getMonth() !== cursor.getMonth();
              const isToday = key === iso(new Date());
              return (
                <div
                  key={key}
                  className={cn(
                    "min-h-[86px] rounded-lg border border-border p-1.5",
                    otherMonth ? "opacity-45" : "bg-card/60",
                    isToday && "border-primary/50",
                  )}
                >
                  <p
                    className={cn(
                      "mb-1 text-[11px] font-medium",
                      isToday ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {d.getDate()}
                  </p>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((e) => (
                      <Link
                        key={e.id}
                        to={e.to}
                        title={`${e.kind}: ${e.title}`}
                        className="press block truncate rounded px-1 py-0.5 text-[10px] leading-tight text-foreground/90 hover:bg-muted"
                      >
                        <span
                          className={cn(
                            "mr-1 inline-block size-1.5 rounded-full align-middle",
                            e.level === "vencido" || e.level === "critico"
                              ? "bg-destructive"
                              : e.level === "alerta" || e.level === "atencao"
                                ? "bg-warning"
                                : "bg-info",
                          )}
                        />
                        {e.title}
                      </Link>
                    ))}
                    {dayEvents.length > 3 ? (
                      <p className="px-1 text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : view === "Semana" ? (
          <div className="grid gap-2 md:grid-cols-7">
            {weekDays.map((d) => {
              const key = iso(d);
              const dayEvents = byDate.get(key) ?? [];
              return (
                <div key={key} className="rounded-lg border border-border bg-card/60 p-2">
                  <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                    {WEEKDAYS[d.getDay()]} {d.getDate()}
                  </p>
                  <div className="space-y-1.5">
                    {dayEvents.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">—</p>
                    ) : (
                      dayEvents.map((e) => (
                        <Link
                          key={e.id}
                          to={e.to}
                          className="press block rounded-md border border-border p-1.5 text-[11px] leading-tight hover:bg-muted"
                        >
                          <span className="block truncate font-medium">{e.title}</span>
                          <span className="block truncate text-muted-foreground">{e.kind}</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Nenhum prazo futuro"
                description="Todos os eventos registrados já ocorreram."
              />
            ) : (
              upcoming.map((e) => (
                <li key={e.id}>
                  <Link
                    to={e.to}
                    className="press lift ripple-host flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.kind} • {e.subtitle} • {fmtDate(e.date)}
                      </p>
                    </div>
                    <Pill tone={LEVEL_TONE[e.level]}>{DEADLINE_LABEL[e.level]}</Pill>
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}
      </Panel>
    </>
  );
}
