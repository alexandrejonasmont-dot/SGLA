import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/sgla/AppShell";
import { Btn, Choice } from "@/components/sgla/form";
import { PageHeader, Panel } from "@/components/sgla/primitives";
import { askEnvironmentalAI } from "@/lib/sgla/ai.functions";
import { useClients, useConditions, useProcesses } from "@/lib/sgla/db";
import { fmtDate, maskCnpj } from "@/lib/sgla/format";

export const Route = createFileRoute("/ia")({
  head: () => ({
    meta: [
      { title: "IA Ambiental | SGLA" },
      {
        name: "description",
        content:
          "Assistente de licenciamento ambiental executado no backend, com contexto do processo selecionado: checklists, próximos passos e resumos técnicos.",
      },
      { property: "og:title", content: "IA Ambiental | SGLA" },
      {
        property: "og:description",
        content: "Assistente técnico especializado em licenciamento ambiental brasileiro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <AppShell>
      <AiPage />
    </AppShell>
  ),
});

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const QUICK = [
  {
    task: "checklist" as const,
    label: "Checklist documental",
    prompt: "Monte o checklist documental para este processo.",
  },
  {
    task: "next_steps" as const,
    label: "Próximos passos",
    prompt: "Quais são os próximos passos operacionais deste processo?",
  },
  {
    task: "summary" as const,
    label: "Resumo executivo",
    prompt: "Resuma o processo deste empreendimento.",
  },
];

function AiPage() {
  const clients = useClients();
  const processes = useProcesses();
  const conditions = useConditions();
  const ai = useServerFn(askEnvironmentalAI);

  const [processId, setProcessId] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const process = processes.data?.find((p) => p.id === processId) ?? null;
  const client = clients.data?.find((c) => c.id === process?.client_id) ?? null;

  const context = useMemo(() => {
    if (!process) return "Nenhum processo selecionado pelo usuário.";
    const pend = (conditions.data ?? []).filter((c) => c.process_id === process.id && !c.done);
    return [
      client
        ? `Empreendimento: ${client.legal_name} | CNPJ: ${client.cnpj ? maskCnpj(client.cnpj) : "não informado"} | CNAE: ${client.cnae ?? "—"} ${client.cnae_desc ?? ""} | Município: ${[client.city, client.uf].filter(Boolean).join("/")}`
        : "Empreendimento não vinculado.",
      `Processo: ${process.license_type} | Órgão: ${process.agency ?? "—"} | Fase: ${process.status} | Protocolo: ${process.protocol || "não protocolado"} | Validade: ${fmtDate(process.expires_at)}`,
      pend.length
        ? `Condicionantes pendentes:\n${pend.map((c) => `- ${c.title} (prazo ${fmtDate(c.due_date)})`).join("\n")}`
        : "Sem condicionantes pendentes registradas.",
    ].join("\n");
  }, [process, client, conditions.data]);

  const send = async (task: "chat" | "checklist" | "next_steps" | "summary", prompt: string) => {
    if (!prompt.trim() || busy) return;
    const next = [...messages, { role: "user" as const, content: prompt }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await ai({
        data: { task, prompt, context, history: messages.slice(-8) },
      });
      if (!res.ok) {
        toast.error(res.error ?? "A IA não respondeu.");
        setMessages([
          ...next,
          { role: "assistant", content: res.error ?? "Não foi possível responder agora." },
        ]);
        return;
      }
      setMessages([...next, { role: "assistant", content: res.text }]);
    } finally {
      setBusy(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <>
      <PageHeader
        title="IA Ambiental"
        subtitle="Assistente técnico com o contexto real do processo selecionado. Executa no backend, sem expor chaves."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Panel className="flex min-h-[62vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center py-14 text-center">
                <span className="mb-3 grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10">
                  <Bot className="size-5 text-primary" />
                </span>
                <p className="font-display text-sm font-semibold">Como posso apoiar o processo?</p>
                <p className="mt-1 max-w-md text-xs text-muted-foreground">
                  Selecione um processo ao lado para dar contexto real ao assistente. Ele nunca
                  inventa protocolos, datas ou decisões oficiais.
                </p>
              </div>
            ) : (
              messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
                >
                  {m.role === "assistant" ? (
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10">
                      <Bot className="size-4 text-primary" />
                    </span>
                  ) : null}
                  <div
                    className={`max-w-[80%] rounded-2xl border px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "border-primary/30 bg-primary/10"
                        : "border-border bg-card/70"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === "user" ? (
                    <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted">
                      <User className="size-4 text-muted-foreground" />
                    </span>
                  ) : null}
                </motion.div>
              ))
            )}
            {busy ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Analisando o contexto do processo…
              </div>
            ) : null}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send("chat", input);
            }}
            className="mt-4 flex items-end gap-2 border-t border-border pt-4"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send("chat", input);
                }
              }}
              rows={2}
              placeholder="Ex.: quais estudos são exigidos para a LI deste empreendimento?"
              className="min-h-[52px] flex-1 resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-ring/25"
            />
            <Btn type="submit" disabled={busy || !input.trim()}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar
            </Btn>
          </form>
        </Panel>

        <div className="space-y-5">
          <Panel title="Contexto" description="Dados enviados ao assistente." delay={0.1}>
            <Choice
              label="Processo"
              value={processId}
              onChange={(e) => setProcessId(e.target.value)}
              options={[
                { value: "", label: "Sem contexto de processo" },
                ...(processes.data ?? []).map((p) => ({
                  value: p.id,
                  label: `${p.license_type} — ${clients.data?.find((c) => c.id === p.client_id)?.legal_name ?? "sem empreendimento"}`,
                })),
              ]}
            />
            <pre className="mt-3 max-h-52 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {context}
            </pre>
          </Panel>

          <Panel title="Ações rápidas" delay={0.15}>
            <div className="space-y-2">
              {QUICK.map((q) => (
                <Btn
                  key={q.task}
                  variant="outline"
                  className="w-full justify-start"
                  disabled={busy}
                  onClick={() => void send(q.task, q.prompt)}
                >
                  <Sparkles className="size-4 text-gold" /> {q.label}
                </Btn>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
