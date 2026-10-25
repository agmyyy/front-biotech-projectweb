import { NextRequest, NextResponse } from "next/server";
import { createSessionSchema } from "@shared/schemas/query.schema";
import { mockStore } from "../mock-store";

// GET: Buscar Sessão por ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const session = mockStore.find(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error("Erro na rota /api/chat/sessions/[sessionId]:", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a requisição" },
      { status: 500 },
    );
  }
}

// PATCH: Atualizar Título e/ou Anexar Mensagens da Sessão
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    if (typeof body.title !== "undefined") {
      const result = createSessionSchema.safeParse({ title: body.title });

      if (!result.success) {
        const firstMessage =
          result.error.issues[0]?.message || "Título inválido.";

        return NextResponse.json(
          { error: firstMessage },
          { status: 400 },
        );
      }
    }

    const updatedSession = mockStore.update(sessionId, {
      title: body.title,
      messages: body.messages,
    });

    if (!updatedSession) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedSession, { status: 200 });
  } catch (error) {
    console.error("Erro na rota /api/chat/sessions/[sessionId]:", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a requisição" },
      { status: 500 },
    );
  }
}
