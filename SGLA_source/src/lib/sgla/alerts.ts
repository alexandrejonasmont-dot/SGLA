import { daysUntil } from "./format";
import type { Client, Condition, Process, SglaDocument } from "./types";

/* ------------------------------------------------------------------ */
/* Classificação automática de prazos (calculada a partir da data atual) */
/* ------------------------------------------------------------------ */

export type DeadlineLevel = "vencido" | "critico" | "alerta" | "atencao" | "normal" | "sem_prazo";

export const DEADLINE_LABEL: Record<DeadlineLevel, string> = {
  vencido: "Vencido",
  critico: "Crítico",
  alerta: "Alerta",
  atencao: "Atenção",
  normal: "Normal",
  sem_prazo: "Sem prazo",
};

/** Regras: >30d normal · 15–30d atenção · 7–14d alerta · 1–6d crítico · <0 vencido. */
export function deadlineLevel(date?: string | null): DeadlineLevel {
  const d = daysUntil(date);
  if (d == null) return "sem_prazo";
  if (d < 0) return "vencido";
  if (d <= 6) return "critico";
  if (d <= 14) return "alerta";
  if (d <= 30) return "atencao";
  return "normal";
}

export type Tone = "neutral" | "info" | "success" | "warning" | "danger";

export const LEVEL_TONE: Record<DeadlineLevel, Tone> = {
  vencido: "danger",
  critico: "danger",
  alerta: "warning",
  atencao: "warning",
  normal: "info",
  sem_prazo: "neutral",
};

export function deadlineText(date?: string | null): string {
  const d = daysUntil(date);
  if (d == null) return "Sem prazo definido";
  if (d < 0) return `${Math.abs(d)} dia(s) em atraso`;
  if (d === 0) return "Vence hoje";
  return `Faltam ${d} dia(s)`;
}

/* ------------------------------------------------------------------ */
/* Estados derivados                                                    */
/* ------------------------------------------------------------------ */

export const CLOSED_PROCESS_STATUS = ["Deferido", "Indeferido", "Arquivado", "Finalizado"];

export const isProcessActive = (p: Process) => !CLOSED_PROCESS_STATUS.includes(p.status);

export const isConditionOpen = (c: Condition) =>
  !c.done && c.status !== "Concluída" && c.status !== "Dispensada";

export const PENDING_DOC_STATUS = ["Rascunho", "Em revisão"];

export const isDocumentPending = (d: SglaDocument) => PENDING_DOC_STATUS.includes(d.status);

/** Licenças = processos deferidos com data de validade. */
export const isLicense = (p: Process) => p.status === "Deferido" && Boolean(p.expires_at);

/* ------------------------------------------------------------------ */
/* Central de pendências                                                */
/* ------------------------------------------------------------------ */

export type PendencyCategory = "Processos" | "Condicionantes" | "Licenças" | "Documentos";

export interface Pendency {
  id: string;
  category: PendencyCategory;
  reason: string;
  title: string;
  subtitle: string;
  date: string | null;
  level: DeadlineLevel;
  to: "/processos" | "/condicionantes" | "/documentos" | "/clientes";
  clientId: string | null;
}

interface BuildInput {
  clients: Client[];
  processes: Process[];
  conditions: Condition[];
  documents: SglaDocument[];
}

const LEVEL_ORDER: DeadlineLevel[] = [
  "vencido",
  "critico",
  "alerta",
  "atencao",
  "normal",
  "sem_prazo",
];

