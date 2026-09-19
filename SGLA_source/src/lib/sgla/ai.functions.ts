import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SGLA_SYSTEM_PROMPT, callGateway } from "./ai.server";

const schema = z.object({
  task: z.enum(["chat", "improve", "summary", "checklist", "review", "next_steps"]),
  prompt: z.string(),
  context: z.string().optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});

export const askEnvironmentalAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) {
      return {
        ok: false as const,
        error: "IA não configurada no ambiente. Configure a chave do gateway de IA.",
        text: "",
      };
    }

    const taskInstruction: Record<string, string> = {
      chat: "Responda a pergunta do usuário de forma técnica e objetiva.",
      improve:
        "Aprimore o documento a seguir mantendo a estrutura e o teor jurídico-técnico. Devolva APENAS o texto final do documento, sem comentários, sem markdown e sem cercas de código.",
      summary: "Produza um resumo executivo do processo apresentado, em tópicos curtos.",
      checklist:
        "Estruture um checklist documental objetivo para o caso apresentado, em itens com '[ ] '.",
      review:
        "Revise a consistência textual, ortográfica e técnica. Aponte inconsistências em lista e depois apresente a versão corrigida.",
      next_steps:
        "Liste os próximos passos operacionais recomendados, em ordem de prioridade, com responsável sugerido.",
    };

    const messages = [
      { role: "system" as const, content: SGLA_SYSTEM_PROMPT },
      ...(data.context
        ? [{ role: "system" as const, content: `CONTEXTO DO SGLA:\n${data.context}` }]
        : []),
      ...(data.history ?? []).slice(-10),
      {
        role: "user" as const,
        content: `${taskInstruction[data.task] ?? ""}\n\n${data.prompt}`,
      },
    ];

    return callGateway(apiKey, messages);
  });
