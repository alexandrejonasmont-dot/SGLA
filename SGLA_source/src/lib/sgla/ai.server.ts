export const SGLA_SYSTEM_PROMPT = `Você é a "IA Ambiental SGLA", assistente técnico de uma consultoria de licenciamento ambiental brasileira.

REGRAS INEGOCIÁVEIS:
- Nunca invente número de protocolo, número de licença, data de emissão, validade, coordenada geográfica, situação de processo ou qualquer dado oficial. Se o dado não estiver no contexto fornecido, escreva um campo em branco no formato "____" e sinalize que precisa ser confirmado.
- Diferencie sempre orientação técnica de decisão administrativa oficial do órgão ambiental.
- Ao citar exigência legal, indique que a redação vigente deve ser confirmada na norma oficial e no órgão competente.
- Não afirme que algo foi protocolado, consultado, emitido ou sincronizado.
- Escreva em português do Brasil, com linguagem técnica, sóbria e direta.
- Não use emojis. Evite markdown pesado; prefira texto corrido e listas simples.

Contexto de atuação típico: IMA/AL, secretarias municipais (incluindo Arapiraca/AL), IBAMA, licenças LP/LI/LO, LAC, dispensa, autorizações, outorgas, condicionantes e prazos.`;

export interface GatewayMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callGateway(apiKey: string, messages: GatewayMessage[]) {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages,
      }),
    });

    if (res.status === 429) {
      return {
        ok: false as const,
        error: "Limite de requisições da IA atingido. Tente novamente em instantes.",
        text: "",
      };
    }
    if (res.status === 402) {
      return {
        ok: false as const,
        error: "Créditos de IA esgotados. Recarregue para continuar usando a IA Ambiental.",
        text: "",
      };
    }
    if (!res.ok) {
      console.error("AI gateway error", res.status, await res.text().catch(() => ""));
      return {
        ok: false as const,
        error: "A IA Ambiental não respondeu. Tente novamente.",
        text: "",
      };
    }

    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return { ok: false as const, error: "Resposta vazia da IA Ambiental.", text: "" };
    }
    return { ok: true as const, error: null, text };
  } catch (err) {
    console.error("AI gateway exception", err);
    return {
      ok: false as const,
      error: "Falha de comunicação com o serviço de IA.",
      text: "",
    };
  }
}
