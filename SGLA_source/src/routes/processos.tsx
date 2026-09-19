import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Pencil, Plus, ScrollText, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/sgla/AppShell";
import { Area, Btn, Choice, Modal, Text } from "@/components/sgla/form";
import {
  EmptyState,
  Field,
  LoadingRows,
  PageHeader,
  Panel,
  Pill,
  priorityTone,
  statusTone,
} from "@/components/sgla/primitives";
import { AGENCIES, LICENSE_TYPES, PRIORITIES, PROCESS_STATUS } from "@/lib/sgla/constants";
import { useClients, useDeleteRow, useProcesses, useSaveProcess } from "@/lib/sgla/db";
import { fmtDate, todayISO } from "@/lib/sgla/format";
import type { Process, ProcessInsert } from "@/lib/sgla/types";

export const Route = createFileRoute("/processos")({
  head: () => ({
    meta: [
      { title: "Processos de licenciamento | SGLA" },
      {
        name: "description",
        content:
          "Acompanhe processos de licenciamento ambiental por fase, órgão competente, prioridade, protocolo e validade da licença.",
      },
      { property: "og:title", content: "Processos de licenciamento | SGLA" },
      {
        property: "og:description",
        content: "Controle de fases, protocolos e prazos de licenças ambientais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ProcessesPage />
    </AppShell>
  ),
});

const emptyForm: ProcessInsert = {
  client_id: null,
  license_type: LICENSE_TYPES[0],
  agency: AGENCIES[0],
  status: PROCESS_STATUS[0],
  priority: "Normal",
  protocol: "",
  owner_name: "",
  opened_at: todayISO(),
  filed_at: null,
  expires_at: null,
  notes: "",
};

function ProcessesPage() {
  const processes = useProcesses();
  const clients = useClients();
  const save = useSaveProcess();
  const del = useDeleteRow("processes", "Processo");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Process | null>(null);
  const [form, setForm] = useState<ProcessInsert>(emptyForm);
  const [status, setStatus] = useState("Todos");

  const set = <K extends keyof ProcessInsert>(k: K, v: ProcessInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const clientName = (id?: string | null) =>
    clients.data?.find((c) => c.id === id)?.legal_name ?? "Empreendimento não vinculado";

  const filtered = useMemo(
    () => (processes.data ?? []).filter((p) => status === "Todos" || p.status === status),
    [processes.data, status],
  );

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, client_id: clients.data?.[0]?.id ?? null });
    setOpen(true);
  };

  const openEdit = (p: Process) => {
    setEditing(p);
    const { id: _i, user_id: _u, created_at: _c, updated_at: _up, ...rest } = p;
    setForm(rest as ProcessInsert);
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client_id) {
      toast.error("Vincule o processo a um empreendimento.");
      return;
    }
    await save.mutateAsync({ ...form, ...(editing ? { id: editing.id } : {}) });
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Processos"
        subtitle="Fases, órgãos competentes, protocolos e validade das licenças."
        actions={
          <Btn onClick={openNew}>
            <Plus className="size-4" /> Novo processo
          </Btn>
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {["Todos", ...PROCESS_STATUS].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`press ripple-host rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                status === s
                  ? "border-primary/45 bg-primary/12 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {processes.isLoading ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="Nenhum processo nesta visão"
            description="Abra um novo processo vinculado a um empreendimento para iniciar o acompanhamento de prazos e documentos."
            action={
              <Btn onClick={openNew}>
                <Plus className="size-4" /> Abrir processo
              </Btn>
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => (
              <article key={p.id} className="lift rounded-xl border border-border bg-card/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{p.license_type}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {clientName(p.client_id)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={priorityTone(p.priority)}>{p.priority}</Pill>
                    <Pill tone={statusTone(p.status)}>{p.status}</Pill>
                  </div>
                </div>
                <dl className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Field label="Órgão" value={p.agency} />
                  <Field label="Protocolo" value={p.protocol} />
                  <Field label="Abertura" value={fmtDate(p.opened_at)} />
                  <Field label="Protocolado em" value={fmtDate(p.filed_at)} />
                  <Field label="Validade" value={fmtDate(p.expires_at)} />
                </dl>
                {p.notes ? (
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{p.notes}</p>
                ) : null}
                <div className="mt-4 flex items-center gap-2">
                  <Btn variant="outline" onClick={() => openEdit(p)}>
                    <Pencil className="size-3.5" /> Editar
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      if (confirm("Excluir este processo?")) del.mutate(p.id);
                    }}
                  >
                    <Trash2 className="size-3.5" /> Excluir
                  </Btn>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={editing ? "Editar processo" : "Novo processo"}
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Btn>
            <Btn form="process-form" type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Salvar processo
            </Btn>
          </>
        }
      >
        <form id="process-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Choice
            label="Empreendimento *"
            className="sm:col-span-2"
            value={form.client_id ?? ""}
            onChange={(e) => set("client_id", e.target.value || null)}
            options={[
              { value: "", label: "Selecione o empreendimento" },
              ...(clients.data ?? []).map((c) => ({ value: c.id, label: c.legal_name })),
            ]}
          />
          <Choice
            label="Tipo de licença"
            value={form.license_type ?? LICENSE_TYPES[0]}
            onChange={(e) => set("license_type", e.target.value)}
            options={LICENSE_TYPES}
          />
          <Choice
            label="Órgão ambiental"
            value={form.agency ?? AGENCIES[0]}
            onChange={(e) => set("agency", e.target.value)}
            options={AGENCIES}
          />
          <Choice
            label="Fase do processo"
            value={form.status ?? PROCESS_STATUS[0]}
            onChange={(e) => set("status", e.target.value)}
            options={PROCESS_STATUS}
          />
          <Choice
            label="Prioridade"
            value={form.priority ?? "Normal"}
            onChange={(e) => set("priority", e.target.value)}
            options={PRIORITIES}
          />
          <Text
            label="Nº de protocolo"
            value={String(form.protocol ?? "")}
            onChange={(e) => set("protocol", e.target.value)}
            placeholder="Somente se já protocolado"
          />
          <Text
            label="Responsável técnico"
            value={String(form.owner_name ?? "")}
            onChange={(e) => set("owner_name", e.target.value)}
          />
          <Text
            label="Abertura"
            type="date"
            value={String(form.opened_at ?? "")}
            onChange={(e) => set("opened_at", e.target.value || null)}
          />
          <Text
            label="Data de protocolo"
            type="date"
            value={String(form.filed_at ?? "")}
            onChange={(e) => set("filed_at", e.target.value || null)}
          />
          <Text
            label="Validade da licença"
            type="date"
            value={String(form.expires_at ?? "")}
            onChange={(e) => set("expires_at", e.target.value || null)}
          />
          <Area
            label="Anotações do processo"
            className="sm:col-span-2"
            value={String(form.notes ?? "")}
            onChange={(e) => set("notes", e.target.value)}
          />
        </form>
      </Modal>
    </>
  );
}
