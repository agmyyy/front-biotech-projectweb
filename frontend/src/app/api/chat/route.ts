import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      const session = await getSessionById(sessionId);
      if (!session) {
        return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 });
      }
      return NextResponse.json(session);
    }

    const sessions = await getAllSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const session = await createSession(title);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'ID da sessão é obrigatório' }, { status: 400 });
    }

    await deleteSession(sessionId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir sessão:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function getAllSessions() {
  return [
    {
      id: '1',
      title: 'Pesquisa sobre plantas medicinais',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      title: 'Extração de compostos bioativos',
      messages: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

async function getSessionById(id: string) {
  const sessions = await getAllSessions();
  return sessions.find((s) => s.id === id) || null;
}

async function createSession(title: string) {
  return {
    id: crypto.randomUUID(),
    title,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function deleteSession(id: string) {
  console.log(`Sessão ${id} excluída`);
}