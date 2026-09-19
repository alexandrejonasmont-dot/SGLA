import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileDown, FileText, Loader2, Plus, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/sgla/AppShell";
import { Btn, Choice, Modal, Text } from "@/components/sgla/form";
import { EmptyState, LoadingRows, PageHeader, Panel, Pill } from "@/components/sgla/primitives";
import { useAuth } from "@/hooks/useAuth";
import { askEnvironmentalAI } from "@/lib/sgla/ai.functions";
import { CHECKLIST_STATUS, DOC_STATUS, DOCUMENT_TYPES } from "@/lib/sgla/constants";
import {
  useClients,
  useDeleteRow,
  useDocuments,
  useProcesses,
  useSaveDocument,
} from "@/lib/sgla/db";
import { exportDocx, exportPdf } from "@/lib/sgla/export";
import { fmtDateTime } from "@/lib/sgla/format";
import { TEMPLATES, templateByKey } from "@/lib/sgla/templates";
import type { SglaDocument } from "@/lib/sgla/types";

export const Route = createFileRoute("/documentos")({
  head: () => ({
    meta: [
      { title: "Documentos técnicos em Word e PDF | SGLA" },
      {
        name: "description",
        content:
          "Gere requerimentos, relatórios, memoriais e checklists ambientais a partir dos dados do processo e exporte em Word (.docx) e PDF.",
      },
      { property: "og:title", content: "Documentos técnicos | SGLA" },
      {
        property: "og:description",
        content: "Emissão de documentos ambientais em Word e PDF com dados do processo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <DocumentsPage />
    </AppShell>
  ),
});

function DocumentsPage() {
  const documents = useDocuments();
  const clients = useClients();
  const processes = useProcesses();
  const save = useSaveDocument();
  const del = useDeleteRow("documents", "Documento");
  const ai = useServerFn(askEnvironmentalAI);
  const { user } = useAuth();

  const [openEditor, setOpenEditor] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [templateKey, setTemplateKey] = useState(TEMPLATES[0]!.key);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string>("Rascunho");
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0]);
  const [checklistStatus, setChecklistStatus] = useState<string>("Pendente");
  const [clientId, setClientId] = useState<string>("");
  const [processId, setProcessId] = useState<string>("");
  const [aiBusy, setAiBusy] = useState(false);
  const [exporting, setExporting] = useState(false);

  const client = useMemo(
    () => clients.data?.find((c) => c.id === clientId) ?? null,
    [clients.data, clientId],
  );
  const process = useMemo(
    () => processes.data?.find((p) => p.id === processId) ?? null,
    [processes.data, processId],
  );

  const authorName =
    (user?.user_metadata?.["full_name"] as string | undefined) ||
    user?.email ||
    "Responsável Técnico";

  const applyTemplate = (key: string) => {
    const tpl = templateByKey(key);
    const built = tpl.build({ client, process, author: authorName });
    setTemplateKey(key);
    setTitle(built.title);
    setContent(built.content);
  };

  const openNew = () => {
    setId(null);
    setStatus("Rascunho");
    setDocumentType(DOCUMENT_TYPES[0]);
    setChecklistStatus("Pendente");
    const firstClient = clients.data?.[0]?.id ?? "";
    setClientId(firstClient);
    setProcessId(processes.data?.find((p) => p.client_id === firstClient)?.id ?? "");
    const tpl = templateByKey(TEMPLATES[0]!.key);
    const built = tpl.build({
      client: clients.data?.[0] ?? null,
      process: processes.data?.[0] ?? null,
      author: authorName,
    });
    setTemplateKey(tpl.key);
    setTitle(built.title);
    setContent(built.content);
    setOpenEditor(true);
  };

  const openExisting = (d: SglaDocument) => {
    setId(d.id);
    setTemplateKey(d.template_key);
    setTitle(d.title);
    setContent(d.content);
    setStatus(d.status);
    setDocumentType(d.document_type ?? "Outro");
    setChecklistStatus(d.checklist_status ?? "Pendente");
    setClientId(d.client_id ?? "");
    setProcessId(d.process_id ?? "");
    setOpenEditor(true);
  };

  const persist = async () => {
    if (!title.trim()) {
      toast.error("Informe o título do documento.");
      return;
    }
    const saved = await save.mutateAsync({
      ...(id ? { id } : {}),
      title,
      content,
      status,
      document_type: documentType,
      checklist_status: checklistStatus,
      template_key: templateKey,
      client_id: clientId || null,
      process_id: processId || null,
    });
    if (saved && !id) setId(saved.id);
  };

  const meta = {
    title,
    content,
    clientName: client?.legal_name ?? "",
    processLabel: process ? `${process.license_type} — ${process.protocol || "sem protocolo"}` : "",
    organization: "Consultoria Ambiental",
  };

  const doExport = async (kind: "docx" | "pdf") => {
    if (!content.trim()) {
      toast.error("O documento está vazio.");
      return;
    }
    setExporting(true);
    try {
      if (kind === "docx") await exportDocx(meta);
      else exportPdf(meta);
      toast.success(`Arquivo ${kind.toUpperCase()} gerado.`);
    } catch {
      toast.error("Não foi possível gerar o arquivo.");
    } finally {
      setExporting(false);
    }
  };

  const runAI = async (task: "improve" | "review") => {
    if (!content.trim()) {
      toast.error("Escreva ou gere um conteúdo antes de acionar a IA.");
      return;
    }
    setAiBusy(true);
    try {
      const res = await ai({
        data: {
          task,
          prompt: content,
          context: [
            client
              ? `Empreendimento: ${client.legal_name} (CNPJ ${client.cnpj ?? "não informado"})`
              : "",
            process
              ? `Processo: ${process.license_type} / ${process.agency ?? "órgão não definido"} / fase ${process.status}`
              : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
      });
      if (!res.ok) {
        toast.error(res.error ?? "A IA não respondeu.");
        return;
      }
      setContent(res.text);
      toast.success(
        task === "improve" ? "Documento aprimorado pela IA." : "Revisão técnica concluída.",
      );
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="Modelos técnicos preenchidos com os dados do processo, exportáveis em Word e PDF."
        actions={
          <Btn onClick={openNew}>
            <Plus className="size-4" /> Novo documento
          </Btn>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel title="Documentos emitidos" description="Histórico salvo na base do sistema.">
          {documents.isLoading ? (
            <LoadingRows />
          ) : (documents.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhum documento emitido"
              description="Escolha um modelo, vincule empreendimento e processo e gere o documento em Word ou PDF."
              action={
                <Btn onClick={openNew}>
                  <Plus className="size-4" /> Criar documento
                </Btn>
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {documents.data!.map((d) => (
                <li
                  key={d.id}
                  className="lift flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {templateByKey(d.template_key).name} • atualizado em{" "}
                      {fmtDateTime(d.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Pill tone={d.checklist_status === "Concluído" ? "success" : "warning"}>
                      {d.checklist_status ?? "Pendente"}
                    </Pill>
                    <Pill
                      tone={
                        d.status === "Aprovado"
                          ? "success"
                          : d.status === "Protocolado"
                            ? "info"
                            : "gold"
                      }
                    >
                      {d.status}
                    </Pill>
                    <Btn variant="outline" onClick={() => openExisting(d)}>
                      Abrir
                    </Btn>
                    <Btn
                      variant="danger"
                      onClick={() => {
                        if (confirm("Excluir este documento?")) del.mutate(d.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Modelos disponíveis" description="Estruturas técnicas prontas." delay={0.1}>
          <ul className="space-y-2">
            {TEMPLATES.map((t) => (
              <li key={t.key} className="rounded-xl border border-border bg-card/60 p-3.5">
                <p className="text-sm font-medium">{t.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Modal
        open={openEditor}
        onClose={() => setOpenEditor(false)}
        wide
        title={id ? "Editar documento" : "Novo documento"}
        description="Confirme dados oficiais antes de protocolar. Campos com ____ exigem preenchimento."
        footer={
          <>
            <Btn variant="ghost" onClick={() => setOpenEditor(false)}>
              Fechar
            </Btn>
            <Btn variant="outline" onClick={() => void doExport("pdf")} disabled={exporting}>
              <FileDown className="size-4" /> PDF
            </Btn>
            <Btn variant="gold" onClick={() => void doExport("docx")} disabled={exporting}>
              <FileDown className="size-4" /> Word
            </Btn>
            <Btn onClick={() => void persist()} disabled={save.isPending}>
              {save.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Salvar
            </Btn>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Choice
              label="Modelo"
              value={templateKey}
              onChange={(e) => applyTemplate(e.target.value)}
              options={TEMPLATES.map((t) => ({ value: t.key, label: t.name }))}
            />
            <Choice
              label="Situação"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={DOC_STATUS}
            />
            <Choice
              label="Tipo de documento"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              options={DOCUMENT_TYPES}
            />
            <Choice
              label="Checklist"
              value={checklistStatus}
              onChange={(e) => setChecklistStatus(e.target.value)}
              options={CHECKLIST_STATUS}
            />
            <Choice
              label="Empreendimento"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setProcessId("");
              }}
              options={[
                { value: "", label: "Sem vínculo" },
                ...(clients.data ?? []).map((c) => ({ value: c.id, label: c.legal_name })),
              ]}
            />
            <Choice
              label="Processo"
              value={processId}
              onChange={(e) => setProcessId(e.target.value)}
              options={[
                { value: "", label: "Sem vínculo" },
                ...(processes.data ?? [])
                  .filter((p) => !clientId || p.client_id === clientId)
                  .map((p) => ({
                    value: p.id,
                    label: `${p.license_type} — ${p.protocol || "sem protocolo"}`,
                  })),
              ]}
            />
          </div>

          <Text
            label="Título do documento"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Btn type="button" variant="outline" onClick={() => applyTemplate(templateKey)}>
              <Wand2 className="size-4" /> Regerar do modelo
            </Btn>
            <Btn
              type="button"
              variant="outline"
              onClick={() => void runAI("improve")}
              disabled={aiBusy}
            >
              {aiBusy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Aprimorar com IA
            </Btn>
            <Btn
              type="button"
              variant="outline"
              onClick={() => void runAI("review")}
              disabled={aiBusy}
            >
              Revisão técnica
            </Btn>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              Conteúdo
            </span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              spellCheck
              className="min-h-[46vh] w-full resize-y rounded-lg border border-input bg-background px-4 py-3 font-mono text-[13px] leading-relaxed outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/25"
            />
          </label>
        </div>
      </Modal>
    </>
  );
}
