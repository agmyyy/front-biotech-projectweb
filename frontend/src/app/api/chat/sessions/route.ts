import { NextRequest, NextResponse } from "next/server";
import { SearchInput } from "@/shared/search.schema";

// Banco em memória temporário
interface MockSession {
  id: string;
  title: string;
  messages: Array<{ id: string; role: string; content: string }>;
  createdAt: string;
}

// simulando um banco de dados
let mockSessions: MockSession[] = [
  {
    id: "1",
    title: "Pesquisa sobre plantas medicinais",
    messages: [], // Agora o TS sabe que essa lista aceitará mensagens futuramente
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Portetor solar vegano",
    messages: [], // Agora o TS sabe que essa lista aceitará mensagens futuramente
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Creme para as mãoS",
    messages: [], // Agora o TS sabe que essa lista aceitará mensagens futuramente
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Shampoo e Condicionador",
    messages: [], // Agora o TS sabe que essa lista aceitará mensagens futuramente
    createdAt: new Date().toISOString(),
  },
];

//LISTAR
export async function GET() {
  return NextResponse.json(mockSessions);

  //return NextResponse.json({ name: true, method: "GET" });
}

//ENVIAR
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = SearchInput.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Dados inválidosssss",
          details: result.error.format(),
        },
        { status: 400 },
      );
    }

    // Como o seu schema usa 'content', pegamos ele aqui
    const { content } = result.data;

    const newSession = {
      id: crypto.randomUUID(),
      title: content, // O título da sessão passa a ser o conteúdo digitado
      messages: [{ id: crypto.randomUUID(), role: "user", content }],
      createdAt: new Date().toISOString(),
    };

    mockSessions.push(newSession);
    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar sessão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
