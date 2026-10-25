import { NextRequest, NextResponse } from "next/server";
import { searchSchema } from "@shared/schemas/query.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = searchSchema.safeParse(body);

    if (!result.success) {
      const firstMessage =
        result.error.issues[0]?.message || "Dados de busca inválidos.";

      return NextResponse.json({ error: firstMessage }, { status: 400 });
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

  const topicShort = topic.split(" ")[0];

  const summary = `O extrato de ${topic} apresenta alta concentração de ${ativo}. Seu potencial regenerativo e fitoterápico é amplamente comprovado em ensaios clínicos acadêmicos, sendo ideal para o desenvolvimento de formulações personalizadas de alta performance.`;

  const suggestions = [
    `Sérum facial antioxidante de uso noturno com extrato concentrado de ${topicShort}.`,
    `Tônico capilar ou corporal estimulante para regeneração tecidual profunda.`,
    `Creme base biocompatível nutritivo para peles maduras ou sensibilizadas.`,
  ];

  const justifications = [
    `Eficácia Biológica: Os compostos ativos de ${topicShort} penetram nas camadas lipídicas da barreira cutânea, acelerando o turnover celular.`,
    `Demanda de Mercado: Há um crescimento de 40% na procura por cosmecêuticos e fitoterápicos baseados em ativos botânicos rastreáveis e limpos.`,
    `Estabilidade de Formulação: Os componentes demonstram excelente sinergia química quando combinados com veículos hidrossolúveis ou óleos carreadores leves.`,
  ];

  const sources = [
    "Silva, M. et al. (2024) - Revista Brasileira de Farmacognosia",
    "Dupont, A. & Sampaio, L. (2023) - International Journal of Cosmetic Science",
    "Global Botanical Actives Report (2025) - Mintel Database",
  ];

  const finalSessionId = sessionId || crypto.randomUUID();

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));
  const send = (data: object) =>
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

  // stream resumo inicial
  const words = summary.split(/(\s+)/);
  for (const word of words) {
    send({ type: "chunk", content: word });
    await delay(30 + Math.random() * 40);
  }

  //tream sugestões
  for (const suggestion of suggestions) {
    const suggestionWords = suggestion.split(/(\s+)/);
    for (const word of suggestionWords) {
      send({ type: "suggestion_chunk", content: word });
      await delay(6);
    }
  }
  send({ type: "suggestion_done" });

  // stream justificativas
  for (const justification of justifications) {
    const justificationWords = justification.split(/(\s+)/);
    for (const word of justificationWords) {
      send({ type: "justification_chunk", content: word });
      await delay(6);
    }
  }
  send({ type: "justification_done" });

  // stream das fontes
  for (const source of sources) {
    const sourceWords = source.split(/(\s+)/);
    for (const word of sourceWords) {
      send({ type: "source_chunk", content: word });
      await delay(6);
    }
  }
  send({ type: "source_done" });

  send({ type: "done", sessionId: finalSessionId });
}

async function getSearchHistory(sessionId: string) {
  return [
    {
      summary:
        "Análise prévia do extrato de Lavanda (Lavandula angustifolia) e suas propriedades ansiolíticas em aromaterapia e cosmética funcional.",
      suggestions: ["Óleo essencial relaxante", "Sabonete líquido terapêutico"],
      justifications: [
        "Alta aceitação olfativa",
        "Redução comprovada de marcadores de estresse cutâneo.",
      ],
      sources: ["Johnson et al. (2023) - Phytotherapy Research"],
      sessionId,
    },
    {
      summary:
        "Estudo sobre o uso do Extrato de Chá Verde (Camellia sinensis) no controle da oleosidade e acne inflamatória.",
      suggestions: [
        "Gel de limpeza purificante",
        "Máscara de argila verde detox",
      ],
      justifications: [
        "Presença marcante de galato de epigaloquina (EGCG)",
        "Ação adstringente natural.",
      ],
      sources: ["Martinez, R. (2022) - Dermatological Therapy"],
      sessionId,
    },
  ];
}
