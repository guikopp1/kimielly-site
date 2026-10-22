/**
 * ============================================================================
 *  ARQUIVO CENTRAL DE CONFIGURAÇÃO — edite aqui sem mexer no restante do código
 * ============================================================================
 *
 *  Regras deste arquivo:
 *  - `null` significa "ainda não confirmado pela profissional". O site esconde a
 *    informação (ou mostra um bloco "A preencher", se `mostrarPendencias` = true).
 *  - Fonte de cada dado confirmado está anotada ao lado (Instagram / bio.site,
 *    consultados em 21/10/2026).
 *  - Depois de alterar serviços, rode `npm run sync:services` para atualizar o
 *    banco de agendamentos (ver README).
 *
 *  Este arquivo usa apenas TypeScript "apagável" (sem enums, sem imports) para
 *  poder ser lido também pelo script de sincronização.
 */

export type CategoriaId =
  | "maquiagem"
  | "sobrancelhas"
  | "olhar"
  | "labios"
  | "facial"
  | "corporal";

export type Servico = {
  /** Identificador estável (usado no banco e na URL). Não altere depois de publicado. */
  id: string;
  nome: string;
  categoria: CategoriaId;
  descricao: string;
  /** Foto real em /public/images/servicos/. `null` = mostra moldura "foto a adicionar". */
  foto: string | null;
  /** Preço em reais. `null` = "Consulte valores". */
  preco: number | null;
  /** Texto exibido antes do preço, ex.: "a partir de". */
  precoPrefixo?: string;
  /**
   * Duração usada pela AGENDA para calcular horários livres (minutos).
   * Só é exibida no site quando `duracaoConfirmada` = true.
   */
  duracaoMinutos: number;
  duracaoConfirmada: boolean;
  /** Intervalo de preparo/limpeza após o atendimento (minutos). */
  intervaloAposMinutos: number;
  /** Aparece no agendamento online. */
  agendavel: boolean;
  /** Destaque na página inicial. */
  destaque: boolean;
};

export type FotoPortfolio = {
  /** Caminho em /public, ex.: "/images/portfolio/make-social-01.jpg". `null` = espaço reservado. */
  src: string | null;
  alt: string;
  categoria: CategoriaId;
  legenda?: string;
  /** Proporção original da foto (largura/altura). Retrato do Instagram = 4/5. */
  proporcao?: number;
  /** Confirme que a cliente autorizou a publicação antes de marcar `true`. */
  autorizada: boolean;
};