export function buildPendencies({
  clients,
  processes,
  conditions,
  documents,
}: BuildInput): Pendency[] {
  const clientName = (id?: string | null) =>
    clients.find((c) => c.id === id)?.legal_name ?? "Sem empreendimento vinculado";

  const out: Pendency[] = [];

  /* Processos */
  for (const p of processes) {
    if (!isProcessActive(p)) continue;
    const reason =
      p.status === "Exigência técnica"
        ? "Exigência técnica pendente"
        : p.status === "Aguardando vistoria"
          ? "Vistoria pendente"
          : p.status === "Preparação documental"
            ? "Documentação em preparação"
            : null;

    const stale =
      p.status === "Em análise" && Date.now() - new Date(p.updated_at).getTime() > 60 * 86400000
        ? "Processo parado há mais de 60 dias"
        : null;

    const finalReason = reason ?? stale;
    if (!finalReason) continue;

    out.push({
      id: `proc-${p.id}`,
      category: "Processos",
      reason: finalReason,
      title: `${p.license_type}${p.protocol ? ` — ${p.protocol}` : ""}`,
      subtitle: `${clientName(p.client_id)} • ${p.agency ?? "Órgão não definido"}`,
      date: p.expires_at,
      level: p.status === "Exigência técnica" ? "critico" : deadlineLevel(p.expires_at),
      to: "/processos",
      clientId: p.client_id,
    });
  }

  /* Condicionantes */
  for (const c of conditions) {
    if (!isConditionOpen(c)) continue;
    const level = deadlineLevel(c.due_date);
    if (level === "normal" || level === "sem_prazo") continue;
    const reason =
      level === "vencido"
        ? "Condicionante vencida"
        : level === "critico"
          ? "Vence em até 7 dias"
          : level === "alerta"
            ? "Vence em até 14 dias"
            : "Vence em até 30 dias";
    out.push({
      id: `cond-${c.id}`,
      category: "Condicionantes",
      reason,
      title: c.title,
      subtitle: `${clientName(c.client_id)}${c.owner_name ? ` • ${c.owner_name}` : ""}`,
      date: c.due_date,
      level,
      to: "/condicionantes",
      clientId: c.client_id,
    });
  }

  /* Licenças */
  for (const p of processes) {
    if (!isLicense(p)) continue;
    const level = deadlineLevel(p.expires_at);
    if (level === "normal" || level === "sem_prazo") continue;
    out.push({
      id: `lic-${p.id}`,
      category: "Licenças",
      reason: level === "vencido" ? "Licença vencida" : "Licença próxima do vencimento",
      title: `${p.license_type}${p.protocol ? ` — ${p.protocol}` : ""}`,
      subtitle: `${clientName(p.client_id)} • validade em análise de renovação`,
      date: p.expires_at,
      level,
      to: "/processos",
      clientId: p.client_id,
    });
  }

  /* Documentos */
  for (const d of documents) {
    if (!isDocumentPending(d)) continue;
    out.push({
      id: `doc-${d.id}`,
      category: "Documentos",
      reason: d.status === "Em revisão" ? "Documento em revisão" : "Documento pendente de emissão",
      title: d.title,
      subtitle: `${clientName(d.client_id)} • situação: ${d.status}`,
      date: null,
      level: d.status === "Em revisão" ? "atencao" : "sem_prazo",
      to: "/documentos",
      clientId: d.client_id,
    });
  }

  return out.sort(
    (a, b) =>
      LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
      String(a.date ?? "9999").localeCompare(String(b.date ?? "9999")),
  );
}

/* ------------------------------------------------------------------ */
/* Situação geral do sistema                                            */
/* ------------------------------------------------------------------ */

export type OverallStatus = "REGULAR" | "ATENÇÃO" | "CRÍTICO";

export function overallStatus(pendencies: Pendency[]): OverallStatus {
  if (pendencies.some((p) => p.level === "vencido" || p.level === "critico")) return "CRÍTICO";
  if (pendencies.some((p) => p.level === "alerta" || p.level === "atencao")) return "ATENÇÃO";
  return "REGULAR";
}

export const OVERALL_TONE: Record<OverallStatus, Tone> = {
  REGULAR: "success",
  ATENÇÃO: "warning",
  CRÍTICO: "danger",
};

/* ------------------------------------------------------------------ */
/* Agenda / calendário ambiental                                        */
/* ------------------------------------------------------------------ */

export type AgendaKind = "Licença" | "Condicionante" | "Documento" | "Vistoria" | "Exigência";

export interface AgendaEvent {
  id: string;
  date: string; // YYYY-MM-DD
  kind: AgendaKind;
  title: string;
  subtitle: string;
  level: DeadlineLevel;
  to: "/processos" | "/condicionantes" | "/documentos";
}

export function buildAgenda({ clients, processes, conditions }: Omit<BuildInput, "documents">) {
  const clientName = (id?: string | null) =>
    clients.find((c) => c.id === id)?.legal_name ?? "Sem empreendimento vinculado";

  const events: AgendaEvent[] = [];

  for (const c of conditions) {
    if (!c.due_date) continue;
    events.push({
      id: `cond-${c.id}`,
      date: c.due_date.slice(0, 10),
      kind: "Condicionante",
      title: c.title,
      subtitle: clientName(c.client_id),
      level: isConditionOpen(c) ? deadlineLevel(c.due_date) : "normal",
      to: "/condicionantes",
    });
  }

  for (const p of processes) {
    if (p.expires_at) {
      events.push({
        id: `proc-exp-${p.id}`,
        date: p.expires_at.slice(0, 10),
        kind: p.status === "Deferido" ? "Licença" : "Documento",
        title:
          p.status === "Deferido"
            ? `Vencimento — ${p.license_type}`
            : `Prazo do processo — ${p.license_type}`,
        subtitle: `${clientName(p.client_id)}${p.protocol ? ` • ${p.protocol}` : ""}`,
        level: deadlineLevel(p.expires_at),
        to: "/processos",
      });
    }
    if (p.status === "Aguardando vistoria" && p.filed_at) {
      events.push({
        id: `proc-vist-${p.id}`,
        date: p.filed_at.slice(0, 10),
        kind: "Vistoria",
        title: `Vistoria — ${p.license_type}`,
        subtitle: clientName(p.client_id),
        level: "atencao",
        to: "/processos",
      });
    }
    if (p.status === "Exigência técnica" && p.filed_at) {
      events.push({
        id: `proc-exig-${p.id}`,
        date: p.filed_at.slice(0, 10),
        kind: "Exigência",
        title: `Exigência técnica — ${p.license_type}`,
        subtitle: clientName(p.client_id),
        level: "critico",
        to: "/processos",
      });
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/** Contagem simples para gráficos: agrupa por uma chave textual. */
export function countBy<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = key(item) || "Não informado";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
