import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Building2, Loader2, Pencil, Phone, Plus, Search, Trash2 } from "lucide-react";
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
} from "@/components/sgla/primitives";
import { consultarCnpj } from "@/lib/sgla/cnpj.functions";
import { PROPOSAL_STATUS, REGISTRATION_STATUS } from "@/lib/sgla/constants";
import { useClients, useDeleteRow, useSaveClient } from "@/lib/sgla/db";
import { maskCnpj, stripCnpj, validCnpjShape } from "@/lib/sgla/format";
import type { Client, ClientInsert } from "@/lib/sgla/types";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Empreendimentos | SGLA" },
      {
        name: "description",
        content:
          "Cadastro de empreendimentos com consulta cadastral de CNPJ, CNAE, endereço e responsáveis para processos de licenciamento ambiental.",
      },
      { property: "og:title", content: "Empreendimentos | SGLA" },
      {
        property: "og:description",
        content: "Gestão de empreendimentos e dados cadastrais para licenciamento ambiental.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <ClientsPage />
    </AppShell>
  ),
});

const emptyForm: ClientInsert = {
  legal_name: "",
  trade_name: "",
  cnpj: "",
  cnae: "",
  cnae_desc: "",
  secondary_cnaes: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  zip_code: "",
  address: "",
  city: "",
  uf: "",
  registration_status: "NAO_INFORMADA",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  contact_mobile: "",
  total_area: null,
  built_area: null,
  latitude: null,
  longitude: null,
  map_url: "",
  notes: "",
  data_source: "MANUAL",
  proposal_status: "Não enviada",
  proposal_sent_at: null,
  proposal_accepted_at: null,
  proposal_follow_up_month: null,
  communication_email_sent_at: null,
  communication_receipt_requested_at: null,
  communication_receipt_confirmed_at: null,
  communication_notes: "",
};

/** Monta o campo legado `address` a partir dos campos estruturados. */
function composeAddress(f: ClientInsert): string {
  return [f.street, f.number, f.complement, f.neighborhood, f.zip_code].filter(Boolean).join(", ");
}

