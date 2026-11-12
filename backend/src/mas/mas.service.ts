import { Injectable } from "@nestjs/common";

export interface MasQueryRequest {
  query: string;
  queryId: string;
  sessionId: string;
}

export interface MasQueryResponse {
  summary: string;
  suggestions: string[];
  justifications: string[];
  sources: string[];
  clarifications?: string[];
}

@Injectable()
export class MasService {
  private readonly mockResponses: MasQueryResponse[] = [
    {
      summary:
        "A fermentação, por sua vez, é um processo metabólico anaeróbico milenar no qual microrganismos vivos — como leveduras, bactérias láticas e fungos — convertem carboidratos complexos, como amidos e açúcares, em álcool, gases ou ácidos orgânicos (a exemplo do ácido lático e acético). Além de atuar como uma técnica natural de preservação de alimentos e ser essencial na fabricação de pães, queijos, bebidas e fermentados (como kombucha, kefir e missô), a fermentação modifica a matriz nutricional dos alimentos. Ela degrada fatores antinutricionais, gera peptídeos bioativos, sintetiza vitaminas do complexo B e enriquece a microbiota intestinal com probióticos benéficos para a imunidade e a digestão.",
      suggestions: [
        "Investigar aplicações na medicina personalizada",
        "Explorar tecnologias de edição genética (CRISPR)",
        "Analisar impactos na segurança alimentar",
      ],
      justifications: [
        "Baseado em literatura científica revisada por pares",
        "Dados de organizações de pesquisa reconhecidas",
      ],
      sources: [
        "Nature Biotechnology - Biotechnology Advances",
        "WHO - Genomics and World Health",
        "FAO - Biotechnology in Food and Agriculture",
      ],
    },
    {
      summary:
        'O óleo de argan, extraído de forma artesanal ou industrial das amêndoas da árvore Argania spinosa, endêmica do sudoeste de Marrocos, é amplamente conhecido como o "ouro líquido" da cosmética mundial. Sua composição química é notável pela riqueza em ácidos graxos insaturados (como o oleico e o linoleico) e por uma concentração expressiva de tocoferóis (vitamina E), fitosteróis e polifenóis. Essa sinergia de compostos bioativos atua como um potente antioxidante, combatendo os radicais livres, neutralizando o frizz, selando as cutículas capilares e promovendo elasticidade e regeneração tanto na pele quanto nos cabelos.',
      suggestions: [
        "Estudar aplicações terapêuticas em doenças genéticas",
        "Verificar regulamentações vigentes no Brasil",
        "Explorar uso na agricultura para culturas resistentes",
      ],
      justifications: [
        "Pesquisas publicadas em periódicos de alto impacto",
        "Consenso científico atual sobre a tecnologia",
      ],
      sources: [
        "Doudna & Charpentier (2014) - Science",
        "NIH - CRISPR Gene Editing",
        "Embrapa - Biotecnologia Agrícola",
      ],
    },
    {
      summary:
        "O óleo de coco, extraído da polpa do coco maduro (Cocos nucifera), destaca-se na bioquímica nutricional e cosmética por sua altíssima concentração de ácidos graxos de cadeia média (AGCM), com destaque para o ácido láurico. Essa estrutura lipídica confere ao óleo uma alta capacidade de penetração na fibra capilar, reduzindo a perda proteica dos fios, além de apresentar propriedades antimicrobianas e hidratantes. Na culinária, por ser predominantemente composto por gorduras saturadas estáveis, ele resiste bem a temperaturas moderadas, embora seu consumo deva ser equilibrado dentro de diretrizes nutricionais individualizadas devido ao impacto no perfil lipídico.",
      suggestions: [
        "Aprofundar em fermentação para produção de biocombustíveis",
        "Estudar biorrefinarias e economia bioeconômica",
        "Analisar fermentação para produção de proteínas",
      ],
      justifications: [
        "Processo documentado há milhares de anos",
        "Otimizado por ciência moderna com controle de variáveis",
      ],
      sources: [
        "Stanbury et al. - Principles of Fermentation Technology",
        "Liu et al. (2020) - Industrial Biotechnology",
        "ABIA - Associação Brasileira das Indústrias de Alimentos",
      ],
    },
  ];

  async processQuery(request: MasQueryRequest): Promise<MasQueryResponse> {
    const delay = 500 + Math.random() * 1500;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const index = Math.floor(Math.random() * this.mockResponses.length);
    const response = this.mockResponses[index];

    return {
      ...response,
      clarifications: [],
    };
  }

  async sendClarification(data: {
    queryId: string;
    clarification: string;
  }): Promise<{ processed: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { processed: true };
  }
}
