import { createFileRoute } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Circle, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/sgla/AppShell";
import { Area, Btn, Choice, Modal, Text } from "@/components/sgla/form";
import { EmptyState, LoadingRows, PageHeader, Panel, Pill, priorityTone } from "@/components/sgla/primitives";
import { CONDITION_STATUS, PRIORITIES } from "@/lib/sgla/constants";
import {
  useClients,
  useConditions,
  useDeleteRow,
  useProcesses,
  useSaveCondition,
  useToggleCondition,
} from "@/lib/sgla/db";
import { daysUntil, fmtDate } from "@/lib/sgla/format";
import type { Condition, ConditionInsert } from "@/lib/sgla/types";

export const Route = createFileRoute("/condicionantes")({
  head: () => ({
    meta: [
      { title: "Condicionantes e prazos | SGLA" },
      {
        name: "description",
        content:
          "Controle de condicionantes ambientais: responsáveis, prazos de cumprimento, evidências e situação de atendimento por processo.",
      },
      { property: "og:title", content: "Condicionantes e prazos | SGLA" },
      {
        property: "og:description",
        content: "Acompanhamento de obrigações e prazos de licenças ambientais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ConditionsPage />
    </AppShell>
  ),
});

const emptyForm: ConditionInsert = {
  title: "",
  description: "",
  client_id: null,
  process_id: null,
  owner_name: "",
  due_date: null,
  evidence: "",
  done: false,
  status: "Pendente",
  priority: "Normal",
  progress: 0,
};


const FILTERS = ["Pendentes", "Vencidas", "Cumpridas", "Todas"] as const;

function ConditionsPage() {
  const conditions = useConditions();
  const clients = useClients();
  const processes = useProcesses();
  const save = useSaveCondition();
  const toggle = useToggleCondition();
  const del = useDeleteRow("conditions", "Condicionante");

  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Pendentes");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Condition | null>(null);
  const [form, setForm] = useState<ConditionInsert>(emptyForm);

  const set = <K extends keyof ConditionInsert>(k: K, v: ConditionInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const clientName = (id?: string | null) =>
    clients.data?.find((c) => c.id === id)?.legal_name ?? "Sem empreendimento";

  const list = useMemo(() => {
    const all = conditions.data ?? [];
    if (filter === "Todas") return all;
    if (filter === "Cumpridas") return all.filter((c) => c.done);
    if (filter === "Vencidas")
      return all.filter((c) => !c.done && (daysUntil(c.due_date) ?? 99) < 0);
    return all.filter((c) => !c.done);
  }, [conditions.data, filter]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, client_id: clients.data?.[0]?.id ?? null });
    setOpen(true);
  };

  const openEdit = (c: Condition) => {
    setEditing(c);
    const { id: _i, user_id: _u, created_at: _c, updated_at: _up, done_at: _d, ...rest } = c;
    setForm(rest as ConditionInsert);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Descreva o título da condicionante.");
      return;
    }
    const concluded = form.status === "Concluída";
    const payload: ConditionInsert = {
      ...form,
      done: concluded,
      progress: concluded ? 100 : Math.max(0, Math.min(100, Number(form.progress ?? 0))),
    };
    await save.mutateAsync({ ...payload, ...(editing ? { id: editing.id } : {}) });
    setOpen(false);
  };


  return (
    <>
      <PageHeader
        title="Condicionantes"
        subtitle="Obrigações vinculadas às licenças, com responsáveis e prazos."
        actions={
          <Btn onClick={openNew}>
            <Plus className="size-4" /> Nova condicionante
          </Btn>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`press ripple-host rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === f
                  ? "border-primary/45 bg-primary/12 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {conditions.isLoading ? (
          <LoadingRows />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="Nenhuma condicionante nesta visão"
            description="Cadastre as obrigações da licença para acompanhar prazos, responsáveis e evidências de cumprimento."
            action={
              <Btn onClick={openNew}>
                <Plus className="size-4" /> Cadastrar condicionante
              </Btn>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {list.map((c) => {
              const d = daysUntil(c.due_date);
              const tone = c.done
                ? "success"
                : d == null
                  ? "neutral"
                  : d < 0
                    ? "danger"
                    : d <= 15
                      ? "warning"
                      : "info";
              return (
                <li
                  key={c.id}
                  className="lift flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-start"
                >
                  <button
                    onClick={() => toggle.mutate({ id: c.id, done: !c.done })}
                    aria-label={c.done ? "Marcar como pendente" : "Marcar como cumprida"}
                    className="press mt-0.5 shrink-0"
                  >
                    {c.done ? (
                      <CheckCircle2 className="size-5 text-success" />
                    ) : (
                      <Circle className="size-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`text-sm font-medium ${c.done ? "text-muted-foreground line-through" : ""}`}
                      >
                        {c.title}
                      </p>
                      <Pill tone={tone}>
                        {c.done
                          ? "Cumprida"
                          : d == null
                            ? "Sem prazo"
                            : d < 0
                              ? `${Math.abs(d)}d em atraso`
                              : d === 0
                                ? "Vence hoje"
                                : `Faltam ${d}d`}
                      </Pill>
                      <Pill tone={priorityTone(String(c.priority ?? "Normal"))}>
                        {String(c.priority ?? "Normal")}
                      </Pill>
                      <Pill>{String(c.status ?? (c.done ? "Concluída" : "Pendente"))}</Pill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {clientName(c.client_id)}
                      {c.owner_name ? ` • responsável: ${c.owner_name}` : ""}
                      {c.due_date ? ` • prazo ${fmtDate(c.due_date)}` : ""}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{
                            width: `${c.done ? 100 : Math.max(0, Math.min(100, Number(c.progress ?? 0)))}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {c.done ? 100 : Math.max(0, Math.min(100, Number(c.progress ?? 0)))}%
                      </span>
                    </div>

                    {c.description ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {c.description}
                      </p>
                    ) : null}
                    {c.evidence ? (
                      <p className="mt-1 text-xs text-muted-foreground">Evidência: {c.evidence}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Btn variant="outline" onClick={() => openEdit(c)}>
                      <Pencil className="size-3.5" />
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => {
                        if (confirm("Excluir esta condicionante?")) del.mutate(c.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Btn>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={editing ? "Editar condicionante" : "Nova condicionante"}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Btn>
            <Btn form="cond-form" type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
            </Btn>
          </>
        }
      >
        <form id="cond-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Text
            label="Título *"
            required
            className="sm:col-span-2"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex.: Apresentar relatório trimestral de efluentes"
          />
          <Choice
            label="Empreendimento"
            value={form.client_id ?? ""}
            onChange={(e) => set("client_id", e.target.value || null)}
            options={[
              { value: "", label: "Sem vínculo" },
              ...(clients.data ?? []).map((c) => ({ value: c.id, label: c.legal_name })),
            ]}
          />
          <Choice
            label="Processo"
            value={form.process_id ?? ""}
            onChange={(e) => set("process_id", e.target.value || null)}
            options={[
              { value: "", label: "Sem vínculo" },
              ...(processes.data ?? []).map((p) => ({
                value: p.id,
                label: `${p.license_type} — ${p.protocol || "sem protocolo"}`,
              })),
            ]}
          />
          <Text
            label="Responsável"
            value={String(form.owner_name ?? "")}
            onChange={(e) => set("owner_name", e.target.value)}
          />
          <Choice
            label="Situação"
            value={String(form.status ?? "Pendente")}
            onChange={(e) => set("status", e.target.value)}
            options={CONDITION_STATUS.map((s) => ({ value: s, label: s }))}
          />
          <Choice
            label="Prioridade"
            value={String(form.priority ?? "Normal")}
            onChange={(e) => set("priority", e.target.value)}
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
          />
          <Text
            label="Percentual de conclusão (%)"
            type="number"
            min={0}
            max={100}
            value={String(form.progress ?? 0)}
            onChange={(e) => set("progress", Number(e.target.value))}
          />
          <Text
            label="Prazo"
            type="date"
            value={String(form.due_date ?? "")}
            onChange={(e) => set("due_date", e.target.value || null)}
          />
          <Area
            label="Descrição da obrigação"
            className="sm:col-span-2"
            value={String(form.description ?? "")}
            onChange={(e) => set("description", e.target.value)}
          />
          <Text
            label="Evidência de cumprimento"
            className="sm:col-span-2"
            value={String(form.evidence ?? "")}
            onChange={(e) => set("evidence", e.target.value)}
            placeholder="Protocolo, ofício, laudo ou referência do arquivo"
          />
        </form>
      </Modal>
    </>
  );
}
