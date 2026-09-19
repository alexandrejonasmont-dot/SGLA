import { fmtDate, maskCnpj, todayISO } from "./format";
import type { Client, Process } from "./types";

export interface TemplateContext {
  client?: Client | null;
  process?: Process | null;
  author?: string;
  organization?: string;
}

export interface DocTemplate {
  key: string;
  name: string;
  description: string;
  build: (ctx: TemplateContext) => { title: string; content: string };
}

const dash = "—";

function addressLine(c?: Client | null) {
  if (!c) return dash;
  const structured = [c.street, c.number, c.complement, c.neighborhood, c.zip_code]
    .filter(Boolean)
    .join(", ");
  return structured || c.address || dash;
}

function head(ctx: TemplateContext) {
  const c = ctx.client;
  return [
    `IDENTIFICAÇÃO DO EMPREENDIMENTO`,
    `Razão social: ${c?.legal_name ?? dash}`,
    `Nome fantasia: ${c?.trade_name || dash}`,
    `CNPJ: ${c?.cnpj ? maskCnpj(c.cnpj) : dash}`,
    `CNAE principal: ${c?.cnae ?? dash}${c?.cnae_desc ? ` — ${c.cnae_desc}` : ""}`,
    `CNAEs secundários: ${c?.secondary_cnaes || dash}`,
    `Endereço: ${addressLine(c)}`,
    `Bairro: ${c?.neighborhood || dash}`,
    `CEP: ${c?.zip_code || dash}`,
    `Município/UF: ${[c?.city, c?.uf].filter(Boolean).join("/") || dash}`,
    `Área total: ${c?.total_area != null ? `${c.total_area} m²` : dash}`,
    `Área construída: ${c?.built_area != null ? `${c.built_area} m²` : dash}`,
    `Situação cadastral: ${c?.registration_status ?? dash}`,
    `Responsável legal: ${c?.contact_name || dash}`,
    `Telefone celular: ${c?.contact_mobile || dash}`,
    `E-mail: ${c?.contact_email || dash}`,
  ].join("\n");
}

function processBlock(ctx: TemplateContext) {
  const p = ctx.process;
  return [
    `DADOS DO PROCESSO`,
    `Protocolo: ${p?.protocol || "não protocolado"}`,
    `Tipo: ${p?.license_type ?? dash}`,
    `Órgão ambiental: ${p?.agency ?? dash}`,
    `Fase atual: ${p?.status ?? dash}`,
    `Responsável técnico: ${p?.owner_name || dash}`,
    `Data de abertura: ${fmtDate(p?.opened_at)}`,
    `Data de protocolo: ${fmtDate(p?.filed_at)}`,
    `Validade: ${fmtDate(p?.expires_at)}`,
  ].join("\n");
}

function signature(ctx: TemplateContext) {
  return [
    ``,
    `${ctx.client?.city || "Arapiraca"}/${ctx.client?.uf || "AL"}, ${fmtDate(todayISO())}.`,
    ``,
    `_______________________________________`,
    `${ctx.author || "Responsável Técnico"}`,
    `${ctx.organization || "Consultoria Ambiental"}`,
  ].join("\n");
}

