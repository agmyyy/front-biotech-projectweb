import { Injectable } from '@nestjs/common';

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
        'A biotecnologia abrange o uso de organismos vivos e sistemas biológicos para desenvolver produtos e tecnologias. Aplicações incluem medicina, agricultura, indústria e meio ambiente.',
      suggestions: [
        'Investigar aplicações na medicina personalizada',
        'Explorar tecnologias de edição genética (CRISPR)',
        'Analisar impactos na segurança alimentar',
      ],
      justifications: [
        'Baseado em literatura científica revisada por pares',
        'Dados de organizações de pesquisa reconhecidas',
      ],
      sources: [
        'Nature Biotechnology - Biotechnology Advances',
        'WHO - Genomics and World Health',
        'FAO - Biotechnology in Food and Agriculture',
      ],
    },
    {
      summary:
        'O CRISPR-Cas9 é uma ferramenta de edição genética que permite modificar DNA com precisão. Revolucionou a biotecnologia ao ser mais acessível e eficiente que métodos anteriores.',
      suggestions: [
        'Estudar aplicações terapêuticas em doenças genéticas',
        'Verificar regulamentações vigentes no Brasil',
        'Explorar uso na agricultura para culturas resistentes',
      ],
      justifications: [
        'Pesquisas publicadas em periódicos de alto impacto',
        'Consenso científico atual sobre a tecnologia',
      ],
      sources: [
        'Doudna & Charpentier (2014) - Science',
        'NIH - CRISPR Gene Editing',
        'Embrapa - Biotecnologia Agrícola',
      ],
    },
    {
      summary:
        'A fermentação é um dos processos biotecnológicos mais antigos, utilizado na produção de alimentos, bebidas e substâncias farmacêuticas. Microorganismos convertem substratos em produtos desejados.',
      suggestions: [
        'Aprofundar em fermentação para produção de biocombustíveis',
        'Estudar biorrefinarias e economia bioeconômica',
        'Analisar fermentação para produção de proteínas',
      ],
      justifications: [
        'Processo documentado há milhares de anos',
        'Otimizado por ciência moderna com controle de variáveis',
      ],
      sources: [
        'Stanbury et al. - Principles of Fermentation Technology',
        'Liu et al. (2020) - Industrial Biotechnology',
        'ABIA - Associação Brasileira das Indústrias de Alimentos',
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
