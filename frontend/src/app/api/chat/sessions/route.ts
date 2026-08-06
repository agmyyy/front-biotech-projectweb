import { NextRequest, NextResponse } from "next/server";
import { createSessionSchema } from "@shared/search.schema";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const globalForMock = globalThis as unknown as { mockSessions?: Session[] };

const mockSessions: Session[] = globalForMock.mockSessions ?? [
  {
    id: "1",
    title: "Pesquisa sobre plantas medicinais",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Protetor solar vegano",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

if (process.env.NODE_ENV !== "production") {
  globalForMock.mockSessions = mockSessions;
}

// GET: Listar Sessões
export async function GET() {
  return NextResponse.json(mockSessions, { status: 200 });
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
    const now = new Date().toISOString();

    const newSession: Session = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    mockSessions.unshift(newSession);

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Erro na rota /api/chat/sessions:", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a requisição" },
      { status: 500 },
    );
  }
}
