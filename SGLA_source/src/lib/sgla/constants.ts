export const LICENSE_TYPES = [
  "Licença Prévia (LP)",
  "Licença de Instalação (LI)",
  "Licença de Operação (LO)",
  "Licença Ambiental Única (LAU)",
  "Licença por Adesão e Compromisso (LAC)",
  "Renovação de Licença",
  "Dispensa de Licenciamento",
  "Autorização Ambiental",
  "Autorização de Supressão Vegetal",
  "Outorga de Uso de Recursos Hídricos",
  "Cadastro Técnico Federal (CTF/IBAMA)",
  "Alvará de Bombeiro",
  "Alvará de Funcionamento",
  "Uso e Ocupação do Solo",
  "Alvará de Construção",
  "Alvará Sanitário",
  "Outro",
] as const;

export const PROCESS_STATUS = [
  "Preparação documental",
  "Protocolado",
  "Finalizado",
  "Em análise",
  "Exigência técnica",
  "Aguardando vistoria",
  "Deferido",
  "Indeferido",
  "Arquivado",
] as const;

export const PRIORITIES = ["Baixa", "Normal", "Alta", "Crítica"] as const;

export const AGENCIES = [
  "IMA/AL — Instituto do Meio Ambiente de Alagoas",
  "SMDUMA — Arapiraca/AL",
  "SEMARH/AL",
  "IBAMA",
  "ANA",
  "Prefeitura Municipal",
  "Outro órgão",
] as const;

export const REGISTRATION_STATUS = [
  "ATIVA",
  "SUSPENSA",
  "INAPTA",
  "BAIXADA",
  "NULA",
  "NAO_INFORMADA",
] as const;

export const DOC_STATUS = ["Rascunho", "Em revisão", "Aprovado", "Protocolado"] as const;

export const DOCUMENT_TYPES = [
  "Requerimento",
  "Contrato social",
  "Cartão CNPJ",
  "Documento do responsável legal",
  "Comprovante de propriedade ou posse",
  "Alvará de Bombeiro",
  "Alvará de Funcionamento",
  "Uso e Ocupação do Solo",
  "Alvará de Construção",
  "Alvará Sanitário",
  "Licença ambiental",
  "ART/RRT",
  "Laudo ou relatório técnico",
  "Outro",
] as const;

export const CHECKLIST_STATUS = ["Pendente", "Concluído"] as const;

export const PROPOSAL_STATUS = ["Não enviada", "Enviada", "Aceita"] as const;

export type IntegrationStatus = "operacional" | "contingencia" | "nao_configurado" | "externo";

export interface IntegrationCard {
  key: string;
  name: string;
  description: string;
  category: string;
  portal?: string;
}

export const INTEGRATIONS: IntegrationCard[] = [
  {
    key: "cnpj",
    name: "Receita Federal / SERPRO — Consulta CNPJ",
    description:
      "Consulta cadastral por CNPJ executada no backend. Integração oficial SERPRO quando as credenciais estão configuradas; contingência pública não oficial apenas para CNPJ numérico.",
    category: "Cadastro",
    portal: "https://servicos.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp",
  },
  {
    key: "ai",
    name: "IA Ambiental SGLA",
    description:
      "Assistente contextual executado exclusivamente no backend. Nenhuma chave de API é exposta ao navegador.",
    category: "Inteligência",
  },
  {
    key: "db",
    name: "Banco de dados multiusuário",
    description:
      "Persistência em nuvem com autenticação, isolamento por usuário (RLS) e trilha de atualização.",
    category: "Infraestrutura",
  },
  {
    key: "ima",
    name: "Portal IMA+ (Alagoas)",
    description:
      "Não há API pública contratada. O fluxo é externo: protocolo e acompanhamento acontecem no portal oficial e o resultado é registrado manualmente no SGLA.",
    category: "Órgão ambiental",
    portal: "https://www.ima.al.gov.br/",
  },
  {
    key: "arapiraca",
    name: "Meio Ambiente — Arapiraca/AL",
    description:
      "Serviços municipais sem API oficial disponível. Conector futuro mediante contrato e documentação.",
    category: "Órgão ambiental",
    portal: "https://arapiraca.al.gov.br/",
  },
  {
    key: "ibama",
    name: "IBAMA — CTF e serviços federais",
    description:
      "Acesso via portal oficial com autenticação gov.br. Conector futuro mediante credenciais e documentação oficial.",
    category: "Órgão ambiental",
    portal: "https://www.gov.br/ibama/pt-br",
  },
];

export const STATUS_LABEL: Record<IntegrationStatus, string> = {
  operacional: "Operacional",
  contingencia: "Modo de contingência",
  nao_configurado: "Não configurado",
  externo: "Fluxo externo / portal oficial",
};

export const CONDITION_STATUS = [
  "Pendente",
  "Em andamento",
  "Concluída",
  "Vencida",
  "Dispensada",
] as const;
