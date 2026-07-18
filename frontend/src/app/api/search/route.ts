import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sessionId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query é obrigatória" },
        { status: 400 },
      );
    }

    if (query.trim().length < 1) {
      return NextResponse.json(
        { error: "Sua pesquisa deve ter pelo menos 2 caracteres" },
        { status: 400 },
      );
    }

    const result = await performSearch(query, sessionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro na busca:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID é obrigatório" },
        { status: 400 },
      );
    }

    const history = await getSearchHistory(sessionId);
    return NextResponse.json(history);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

async function performSearch(
  query: string,
  sessionId?: string,
): Promise<{
  answer: string;
  sources?: string[];
  sessionId: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const mockAnswer = `Explique como os artigos foram triados e descreva as instruções usadas para extrair dados sobre espécies de plantas e sua origem. 

(SUMÁRIO) 
O extrato de Rosa Mosqueta (Rosa rubiginosa) apresenta alta concentração de ácidos graxos essenciais, especialmente ácido linoléico (ω-6) e linolênico 
(ω-3), com potencial regenerativo comprovado em estudos clínicos para pele madura e danificada pelo sol.
 
(Sugestões de formulação)

- Serúm facil regenerativo
- Óleo corporal pós sol
- Mascara capilar nutritiva`;

  return {
    answer: mockAnswer,
    sources: [
      "Smith et al. (2023) - Journal of Ethnopharmacology",
      "Garcia & Santos (2022) - Phytochemistry Reviews",
      "Zhang et al. (2021) - Molecules",
    ],
    sessionId: sessionId || crypto.randomUUID(),
  };
}

async function getSearchHistory(sessionId: string) {
  return [
    {
      answer: "Resposta anterior 1...",
      sources: ["Fonte 1"],
      sessionId,
    },
    {
      answer: "Resposta anterior 2...",
      sources: ["Fonte 2"],
      sessionId,
    },
  ];
}
/*
// Interface que define a estrutura rica da resposta da IA
interface IADataResponse {
  answer: {
    summary: string;
    suggestions: string[];
    justifications: string[];
  };
  sources: string[];
  sessionId: string;
}

/**
 * Simula o motor de busca e geração da IA de forma altamente estruturada.
 * Preparado para o modelo de eventos que o WebSocket exige.
 */
/*async function performSearch(
  query: string,
  sessionId?: string,
): Promise<IADataResponse> {
  // Simula o tempo inicial de processamento/busca no banco vetorial (1.2 segundos)
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Banco de dados fictício para enriquecer a simulação com base em palavras-chave
  const lowerQuery = query.toLowerCase();
  let topic = "Rosa Mosqueta (Rosa rubiginosa)";
  let ativo = "ácidos graxos essenciais (ω-6 e ω-3)";
  
  if (lowerQuery.includes("alecrim") || lowerQuery.includes("cabelo")) {
    topic = "Alecrim (Rosmarinus officinalis)";
    ativo = "ácido carnosico e óleos essenciais estimulantes";
  } else if (lowerQuery.includes("camomila") || lowerQuery.includes("pele")) {
    topic = "Camomila (Matricaria chamomilla)";
    ativo = "alfa-bisabolol e apigenina com ação calmante";
  }

  // 1. Estruturação dos blocos de dados (O que futuramente serão eventos do WebSocket)
  const summary = `O extrato de ${topic} apresenta alta concentração de ${ativo}. Seu potencial regenerativo e fitoterápico é amplamente comprovado em ensaios clínicos acadêmicos, sendo ideal para o desenvolvimento de formulações personalizadas de alta performance.`;

  const suggestions = [
    `Sérum facial antioxidante de uso noturno com extrato concentrado de ${topic.split(" ")[0]}.`,
    `Tônico capilar ou corporal estimulante para regeneração tecidual profunda.`,
    `Creme base biocompatível nutritivo para peles maduras ou sensibilizadas.`
  ];

  const justifications = [
    `Eficácia Biológica: Os compostos ativos de ${topic.split(" ")[0]} penetram nas camadas lipídicas da barreira cutânea, acelerando o turnover celular.`,
    `Demanda de Mercado: Há um crescimento de 40% na procura por cosmecêuticos e fitoterápicos baseados em ativos botânicos rastreáveis e limpos.`,
    `Estabilidade de Formulação: Os componentes demonstram excelente sinergia química quando combinados com veículos hidrossolúveis ou óleos carreadores leves.`
  ];

  const sources = [
    "Silva, M. et al. (2024) - Revista Brasileira de Farmacognosia",
    "Dupont, A. & Sampaio, L. (2023) - International Journal of Cosmetic Science",
    "Global Botanical Actives Report (2025) - Mintel Database"
  ];

  // Retorna o objeto estruturado. 
  // No WebSocket, você disparará um evento 'emit' para cada uma dessas chaves separadamente.
  return {
    answer: {
      summary,
      suggestions,
      justifications,
    },
    sources,
    sessionId: sessionId || crypto.randomUUID(),
  };
}

/**
 * Recupera o histórico de buscas estruturado da sessão
 */
/*async function getSearchHistory(sessionId: string): Promise<Omit<IADataResponse, "sessionId">[]> {
  return [
    {
      answer: {
        summary: "Análise prévia do extrato de Lavanda (Lavandula angustifolia) e suas propriedades ansiolíticas em aromaterapia e cosmética funcional.",
        suggestions: ["Óleo essencial relaxante", "Sabonete líquido terapêutico"],
        justifications: ["Alta aceitação olfativa", "Redução comprovada de marcadores de estresse cutâneo."],
      },
      sources: ["Johnson et al. (2023) - Phytotherapy Research"],
    },
    {
      answer: {
        summary: "Estudo sobre o uso do Extrato de Chá Verde (Camellia sinensis) no controle da oleosidade e acne inflamatória.",
        suggestions: ["Gel de limpeza purificante", "Máscara de argila verde detox"],
        justifications: ["Presença marcante de galato de epigaloquina (EGCG)", "Ação adstringente natural."],
      },
      sources: ["Martinez, R. (2022) - Dermatological Therapy"],
    }
  ];
}*/
