import { NextRequest, NextResponse } from "next/server";
import { searchSchema } from "@shared/search.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = searchSchema.safeParse(body);

    if (!result.success) {
      const firstMessage =
        result.error.issues[0]?.message || "Dados de busca inválidos.";

      return NextResponse.json(
        { error: firstMessage },
        { status: 400 },
      );
    }

    const { query, sessionId } = result.data;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamSearchResponse(query, sessionId, controller, encoder);
        } catch (err) {
          console.error("Erro no stream:", err);
          const errorChunk = `data: ${JSON.stringify({ type: "error", message: "Erro ao gerar resposta" })}\n\n`;
          controller.enqueue(encoder.encode(errorChunk));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
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

async function streamSearchResponse(
  query: string,
  sessionId: string | undefined,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
) {
  // Simula tempo de processamento/busca no banco vetorial
  await new Promise((resolve) => setTimeout(resolve, 800));

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

  const mockAnswer = `O extrato de ${topic} apresenta alta concentração de ${ativo}. Seu potencial regenerativo e fitoterápico é amplamente comprovado em ensaios clínicos acadêmicos, sendo ideal para o desenvolvimento de formulações personalizadas de alta performance.

(Sugestões de formulação)

- Sérum facial antioxidante de uso noturno com extrato concentrado de ${topic.split(" ")[0]}.
- Tônico capilar ou corporal estimulante para regeneração tecidual profunda.
- Creme base biocompatível nutritivo para peles maduras ou sensibilizadas.`;

  const sources = [
    "Silva, M. et al. (2024) - Revista Brasileira de Farmacognosia",
    "Dupont, A. & Sampaio, L. (2023) - International Journal of Cosmetic Science",
    "Global Botanical Actives Report (2025) - Mintel Database",
  ];

  const finalSessionId = sessionId || crypto.randomUUID();

  // Envia o texto em chunks de palavras com delay realista
  const words = mockAnswer.split(/(\s+)/);
  for (const word of words) {
    const chunk = JSON.stringify({ type: "chunk", content: word });
    controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
    await new Promise((resolve) => setTimeout(resolve, 30 + Math.random() * 40));
  }

  // Envia o evento final com sources e sessionId
  const doneEvent = JSON.stringify({
    type: "done",
    sources,
    sessionId: finalSessionId,
  });
  controller.enqueue(encoder.encode(`data: ${doneEvent}\n\n`));
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