function parseOptionalNumber(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function dateInputValue(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

function dateValue(value: string) {
  return value ? `${value}T00:00:00.000Z` : null;
}

function ClientsPage() {
  const clients = useClients();
  const save = useSaveClient();
  const del = useDeleteRow("clients", "Empreendimento");
  const lookup = useServerFn(consultarCnpj);

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientInsert>(emptyForm);
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ClientInsert>(k: K, v: ClientInsert[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.data ?? [];
    return (clients.data ?? []).filter((c) =>
      [c.legal_name, c.trade_name, c.cnpj, c.city, c.cnae_desc]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [clients.data, query]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    const { id: _id, user_id: _u, created_at: _c, updated_at: _up, ...rest } = c;
    setForm(rest as ClientInsert);
    setOpen(true);
  };

  const runLookup = async () => {
    const cnpj = stripCnpj(String(form.cnpj ?? ""));
    if (!validCnpjShape(cnpj)) {
      toast.error("Informe um CNPJ com 14 caracteres antes de consultar.");
      return;
    }
    setBusy(true);
    try {
      const res = await lookup({ data: { cnpj } });
      if (!res.ok || !res.data) {
        toast.error(res.error ?? "Consulta não retornou dados.");
        return;
      }
      const found = res.data;
      setForm((f) => ({
        ...f,
        ...found,
        contact_email: found.contact_email || f.contact_email || "",
        contact_phone: found.contact_phone || f.contact_phone || "",
        data_source: res.source ?? "MANUAL",
      }));
      toast.success(
        res.official
          ? "Dados obtidos na base oficial (SERPRO)."
          : "Dados obtidos em base pública de contingência — confirme antes do protocolo.",
      );
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.legal_name.trim()) {
      toast.error("A razão social é obrigatória.");
      return;
    }
    const address = composeAddress(form) || form.address || null;
    await save.mutateAsync({
      ...form,
      cnpj: form.cnpj ? stripCnpj(String(form.cnpj)) : null,
      address,
      total_area: form.total_area ?? null,
      built_area: form.built_area ?? null,
      latitude: form.latitude ?? null,
      longitude: form.longitude ?? null,
      ...(editing ? { id: editing.id } : {}),
    });
    setOpen(false);
  };

  return (
    <>
      <PageHeader
        title="Empreendimentos"
        subtitle="Cadastro de empreendimentos, dados cadastrais e responsáveis técnicos."
        actions={
          <Btn onClick={openNew}>
            <Plus className="size-4" /> Novo empreendimento
          </Btn>
        }
      />

      <Panel>
        <div className="relative mb-4">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por razão social, CNPJ, município ou CNAE"
            className="w-full rounded-lg border border-input bg-background py-2.5 pr-3 pl-9 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/25"
          />
        </div>

        {clients.isLoading ? (
          <LoadingRows />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Nenhum empreendimento encontrado"
            description="Cadastre um empreendimento manualmente ou use a consulta de CNPJ para preencher os dados cadastrais automaticamente."
            action={
              <Btn onClick={openNew}>
                <Plus className="size-4" /> Cadastrar empreendimento
              </Btn>
            }
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <article key={c.id} className="lift rounded-xl border border-border bg-card/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{c.legal_name}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.trade_name || "Sem nome fantasia"}
                    </p>
                  </div>
                  <Pill tone={c.registration_status === "ATIVA" ? "success" : "neutral"}>
                    {c.registration_status ?? "—"}
                  </Pill>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2.5">
                  <Field label="CNPJ" value={c.cnpj ? maskCnpj(c.cnpj) : "—"} />
                  <Field label="Município" value={[c.city, c.uf].filter(Boolean).join("/")} />
                  <Field label="CNAE" value={c.cnae} />
                  <Field label="Bairro" value={c.neighborhood || "—"} />
                </dl>
                {c.cnae_desc ? (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.cnae_desc}</p>
                ) : null}
                {(c.street || c.address) && (
                  <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
                    {[c.street, c.number, c.neighborhood, c.zip_code].filter(Boolean).join(", ") ||
                      c.address}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Btn variant="outline" onClick={() => openEdit(c)} className="flex-1">
                    <Pencil className="size-3.5" /> Editar
                  </Btn>
                  <Btn
                    variant="danger"
                    onClick={() => {
                      if (confirm(`Excluir o empreendimento ${c.legal_name}?`)) del.mutate(c.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
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
        title={editing ? "Editar empreendimento" : "Novo empreendimento"}
        description="Os dados alimentam automaticamente os documentos técnicos gerados pelo sistema."
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Btn>
            <Btn form="client-form" type="submit" disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
              empreendimento
            </Btn>
          </>
        }
      >
        <form id="client-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {/* Identificação */}
          <p className="sm:col-span-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Identificação
          </p>
          <div className="sm:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Text
                label="CNPJ"
                className="flex-1"
                value={String(form.cnpj ?? "")}
                onChange={(e) => set("cnpj", e.target.value)}
                placeholder="00.000.000/0000-00"
                hint="Consulta cadastral no backend (SERPRO ou contingência pública)."
              />
              <Btn type="button" variant="gold" onClick={runLookup} disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                Consultar
              </Btn>
            </div>
          </div>
          <Text
            label="Razão social *"
            required
            className="sm:col-span-2"
            value={form.legal_name}
            onChange={(e) => set("legal_name", e.target.value)}
          />
          <Text
            label="Nome fantasia"
            value={String(form.trade_name ?? "")}
            onChange={(e) => set("trade_name", e.target.value)}
          />
          <Choice
            label="Situação cadastral"
            value={String(form.registration_status ?? "NAO_INFORMADA")}
            onChange={(e) => set("registration_status", e.target.value)}
            options={REGISTRATION_STATUS}
          />
          <Text
            label="CNAE principal"
            value={String(form.cnae ?? "")}
            onChange={(e) => set("cnae", e.target.value)}
            placeholder="0000000"
          />
          <Text
            label="Descrição do CNAE principal"
            value={String(form.cnae_desc ?? "")}
            onChange={(e) => set("cnae_desc", e.target.value)}
          />
          <Area
            label="CNAEs secundários"
            className="sm:col-span-2"
            value={String(form.secondary_cnaes ?? "")}
            onChange={(e) => set("secondary_cnaes", e.target.value)}
            hint="Lista separada por ponto-e-vírgula. Preenchido automaticamente na consulta de CNPJ quando disponível."
          />

          {/* Endereço */}
          <p className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Endereço
          </p>
          <Text
            label="Logradouro"
            className="sm:col-span-2"
            value={String(form.street ?? "")}
            onChange={(e) => set("street", e.target.value)}
            placeholder="Rua, avenida, rodovia…"
          />
          <Text
            label="Número"
            value={String(form.number ?? "")}
            onChange={(e) => set("number", e.target.value)}
          />
          <Text
            label="Complemento"
            value={String(form.complement ?? "")}
            onChange={(e) => set("complement", e.target.value)}
          />
          <Text
            label="Bairro"
            value={String(form.neighborhood ?? "")}
            onChange={(e) => set("neighborhood", e.target.value)}
          />
          <Text
            label="CEP"
            value={String(form.zip_code ?? "")}
            onChange={(e) => set("zip_code", e.target.value)}
            placeholder="00000-000"
          />
          <Text
            label="Município"
            value={String(form.city ?? "")}
            onChange={(e) => set("city", e.target.value)}
          />
          <Text
            label="UF"
            maxLength={2}
            value={String(form.uf ?? "")}
            onChange={(e) => set("uf", e.target.value.toUpperCase())}
          />

          {/* Responsável */}
          <p className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Responsável
          </p>
          <Text
            label="Responsável legal"
            value={String(form.contact_name ?? "")}
            onChange={(e) => set("contact_name", e.target.value)}
          />
          <Text
            label="E-mail"
            type="email"
            value={String(form.contact_email ?? "")}
            onChange={(e) => set("contact_email", e.target.value)}
          />
          <Text
            label="Telefone celular"
            value={String(form.contact_mobile ?? "")}
            onChange={(e) => set("contact_mobile", e.target.value)}
            placeholder="(00) 90000-0000"
          />
          <Text
            label="Telefone fixo"
            value={String(form.contact_phone ?? "")}
            onChange={(e) => set("contact_phone", e.target.value)}
            placeholder="(00) 0000-0000"
          />

          {/* Caracterização física */}
          <p className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Caracterização física
          </p>
          <Text
            label="Área total (m²)"
            value={form.total_area != null ? String(form.total_area) : ""}
            onChange={(e) => set("total_area", parseOptionalNumber(e.target.value))}
            placeholder="0,00"
          />
          <Text
            label="Área construída (m²)"
            value={form.built_area != null ? String(form.built_area) : ""}
            onChange={(e) => set("built_area", parseOptionalNumber(e.target.value))}
            placeholder="0,00"
          />
          <Text
            label="Latitude"
            value={form.latitude != null ? String(form.latitude) : ""}
            onChange={(e) => set("latitude", parseOptionalNumber(e.target.value))}
            placeholder="-9.752"
          />
          <Text
            label="Longitude"
            value={form.longitude != null ? String(form.longitude) : ""}
            onChange={(e) => set("longitude", parseOptionalNumber(e.target.value))}
            placeholder="-36.661"
          />
          <Text
            label="Link do mapa"
            className="sm:col-span-2"
            value={String(form.map_url ?? "")}
            onChange={(e) => set("map_url", e.target.value)}
            placeholder="https://maps.google.com/…"
            hint="Cole o link do Google Maps ou similar para localização do empreendimento."
          />

          {/* Comunicação e proposta */}
          <p className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Comunicação com o cliente
          </p>
          <Text
            label="E-mail enviado em"
            type="date"
            value={dateInputValue(form.communication_email_sent_at)}
            onChange={(e) => set("communication_email_sent_at", dateValue(e.target.value))}
          />
          <Text
            label="Confirmação solicitada em"
            type="date"
            value={dateInputValue(form.communication_receipt_requested_at)}
            onChange={(e) => set("communication_receipt_requested_at", dateValue(e.target.value))}
          />
          <Text
            label="Recebimento confirmado em"
            type="date"
            value={dateInputValue(form.communication_receipt_confirmed_at)}
            onChange={(e) => set("communication_receipt_confirmed_at", dateValue(e.target.value))}
          />
          <Area
            label="Observações da comunicação"
            value={String(form.communication_notes ?? "")}
            onChange={(e) => set("communication_notes", e.target.value)}
          />
          {form.communication_receipt_requested_at && !form.communication_receipt_confirmed_at ? (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/8 p-3 text-xs text-warning">
              <Phone className="size-4 shrink-0" />
              <span className="flex-1">Ausência de confirmação: ligar para o cliente.</span>
              {form.contact_mobile ? (
                <a className="font-semibold underline" href={`tel:${form.contact_mobile}`}>
                  Ligar
                </a>
              ) : null}
            </div>
          ) : null}

          <p className="sm:col-span-2 mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            Proposta comercial
          </p>
          <Choice
            label="Situação da proposta"
            value={String(form.proposal_status ?? "Não enviada")}
            onChange={(e) => set("proposal_status", e.target.value)}
            options={PROPOSAL_STATUS}
          />
          <Text
            label="Proposta enviada em"
            type="date"
            value={dateInputValue(form.proposal_sent_at)}
            onChange={(e) => set("proposal_sent_at", dateValue(e.target.value))}
          />
          <Text
            label="Proposta aceita em"
            type="date"
            value={dateInputValue(form.proposal_accepted_at)}
            onChange={(e) => set("proposal_accepted_at", dateValue(e.target.value))}
          />
          <Text
            label="Acompanhamento mensal"
            type="month"
            value={dateInputValue(form.proposal_follow_up_month).slice(0, 7)}
            onChange={(e) =>
              set("proposal_follow_up_month", e.target.value ? `${e.target.value}-01` : null)
            }
            hint="Mês para acompanhar pessoalmente a proposta."
          />

          <Area
            label="Observações técnicas"
            className="sm:col-span-2"
            value={String(form.notes ?? "")}
            onChange={(e) => set("notes", e.target.value)}
          />
        </form>
      </Modal>
    </>
  );
}
