import { NextRequest, NextResponse } from "next/server";
import { searchSchema } from "@shared/search.schema";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

const globalForMock = globalThis as unknown as { mockSessions?: Session[] };

const mockSessions: Session[] = globalForMock.mockSessions ?? [
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
];

if (process.env.NODE_ENV !== "production") {
  globalForMock.mockSessions = mockSessions;
}

// GET: Listar Sessões
export async function GET() {
  return NextResponse.json(mockSessions, { status: 200 });
}

// POST: Criar Nova Sessão + Primeira Mensagem
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Validação estrita via Zod
    const result = searchSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { content } = result.data;

    //  Criação da nova sessão simulando o registro do BD
    const newSession: Session = {
      id: crypto.randomUUID(),
      title: content.length > 30 ? `${content.substring(0, 30)}...` : content,
      messages: [
        {
          id: crypto.randomUUID(),
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    // Insere no topo da lista
    mockSessions.unshift(newSession);

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Erro na rota /api/sessions:", error);

    return NextResponse.json(
      { error: "Erro interno ao processar a requisição" },
      { status: 500 },
    );
  }
}
