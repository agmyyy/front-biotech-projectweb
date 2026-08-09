import { NextRequest, NextResponse } from "next/server";
import { createSessionSchema } from "@shared/schemas/query.schema";
import { mockStore } from "./mock-store";

// GET: Listar Sessões
export async function GET() {
  return NextResponse.json(mockStore.list(), { status: 200 });
}

// POST: Criar Nova Sessão
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = createSessionSchema.safeParse(body);

    if (!result.success) {
      const firstMessage =
        result.error.issues[0]?.message || "Dados inválidos.";

      return NextResponse.json(
        { error: firstMessage },
        { status: 400 },
      );
    }

    const { title } = result.data;
    const newSession = mockStore.create(title);

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Erro na rota /api/chat/sessions:", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a requisição" },
      { status: 500 },
    );
  }
}