export const TEMPLATES: DocTemplate[] = [
  {
    key: "requerimento",
    name: "Requerimento ambiental",
    description: "Solicitação formal de licença ou autorização ao órgão ambiental competente.",
    build: (ctx) => ({
      title: `Requerimento — ${ctx.process?.license_type ?? "Licenciamento Ambiental"}`,
      content: [
        `REQUERIMENTO DE LICENCIAMENTO AMBIENTAL`,
        ``,
        `Ao ${ctx.process?.agency ?? "Órgão Ambiental Competente"}`,
        ``,
        head(ctx),
        ``,
        processBlock(ctx),
        ``,
        `OBJETO DO REQUERIMENTO`,
        `O empreendimento acima identificado vem, respeitosamente, requerer a análise e a emissão de ${ctx.process?.license_type ?? "licença ambiental"}, para a atividade descrita em seu objeto social e enquadramento CNAE, comprometendo-se a apresentar toda a documentação técnica exigida e a cumprir integralmente as condicionantes que vierem a ser estabelecidas.`,
        ``,
        `DOCUMENTOS ANEXOS`,
        `1. Documentos societários e cadastrais do empreendimento.`,
        `2. Comprovante de endereço e situação do imóvel.`,
        `3. Memorial descritivo das atividades.`,
        `4. Plantas, croquis e demais peças técnicas aplicáveis.`,
        `5. Comprovante de recolhimento de taxas, quando aplicável.`,
        ``,
        `Nestes termos, pede deferimento.`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "oficio",
    name: "Ofício",
    description: "Comunicação formal com o órgão ambiental sobre o andamento do processo.",
    build: (ctx) => ({
      title: `Ofício — ${ctx.client?.trade_name || ctx.client?.legal_name || "Empreendimento"}`,
      content: [
        `OFÍCIO Nº ____/${new Date().getFullYear()}`,
        ``,
        `Ao ${ctx.process?.agency ?? "Órgão Ambiental Competente"}`,
        `Referência: processo ${ctx.process?.protocol || "em preparação documental"}`,
        ``,
        `Prezados Senhores,`,
        ``,
        `Em atenção ao processo administrativo em referência, relativo ao empreendimento ${ctx.client?.legal_name ?? dash}, CNPJ ${ctx.client?.cnpj ? maskCnpj(ctx.client.cnpj) : dash}, encaminhamos as informações e documentos abaixo relacionados para instrução e prosseguimento da análise técnica.`,
        ``,
        `1. ____________________________________________`,
        `2. ____________________________________________`,
        `3. ____________________________________________`,
        ``,
        `Colocamo-nos à disposição para os esclarecimentos que se fizerem necessários.`,
        ``,
        `Atenciosamente,`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "declaracao",
    name: "Declaração",
    description: "Declaração de responsabilidade sobre informações prestadas.",
    build: (ctx) => ({
      title: `Declaração — ${ctx.client?.legal_name ?? "Empreendimento"}`,
      content: [
        `DECLARAÇÃO`,
        ``,
        head(ctx),
        ``,
        `Declaramos, para os devidos fins e sob as penas da lei, que as informações e documentos apresentados no âmbito do processo de licenciamento ambiental ${ctx.process?.protocol || ""} são verdadeiros, completos e correspondem à realidade operacional do empreendimento na presente data.`,
        ``,
        `Declaramos ainda estar cientes de que a prestação de informação falsa sujeita o declarante às sanções administrativas, civis e penais cabíveis, bem como à invalidação do ato administrativo dela decorrente.`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "relatorio",
    name: "Relatório técnico",
    description: "Relatório técnico ambiental com metodologia, resultados e conclusões.",
    build: (ctx) => ({
      title: `Relatório técnico — ${ctx.client?.trade_name || ctx.client?.legal_name || "Empreendimento"}`,
      content: [
        `RELATÓRIO TÉCNICO AMBIENTAL`,
        ``,
        head(ctx),
        ``,
        processBlock(ctx),
        ``,
        `1. OBJETIVO`,
        `Descrever o objetivo do relatório e sua vinculação ao processo de licenciamento.`,
        ``,
        `2. METODOLOGIA`,
        `Descrever os métodos, normas técnicas, equipamentos e período de coleta utilizados.`,
        ``,
        `3. RESULTADOS`,
        `Apresentar os dados obtidos, com tabelas, parâmetros e comparativos com os limites legais aplicáveis.`,
        ``,
        `4. ANÁLISE E DISCUSSÃO`,
        `Interpretar os resultados frente às exigências do órgão ambiental.`,
        ``,
        `5. CONCLUSÕES E RECOMENDAÇÕES`,
        `Consolidar as conclusões técnicas e as medidas recomendadas.`,
        ``,
        `6. RESPONSABILIDADE TÉCNICA`,
        `Informar profissional responsável e respectiva ART/anotação de responsabilidade técnica.`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "memorial",
    name: "Memorial descritivo",
    description: "Descrição detalhada da atividade, processo produtivo e controles ambientais.",
    build: (ctx) => ({
      title: `Memorial descritivo — ${ctx.client?.legal_name ?? "Empreendimento"}`,
      content: [
        `MEMORIAL DESCRITIVO DA ATIVIDADE`,
        ``,
        head(ctx),
        ``,
        `1. DESCRIÇÃO DA ATIVIDADE`,
        `Descrever a atividade principal e as atividades secundárias efetivamente exercidas.`,
        ``,
        `2. PROCESSO PRODUTIVO`,
        `Descrever as etapas do processo, insumos, matérias-primas e produtos.`,
        ``,
        `3. INFRAESTRUTURA`,
        `Área total, área construída, layout, utilidades e capacidade instalada.`,
        ``,
        `4. RECURSOS HÍDRICOS E EFLUENTES`,
        `Origem da água, consumo, geração e destinação de efluentes líquidos.`,
        ``,
        `5. RESÍDUOS SÓLIDOS`,
        `Tipologia, classificação, armazenamento temporário e destinação final licenciada.`,
        ``,
        `6. EMISSÕES ATMOSFÉRICAS E RUÍDO`,
        `Fontes, sistemas de controle e medidas mitigadoras.`,
        ``,
        `7. MEDIDAS DE CONTROLE AMBIENTAL`,
        `Programas de monitoramento, planos de contingência e manutenção preventiva.`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "resposta_condicionante",
    name: "Resposta a condicionante",
    description: "Comprovação de cumprimento de condicionante da licença ambiental.",
    build: (ctx) => ({
      title: `Resposta a condicionante — ${ctx.process?.protocol || "processo"}`,
      content: [
        `RESPOSTA A CONDICIONANTE AMBIENTAL`,
        ``,
        `Ao ${ctx.process?.agency ?? "Órgão Ambiental Competente"}`,
        `Referência: processo ${ctx.process?.protocol || dash}`,
        ``,
        head(ctx),
        ``,
        `CONDICIONANTE ATENDIDA`,
        `Item: ____________________________________________`,
        `Texto da condicionante: ____________________________________________`,
        `Prazo estabelecido: ____________________________________________`,
        ``,
        `PROVIDÊNCIAS ADOTADAS`,
        `Descrever objetivamente as ações executadas, datas e responsáveis.`,
        ``,
        `EVIDÊNCIAS APRESENTADAS`,
        `Relacionar laudos, notas fiscais, registros fotográficos, certificados e demais comprovantes anexos.`,
        ``,
        `CONCLUSÃO`,
        `Diante do exposto, considera-se atendida a condicionante em referência, permanecendo o empreendimento à disposição para verificação in loco.`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "checklist",
    name: "Checklist documental",
    description: "Lista de verificação dos documentos exigidos para o protocolo.",
    build: (ctx) => ({
      title: `Checklist documental — ${ctx.process?.license_type ?? "Licenciamento"}`,
      content: [
        `CHECKLIST DOCUMENTAL`,
        ``,
        head(ctx),
        ``,
        processBlock(ctx),
        ``,
        `[ ] Requerimento assinado pelo representante legal`,
        `[ ] Contrato social / última alteração consolidada`,
        `[ ] Cartão CNPJ atualizado`,
        `[ ] Documento de identificação do representante legal`,
        `[ ] Comprovante de propriedade ou posse do imóvel`,
        `[ ] Certidão de uso e ocupação do solo`,
        `[ ] Memorial descritivo da atividade`,
        `[ ] Planta de situação e layout`,
        `[ ] Projeto do sistema de tratamento de efluentes`,
        `[ ] Plano de gerenciamento de resíduos sólidos`,
        `[ ] Comprovantes de destinação final de resíduos`,
        `[ ] Outorga ou dispensa de uso de recursos hídricos`,
        `[ ] ART/RRT do responsável técnico`,
        `[ ] Comprovante de recolhimento de taxas`,
        `[ ] Publicação de pedido de licença, quando exigida`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "capa_documental",
    name: "Capa documental",
    description: "Capa de apresentação dos documentos ambientais do empreendimento.",
    build: (ctx) => ({
      title: `Capa documental — ${ctx.client?.legal_name ?? "Empreendimento"}`,
      content: [
        `DOCUMENTAÇÃO AMBIENTAL`,
        ``,
        `${ctx.client?.legal_name ?? dash}`,
        `${ctx.client?.cnpj ? maskCnpj(ctx.client.cnpj) : ""}`,
        ``,
        head(ctx),
        ``,
        processBlock(ctx),
        ``,
        `CONTEÚDO DOCUMENTAL`,
        `1. Documentos cadastrais`,
        `2. Peças técnicas`,
        `3. Licenças e autorizações`,
        `4. Condicionantes e comprovações`,
        `5. Comunicações com o órgão ambiental`,
        ``,
        `Documento elaborado por ${ctx.organization || "Consultoria Ambiental"}.`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "declaracao_cnae",
    name: "Declaração de CNAE em atividade",
    description:
      "Declara o CNAE principal e os secundários ativos no CNPJ do empreendimento. Preenchimento automático a partir do cadastro.",
    build: (ctx) => {
      const c = ctx.client;
      return {
        title: `Declaração de CNAE — ${c?.legal_name ?? "Empreendimento"}`,
        content: [
          `DECLARAÇÃO DO CNAE E ATIVIDADE ECONÔMICA ATIVA NO CADASTRO NACIONAL DE PESSOA JURÍDICA – CNPJ`,
          ``,
          `Venho por meio deste documento DECLARAR e descrever o código (CNAE) constante no Cadastro Nacional de Pessoa Jurídica – CNPJ do empreendimento ${c?.legal_name ?? dash}, inscrito no CNPJ nº ${c?.cnpj ? maskCnpj(c.cnpj) : dash}, localizado em ${addressLine(c)}, ${[c?.city, c?.uf].filter(Boolean).join("/") || dash}.`,
          ``,
          `Apresentam-se abaixo os códigos das atividades econômicas em atividade no empreendimento:`,
          ``,
          `PRINCIPAL:`,
          `${c?.cnae ?? dash}${c?.cnae_desc ? ` — ${c.cnae_desc}` : ""}`,
          ``,
          `SECUNDÁRIOS:`,
          `${c?.secondary_cnaes || "Não informados no cadastro do SGLA — completar após validação humana."}`,
          ``,
          `Declaro que as informações acima correspondem à realidade cadastral e operacional do empreendimento na presente data, sujeitando-me às sanções cabíveis em caso de inconsistência.`,
          ``,
          `Observação: este documento é uma orientação preliminar gerada pelo SGLA. Validação obrigatória pelo responsável técnico e pelo representante legal antes do protocolo.`,
          signature(ctx),
        ].join("\n"),
      };
    },
  },
  {
    key: "uso_ocupacao_solo",
    name: "Declaração de uso e ocupação do solo",
    description:
      "Declara área total, área construída e uso pretendido do imóvel. Dados físicos preenchidos a partir do cadastro.",
    build: (ctx) => {
      const c = ctx.client;
      return {
        title: `Uso e ocupação do solo — ${c?.legal_name ?? "Empreendimento"}`,
        content: [
          `DECLARAÇÃO DE USO E OCUPAÇÃO DO SOLO`,
          ``,
          `Declaro, para os devidos fins, que o imóvel situado em ${addressLine(c)}, bairro ${c?.neighborhood || dash}, CEP ${c?.zip_code || dash}, ${[c?.city, c?.uf].filter(Boolean).join("/") || dash}, de propriedade ou posse vinculada ao empreendimento ${c?.legal_name ?? dash}, CNPJ ${c?.cnpj ? maskCnpj(c.cnpj) : dash}, pretende utilizar:`,
          ``,
          `Área total do terreno: ${c?.total_area != null ? `${c.total_area} m²` : "[informar área total em m²]"}`,
          `Área construída: ${c?.built_area != null ? `${c.built_area} m²` : "[informar área construída em m²]"}`,
          ``,
          `Atividade econômica principal (CNAE): ${c?.cnae ?? dash}${c?.cnae_desc ? ` — ${c.cnae_desc}` : ""}`,
          ``,
          `Diante do exposto, solicita-se a este órgão a regularização / emissão do documento de uso e ocupação do solo, para instrução do processo de licenciamento ambiental.`,
          ``,
          `Coordenadas geográficas (quando disponíveis): lat ${c?.latitude ?? dash}, long ${c?.longitude ?? dash}`,
          `Link de localização: ${c?.map_url || dash}`,
          ``,
          `Observação: documento orientativo gerado pelo SGLA. Conferir medidas, matrícula e zoneamento junto ao órgão municipal competente.`,
          signature(ctx),
        ].join("\n"),
      };
    },
  },
  {
    key: "justificativa_nao_aplica",
    name: "Justificativa de documento não aplicável",
    description:
      "Modelo para justificar itens do checklist marcados como “Não se aplica”, exigindo fundamentação técnica.",
    build: (ctx) => ({
      title: `Justificativa — documento não aplicável`,
      content: [
        `A`,
        `${ctx.process?.agency ?? "Órgão Ambiental Competente"}`,
        ``,
        `Assunto: Apresentar justificativas em relação aos documentos não aplicáveis ao processo`,
        ``,
        `Cumprimentando-os cordialmente, o requerente ${ctx.client?.legal_name ?? dash}, com CNAE principal ${ctx.client?.cnae ?? dash}${ctx.client?.cnae_desc ? ` — ${ctx.client.cnae_desc}` : ""}, endereço ${addressLine(ctx.client)}, ${[ctx.client?.city, ctx.client?.uf].filter(Boolean).join("/") || dash}, CNPJ ${ctx.client?.cnpj ? maskCnpj(ctx.client.cnpj) : dash}, já devidamente qualificado nos autos, vem por meio deste DECLARAR, com as devidas justificativas, que o(s) documento(s) abaixo relacionado(s), previsto(s) no checklist da atividade ou empreendimento, não se aplica(m):`,
        ``,
        `TIPO DE DOCUMENTO: [especificar — ex.: Outorga de captação / ASV / IPHAN / MTR / monitoramento de ETE]`,
        `DESCRIÇÃO DA EXIGÊNCIA: [colar o texto do checklist]`,
        `JUSTIFICATIVA TÉCNICA:`,
        `[Explicar de forma objetiva por que o documento não se aplica à realidade do empreendimento — local, atividade, porte, ausência de captação, ausência de supressão etc.]`,
        ``,
        `Compromete-se o requerente a apresentar o referido documento caso, em vistoria ou análise técnica, o órgão competente identifique a necessidade.`,
        ``,
        `Processo / protocolo: ${ctx.process?.protocol || "em preparação"}`,
        `Tipo de licença: ${ctx.process?.license_type ?? dash}`,
        ``,
        `Observação: modelo orientativo do SGLA. A justificativa deve ser revisada e assinada pelo responsável técnico antes do protocolo.`,
        signature(ctx),
      ].join("\n"),
    }),
  },
  {
    key: "procuracao",
    name: "Procuração (representação no órgão ambiental)",
    description:
      "Modelo de procuração para representação do empreendedor junto ao órgão ambiental. Exige revisão e firma reconhecida quando aplicável.",
    build: (ctx) => {
      const c = ctx.client;
      return {
        title: `Procuração — ${c?.legal_name ?? "Empreendimento"}`,
        content: [
          `PROCURAÇÃO`,
          ``,
          `OUTORGANTE: ${c?.legal_name ?? dash}, inscrito no CNPJ nº ${c?.cnpj ? maskCnpj(c.cnpj) : dash}, com sede em ${addressLine(c)}, ${[c?.city, c?.uf].filter(Boolean).join("/") || dash}, neste ato representado por seu responsável legal ${c?.contact_name || "[nome do representante legal]"},`,
          ``,
          `OUTORGADO: [nome completo do procurador / consultor], [CPF/CNPJ], [qualificação profissional],`,
          ``,
          `Pelo presente instrumento, o OUTORGANTE nomeia e constitui seu bastante procurador o OUTORGADO, a quem confere poderes para:`,
          ``,
          `1. Representá-lo junto ao(s) órgão(s) ambiental(is) competente(s), em especial ${ctx.process?.agency ?? "IMA/AL, SMDUMA/Arapiraca e demais órgãos aplicáveis"};`,
          `2. Protocolar requerimentos, documentos, planos e projetos relacionados ao licenciamento ambiental;`,
          `3. Receber intimações, exigências e comunicações;`,
          `4. Prestação de esclarecimentos técnicos e administrativos;`,
          `5. Acompanhar vistorias e diligências;`,
          `6. Praticar todos os atos necessários ao bom e fiel cumprimento deste mandato, no interesse do processo de ${ctx.process?.license_type ?? "licenciamento ambiental"}.`,
          ``,
          `Este mandato não inclui poderes para confessar, transigir ou receber valores em nome do outorgante, salvo autorização expressa em aditivo.`,
          ``,
          `Observação: modelo orientativo. Verificar exigências locais de firma reconhecida, procuração pública e documentos de identificação anexos.`,
          signature(ctx),
        ].join("\n"),
      };
    },
  },
  {
    key: "termo_ciencia",
    name: "Termo de ciência e concordância",
    description:
      "Termo de ciência das regras processuais do órgão (documentação incompleta, exigências, comunicações por e-mail/WhatsApp).",
    build: (ctx) => {
      const c = ctx.client;
      return {
        title: `Termo de ciência — ${c?.legal_name ?? "Empreendimento"}`,
        content: [
          `TERMO DE CIÊNCIA E CONCORDÂNCIA`,
          ``,
          `Órgão de referência: ${ctx.process?.agency ?? "Órgão Ambiental Competente"}`,
          ``,
          `Por meio deste instrumento, ${c?.contact_name || "[nome do declarante]"}, representante legal / responsável pelo empreendimento ${c?.legal_name ?? dash}, CNPJ ${c?.cnpj ? maskCnpj(c.cnpj) : dash}, declara estar ciente e concordar com o inteiro teor das seguintes orientações processuais:`,
          ``,
          `1. Em caso de documentação incompleta, o status do processo é considerado pendente por parte do interessado;`,
          `2. Poderão ser solicitados esclarecimentos e complementações em relação aos documentos, projetos e avaliações apresentados, podendo a exigência ser reiterada se as respostas não forem satisfatórias;`,
          `3. O interessado receberá informações, comunicações, intimações e outras solicitações por meio do e-mail e/ou telefone informados no protocolo;`,
          `4. É de responsabilidade do interessado manter atualizados os dados de contato e acompanhar o andamento do processo.`,
          ``,
          `Contato para comunicações:`,
          `E-mail: ${c?.contact_email || dash}`,
          `Telefone celular: ${c?.contact_mobile || dash}`,
          `Telefone fixo: ${c?.contact_phone || dash}`,
          ``,
          `Por fim, declara que concorda e aceita o teor deste Termo.`,
          ``,
          `Observação: modelo orientativo do SGLA. Adequar ao texto oficial do órgão quando houver formulário próprio.`,
          signature(ctx),
        ].join("\n"),
      };
    },
  },
  {
    key: "publicacao",
    name: "Minuta de publicação (pedido de licença)",
    description:
      "Texto-base para publicação de pedido de licença / renovação / regularização, no padrão usado em Arapiraca/AL.",
    build: (ctx) => {
      const c = ctx.client;
      const tipo = ctx.process?.license_type ?? "Licença Ambiental";
      return {
        title: `Publicação — ${c?.legal_name ?? "Empreendimento"}`,
        content: [
          `MINUTA DE PUBLICAÇÃO`,
          ``,
          `${c?.legal_name ?? "[NOME DA EMPRESA]"}, CNPJ ${c?.cnpj ? maskCnpj(c.cnpj) : "[CNPJ]"}, endereço ${addressLine(c)}${c?.neighborhood ? `, bairro ${c.neighborhood}` : ""}${c?.zip_code ? `, CEP ${c.zip_code}` : ""}, torna público que requereu junto a ${ctx.process?.agency ?? "Secretaria Municipal de Desenvolvimento Urbano e Meio Ambiente – SMDUMA"} a ${tipo} para a atividade econômica principal ${c?.cnae ?? "[CNAE]"}${c?.cnae_desc ? ` — ${c.cnae_desc}` : ""} no município de ${c?.city || "Arapiraca"} – ${c?.uf || "AL"}.`,
          ``,
          `Protocolo: ${ctx.process?.protocol || "[a preencher após protocolo]"}`,
          ``,
          `Observação: texto orientativo gerado pelo SGLA. Confirmar redação exigida pelo órgão e veículo oficial de publicação antes da divulgação.`,
        ].join("\n"),
      };
    },
  },
  {
    key: "requerimento_municipal",
    name: "Requerimento municipal (SMDUMA / comércio e serviços)",
    description:
      "Requerimento orientativo para órgãos municipais (ex.: SMDUMA Arapiraca), com identificação e objeto do pedido.",
    build: (ctx) => {
      const c = ctx.client;
      return {
        title: `Requerimento municipal — ${ctx.process?.license_type ?? "Licenciamento"}`,
        content: [
          `REQUERIMENTO`,
          ``,
          `Ao ${ctx.process?.agency ?? "Órgão Municipal de Meio Ambiente"}`,
          ``,
          head(ctx),
          ``,
          processBlock(ctx),
          ``,
          `OBJETO`,
          `O empreendimento acima identificado requer a análise e deliberação quanto a ${ctx.process?.license_type ?? "licença / autorização ambiental"}, comprometendo-se a apresentar a documentação técnica exigida e a cumprir as condicionantes que forem estabelecidas.`,
          ``,
          `DOCUMENTOS QUE INSTRUEM O PEDIDO (indicar os anexos reais):`,
          `1. ________________________________`,
          `2. ________________________________`,
          `3. ________________________________`,
          ``,
          `Nestes termos, pede deferimento.`,
          ``,
          `Observação: modelo orientativo. Não substitui formulário oficial do órgão, quando existente.`,
          signature(ctx),
        ].join("\n"),
      };
    },
  },
  {
    key: "defesa_administrativa",
    name: "Estrutura de defesa administrativa",
    description:
      "Estrutura-base de defesa em auto de infração ambiental. Conteúdo jurídico deve ser revisado caso a caso — não é parecer jurídico automático.",
    build: (ctx) => {
      const c = ctx.client;
      return {
        title: `Defesa administrativa — ${c?.legal_name ?? "Empreendimento"}`,
        content: [
          `DEFESA ADMINISTRATIVA – AUTO DE INFRAÇÃO AMBIENTAL`,
          ``,
          `Autuado(a): ${c?.legal_name ?? dash}`,
          `CNPJ: ${c?.cnpj ? maskCnpj(c.cnpj) : dash}`,
          `Endereço: ${addressLine(c)}, ${[c?.city, c?.uf].filter(Boolean).join("/") || dash}`,
          ``,
          `À ${ctx.process?.agency ?? "Autoridade Ambiental Competente"},`,
          ``,
          `O empreendimento acima identificado vem, respeitosamente, apresentar DEFESA ADMINISTRATIVA em face do Auto de Infração Ambiental lavrado, pelos fatos e fundamentos a seguir expostos.`,
          ``,
          `I – DOS FATOS`,
          `[Descrever data da fiscalização, teor do auto, valor da multa e irregularidade apontada.]`,
          ``,
          `II – DO DIREITO`,
          `[Fundamentar boa-fé, medidas de regularização já adotadas, eventual desproporcionalidade e dispositivos legais aplicáveis — revisão humana obrigatória.]`,
          ``,
          `III – DAS PROVIDÊNCIAS DE REGULARIZAÇÃO`,
          `Informar contratação de consultoria / responsável técnico, fase do processo de licenciamento no SGLA e documentação em elaboração.`,
          ``,
          `IV – DOS PEDIDOS`,
          `a) concessão de prazo para conclusão da regularização;`,
          `b) redução ou substituição da penalidade, se cabível;`,
          `c) demais requerimentos pertinentes.`,
          ``,
          `ATENÇÃO: este texto é apenas uma estrutura orientativa gerada pelo SGLA. Não constitui aconselhamento jurídico nem substitui análise de advogado ou responsável técnico.`,
          signature(ctx),
        ].join("\n"),
      };
    },
  },
];

export const templateByKey = (key: string) => TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0]!;
