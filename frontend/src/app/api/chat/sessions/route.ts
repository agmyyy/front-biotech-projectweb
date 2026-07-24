import { NextRequest, NextResponse } from "next/server";
import { searchSchema } from "@shared/search.schema";

interface MockSession {
  id: string;
  title: string;
  messages: Array<{ id: string; role: string; content: string }>;
  createdAt: string;
}

let mockSessions: MockSession[] = [
  {
    id: "1",
    title: "Pesquisa sobre plantas medicinais",
    messages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Protetor solar vegano",
    messages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Creme para as mãos",
    messages: [],
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Shampoo e Condicionador",
    messages: [],
    createdAt: new Date().toISOString(),
  },
];

// LISTAR
export async function GET() {
  return NextResponse.json(mockSessions);
}

// ENVIAR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = searchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: result.error.format(),
        },
        { status: 400 },
      );
    }

    const { content } = result.data;

    const newSession: MockSession = {
      id: crypto.randomUUID(),
      title: content,
      messages: [{ id: crypto.randomUUID(), role: "user", content }],
      createdAt: new Date().toISOString(),
    };

    mockSessions.push(newSession);
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error(" ERRO REAL DA ROTA:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor", details: String(error) },
      { status: 500 },
    );
  }

  /*catch (error) {
    console.error("Erro ao criar sessão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }*/
}
