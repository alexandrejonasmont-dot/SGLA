const strip = (s: string) =>
  String(s ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 14);

const isShapeValid = (x: string) => x.length === 14 && /^[A-Z0-9]{12}[0-9]{2}$/.test(x);
const isNumeric = (x: string) => /^[0-9]{14}$/.test(x);

export type CnpjSource = "SERPRO" | "CONTINGENCIA_PUBLICA";

export interface CnpjResult {
  ok: boolean;
  source: CnpjSource | null;
  official: boolean;
  error: string | null;
  data: {
    cnpj: string;
    legal_name: string;
    trade_name: string;
    registration_status: string;
    cnae: string;
    cnae_desc: string;
    secondary_cnaes: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    zip_code: string;
    address: string;
    city: string;
    uf: string;
    contact_email: string;
    contact_phone: string;
  } | null;
}

function serproConfigured() {
  return Boolean(
    process.env["SERPRO_CONSUMER_KEY"] &&
      process.env["SERPRO_CONSUMER_SECRET"] &&
      process.env["SERPRO_CNPJ_URL_TEMPLATE"],
  );
}

async function withTimeout(url: string, init: RequestInit = {}, ms = 12000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function serproToken(): Promise<string | null> {
  const key = process.env["SERPRO_CONSUMER_KEY"]!;
  const secret = process.env["SERPRO_CONSUMER_SECRET"]!;
  const tokenUrl = process.env["SERPRO_TOKEN_URL"] ?? "https://gateway.apiserpro.serpro.gov.br/token";
  try {
    const res = await withTimeout(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${key}:${secret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

export async function lookupCnpj(input: string): Promise<CnpjResult> {
  const cnpj = strip(input);

  if (!isShapeValid(cnpj)) {
    return {
      ok: false,
      source: null,
      official: false,
      error: "CNPJ inválido. Informe 14 caracteres no padrão numérico ou alfanumérico vigente.",
      data: null,
    };
  }

  if (serproConfigured()) {
    const token = await serproToken();
    if (token) {
      const url = process.env["SERPRO_CNPJ_URL_TEMPLATE"]!.replace("{cnpj}", cnpj);
      try {
        const res = await withTimeout(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) {
          const raw = (await res.json()) as Record<string, unknown>;
          return { ok: true, source: "SERPRO", official: true, error: null, data: mapSerpro(raw, cnpj) };
        }
        if (res.status === 404) {
          return {
            ok: false,
            source: "SERPRO",
            official: true,
            error: "CNPJ não encontrado na base oficial.",
            data: null,
          };
        }
      } catch {
        /* cai para a contingência abaixo */
      }
    }
  }

  if (!isNumeric(cnpj)) {
    return {
      ok: false,
      source: null,
      official: false,
      error:
        "CNPJ alfanumérico exige a integração oficial SERPRO, que ainda não está configurada neste ambiente. Cadastre os dados manualmente ou configure as credenciais oficiais.",
      data: null,
    };
  }

  const providers: { name: string; url: string; map: (r: Record<string, unknown>) => CnpjResult["data"] }[] = [
    { name: "BrasilAPI", url: `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, map: (r) => mapPublic(r, cnpj) },
    { name: "MinhaReceita", url: `https://minhareceita.org/${cnpj}`, map: (r) => mapPublic(r, cnpj) },
    { name: "CNPJ.ws", url: `https://publica.cnpj.ws/cnpj/${cnpj}`, map: (r) => mapCnpjWs(r, cnpj) },
    { name: "ReceitaWS", url: `https://receitaws.com.br/v1/cnpj/${cnpj}`, map: (r) => mapReceitaWs(r, cnpj) },
  ];

  let notFound = false;

  for (const provider of providers) {
    try {
      const res = await withTimeout(provider.url, { headers: { Accept: "application/json" } });
      if (res.status === 404) {
        notFound = true;
        continue;
      }
      if (!res.ok) continue;
      const raw = (await res.json()) as Record<string, unknown>;
      if (str(raw["status"]).toUpperCase() === "ERROR") {
        notFound = true;
        continue;
      }
      const data = provider.map(raw);
      if (!data?.legal_name) continue;
      return { ok: true, source: "CONTINGENCIA_PUBLICA", official: false, error: null, data };
    } catch {
      /* tenta a próxima base */
    }
  }

  return {
    ok: false,
    source: "CONTINGENCIA_PUBLICA",
    official: false,
    error: notFound
      ? "CNPJ não localizado nas bases públicas de contingência."
      : "Nenhuma base pública de contingência respondeu no momento. Tente novamente em instantes ou cadastre manualmente.",
    data: null,
  };
}

function mapCnpjWs(raw: Record<string, unknown>, cnpj: string): CnpjResult["data"] {
  const est = (raw["estabelecimento"] ?? {}) as Record<string, unknown>;
  const cidade = (est["cidade"] ?? {}) as Record<string, unknown>;
  const estado = (est["estado"] ?? {}) as Record<string, unknown>;
  const atividade = (est["atividade_principal"] ?? {}) as Record<string, unknown>;
  const secundarias = (est["atividades_secundarias"] ?? []) as Array<Record<string, unknown>>;
  const street = [str(est["tipo_logradouro"]), str(est["logradouro"])].filter(Boolean).join(" ");
  const number = str(est["numero"]);
  const complement = str(est["complemento"]);
  const neighborhood = str(est["bairro"]);
  const zip_code = str(est["cep"]);
  const address = [street, number, complement, neighborhood, zip_code].filter(Boolean).join(", ");
  const secondary_cnaes = secundarias
    .map((a) => [str(a["subclasse"]).replace(/\D/g, ""), str(a["descricao"])].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("; ");
  return {
    cnpj,
    legal_name: str(raw["razao_social"]),
    trade_name: str(est["nome_fantasia"]),
    registration_status: str(est["situacao_cadastral"]).toUpperCase() || "NAO_INFORMADA",
    cnae: str(atividade["subclasse"]).replace(/\D/g, ""),
    cnae_desc: str(atividade["descricao"]),
    secondary_cnaes,
    street,
    number,
    complement,
    neighborhood,
    zip_code,
    address,
    city: str(cidade["nome"]),
    uf: str(estado["sigla"]),
    contact_email: str(est["email"]),
    contact_phone: [str(est["ddd1"]), str(est["telefone1"])].filter(Boolean).join(""),
  };
}

function mapReceitaWs(raw: Record<string, unknown>, cnpj: string): CnpjResult["data"] {
  const ativs = (raw["atividade_principal"] ?? []) as Array<Record<string, unknown>>;
  const secundarias = (raw["atividades_secundarias"] ?? []) as Array<Record<string, unknown>>;
  const principal = ativs[0] ?? {};
  const street = str(raw["logradouro"]);
  const number = str(raw["numero"]);
  const complement = str(raw["complemento"]);
  const neighborhood = str(raw["bairro"]);
  const zip_code = str(raw["cep"]);
  const address = [street, number, complement, neighborhood, zip_code].filter(Boolean).join(", ");
  const secondary_cnaes = secundarias
    .map((a) => [str(a["code"]).replace(/\D/g, ""), str(a["text"])].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("; ");
  return {
    cnpj,
    legal_name: str(raw["nome"]),
    trade_name: str(raw["fantasia"]),
    registration_status: str(raw["situacao"]).toUpperCase() || "NAO_INFORMADA",
    cnae: str(principal["code"]).replace(/\D/g, ""),
    cnae_desc: str(principal["text"]),
    secondary_cnaes,
    street,
    number,
    complement,
    neighborhood,
    zip_code,
    address,
    city: str(raw["municipio"]),
    uf: str(raw["uf"]),
    contact_email: str(raw["email"]),
    contact_phone: str(raw["telefone"]),
  };
}

const str = (v: unknown) => (v == null ? "" : String(v).trim());

function mapPublic(raw: Record<string, unknown>, cnpj: string): CnpjResult["data"] {
  const street = [str(raw["descricao_tipo_de_logradouro"]), str(raw["logradouro"])]
    .filter(Boolean)
    .join(" ");
  const number = str(raw["numero"]);
  const complement = str(raw["complemento"]);
  const neighborhood = str(raw["bairro"]);
  const zip_code = str(raw["cep"]);
  const address = [street, number, complement, neighborhood, zip_code].filter(Boolean).join(", ");
  const secundarias = (raw["cnaes_secundarios"] ?? raw["cnaes_secundarias"] ?? []) as Array<
    Record<string, unknown>
  >;
  const secondary_cnaes = secundarias
    .map((a) =>
      [str(a["codigo"] ?? a["code"] ?? a["cnae"]).replace(/\D/g, ""), str(a["descricao"] ?? a["text"])]
        .filter(Boolean)
        .join(" — "),
    )
    .filter(Boolean)
    .join("; ");
  return {
    cnpj,
    legal_name: str(raw["razao_social"]),
    trade_name: str(raw["nome_fantasia"]),
    registration_status: str(raw["descricao_situacao_cadastral"]).toUpperCase() || "NAO_INFORMADA",
    cnae: str(raw["cnae_fiscal"]),
    cnae_desc: str(raw["cnae_fiscal_descricao"]),
    secondary_cnaes,
    street,
    number,
    complement,
    neighborhood,
    zip_code,
    address,
    city: str(raw["municipio"]),
    uf: str(raw["uf"]),
    contact_email: str(raw["email"]),
    contact_phone: [str(raw["ddd_telefone_1"])].filter(Boolean).join(""),
  };
}

function mapSerpro(raw: Record<string, unknown>, cnpj: string): CnpjResult["data"] {
  const ns = (raw["nomeEmpresarial"] ?? raw["razaoSocial"]) as unknown;
  const end = (raw["endereco"] ?? {}) as Record<string, unknown>;
  const cnaePrincipal = (raw["cnaePrincipal"] ?? {}) as Record<string, unknown>;
  const sit = (raw["situacaoCadastral"] ?? {}) as Record<string, unknown>;
  const secundarias = (raw["cnaeSecundarias"] ?? raw["cnaesSecundarios"] ?? []) as Array<
    Record<string, unknown>
  >;
  const street = [str(end["tipoLogradouro"]), str(end["logradouro"])].filter(Boolean).join(" ");
  const number = str(end["numero"]);
  const complement = str(end["complemento"]);
  const neighborhood = str(end["bairro"]);
  const zip_code = str(end["cep"]);
  const address = [street, number, complement, neighborhood, zip_code].filter(Boolean).join(", ");
  const secondary_cnaes = secundarias
    .map((a) => [str(a["codigo"]).replace(/\D/g, ""), str(a["descricao"])].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("; ");
  return {
    cnpj,
    legal_name: str(ns),
    trade_name: str(raw["nomeFantasia"]),
    registration_status: (str(sit["descricao"]) || "NAO_INFORMADA").toUpperCase(),
    cnae: str(cnaePrincipal["codigo"]),
    cnae_desc: str(cnaePrincipal["descricao"]),
    secondary_cnaes,
    street,
    number,
    complement,
    neighborhood,
    zip_code,
    address,
    city: str(end["municipio"]),
    uf: str(end["uf"]),
    contact_email: "",
    contact_phone: "",
  };
}

export function integrationHealth() {
  return {
    checkedAt: new Date().toISOString(),
    serproConfigured: serproConfigured(),
    aiConfigured: Boolean(process.env["LOVABLE_API_KEY"]),
    databaseConfigured: Boolean(process.env["SUPABASE_URL"]),
  };
}