export const site = {
  /** Mostra blocos tracejados "A preencher" onde faltam dados. Use `false` ao publicar. */
  mostrarPendencias: true,

  profissional: {
    nome: "Kimiélly Wegner", // Instagram
    nomeCompleto: "Kimielly Yasmin Wegner", // bio.site
    assinatura: "Maquiagem & Estética", // bio.site / logotipo
    area: "Estética, cosmetologia e maquiagem",
    /** Frase publicada por ela no bio.site. */
    frase: "Realçando sua beleza natural com amor.",
    /** Apresentação curta — escrita a partir do que está publicado. Revise à vontade. */
    apresentacao:
      "Sou a Kimiélly, esteticista, cosmetóloga e maquiadora em Vera Cruz. Cuido de cada atendimento com calma, carinho e profissionalismo, para realçar a sua beleza natural.",
    /** História pessoal (página Sobre). `null` = a preencher. */
    historia: null as string | null,
    /** Formação e certificações. Inclua somente o que puder ser comprovado. */
    formacao: [] as { titulo: string; instituicao: string; ano?: string }[],
    /** Foto profissional em /public/images/sobre/. `null` = a adicionar. */
    foto: null as string | null,
    /** Fotos do espaço de atendimento. */
    fotosEspaco: [] as { src: string; alt: string }[],
    /** Logotipo original (opcional). Se `null`, o site usa o monograma tipográfico. */
    logo: null as string | null,
  },

  contato: {
    /** Somente dígitos, com DDI 55 + DDD. Fonte: bio.site (wa.me/5551984601929). */
    whatsapp: "5551984601929",
    whatsappExibicao: "(51) 98460-1929",
    instagram: {
      usuario: "kimielly.maquiadora_estetica",
      url: "https://www.instagram.com/kimielly.maquiadora_estetica/",
    },
    email: null as string | null,
  },

  endereco: {
    cidade: "Vera Cruz", // Instagram
    uf: "RS",
    /** Rua, número e complemento. `null` enquanto não confirmado. */
    logradouro: null as string | null,
    bairro: null as string | null,
    cep: null as string | null,
    /** Nome do espaço onde atende, se houver. */
    espaco: null as string | null,
    /**
     * Link "Como chegar" (Google Maps). Se `null`, é gerado a partir do endereço.
     * Dica: no Google Maps → Compartilhar → Copiar link.
     */
    linkMapa: null as string | null,
  },

  atendimento: {
    /** Confirmado no Instagram. */
    resumo: "Atendimento com horário marcado",
    /**
     * Horários exibidos no rodapé. Mantenha igual à tabela `business_hours` do banco.
     * Lista vazia = o site não exibe horários (apenas o resumo acima).
     */
    horarios: [] as { dias: string; horas: string }[],
    /** Se `true`, a reserva fica "Aguardando confirmação" até a profissional confirmar. */
    exigeConfirmacao: true,
  },

  categorias: {
    maquiagem: "Maquiagem",
    sobrancelhas: "Sobrancelhas",
    olhar: "Cílios",
    labios: "Lábios",
    facial: "Estética facial",
    corporal: "Estética corporal",
  } as Record<CategoriaId, string>,

  /**
   * SERVIÇOS — todos divulgados no Instagram (destaques) ou no bio.site.
   * Durações abaixo são PROVISÓRIAS (só para a agenda) até a profissional confirmar.
   */
  servicos: [
    {
      id: "maquiagem",
      nome: "Maquiagem",
      categoria: "maquiagem",
      descricao:
        "Produções para eventos, festas e ocasiões especiais — da make leve e iluminada ao acabamento mais marcante.",
      foto: null,
      preco: null,
      duracaoMinutos: 60,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: true,
    },
    {
      id: "design-sobrancelhas",
      nome: "Design de sobrancelhas",
      categoria: "sobrancelhas",
      descricao:
        "Desenho personalizado, respeitando o formato natural das sobrancelhas e a harmonia do rosto.",
      foto: null,
      preco: null,
      duracaoMinutos: 45,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: true,
    },
    {
      id: "brow-lamination",
      nome: "Brow lamination",
      categoria: "sobrancelhas",
      descricao:
        "Alinha e direciona os fios das sobrancelhas, deixando-as com aspecto mais cheio e penteado.",
      foto: null,
      preco: null,
      duracaoMinutos: 60,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: false,
    },
    {
      id: "cilios",
      nome: "Cílios",
      categoria: "olhar",
      descricao:
        "Procedimentos para valorizar o olhar. Confirme pelo WhatsApp a técnica indicada para você.",
      foto: null,
      preco: null,
      duracaoMinutos: 90,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: true,
    },
    {
      id: "lash-lifting",
      nome: "Lash lifting",
      categoria: "olhar",
      descricao:
        "Curvatura dos cílios naturais desde a raiz, para um olhar mais aberto sem uso de extensões.",
      foto: null,
      preco: null,
      duracaoMinutos: 60,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: false,
    },
    {
      id: "hidragloss",
      nome: "Hidragloss",
      categoria: "labios",
      descricao: "Hidratação labial que devolve maciez, cor e brilho aos lábios.",
      foto: null,
      preco: null,
      duracaoMinutos: 45,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: false,
    },
    {
      id: "limpeza-de-pele",
      nome: "Limpeza de pele",
      categoria: "facial",
      descricao:
        "Higienização profunda, extração e cuidados para uma pele mais limpa, equilibrada e uniforme.",
      foto: null,
      preco: null,
      duracaoMinutos: 90,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: true,
    },
    {
      id: "massagem",
      nome: "Massagens",
      categoria: "corporal",
      descricao: "Momento de relaxamento e alívio de tensões, com toque cuidadoso.",
      foto: null,
      preco: null,
      duracaoMinutos: 60,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: false,
    },
    {
      id: "drenagem",
      nome: "Drenagem",
      categoria: "corporal",
      descricao:
        "Massagem com movimentos suaves e ritmados que auxilia na sensação de leveza e no bem-estar.",
      foto: null,
      preco: null,
      duracaoMinutos: 60,
      duracaoConfirmada: false,
      intervaloAposMinutos: 15,
      agendavel: true,
      destaque: false,
    },
  ] as Servico[],

  /**
   * PORTFÓLIO — coloque os arquivos em /public/images/portfolio/ e preencha `src`.
   * Itens com `src: null` aparecem como espaços reservados (somente se `mostrarPendencias`).
   * Itens com `autorizada: false` NUNCA são exibidos com foto.
   */
  portfolio: [
    { src: null, alt: "Maquiagem social com acabamento iluminado", categoria: "maquiagem", legenda: "Make glow", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Produção de maquiagem para evento", categoria: "maquiagem", legenda: "Produção para evento", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Design de sobrancelhas — resultado", categoria: "sobrancelhas", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Cílios — resultado", categoria: "olhar", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Maquiagem delicada para ocasião especial", categoria: "maquiagem", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Brow lamination — resultado", categoria: "sobrancelhas", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Lash lifting — resultado", categoria: "olhar", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Hidragloss — resultado", categoria: "labios", proporcao: 4 / 5, autorizada: false },
    { src: null, alt: "Limpeza de pele — atendimento", categoria: "facial", proporcao: 4 / 5, autorizada: false },
  ] as FotoPortfolio[],

  seo: {
    titulo: "Kimiélly Wegner — Maquiagem & Estética em Vera Cruz/RS",
    descricao:
      "Maquiagem, sobrancelhas, cílios e estética com atendimento cuidadoso e horário marcado em Vera Cruz, RS. Agende online.",
  },
};

export type SiteConfig = typeof site;
