import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sessionId } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query é obrigatória' }, { status: 400 });
    }

    if (query.trim().length < 3) {
      return NextResponse.json(
        { error: 'Query deve ter pelo menos 3 caracteres' },
        { status: 400 }
      );
    }

    const result = await performSearch(query, sessionId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID é obrigatório' }, { status: 400 });
    }

    const history = await getSearchHistory(sessionId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

async function performSearch(query: string, sessionId?: string): Promise<{
  answer: string;
  sources?: string[];
  sessionId: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const mockAnswer = `Explique como os artigos foram triados e descreva as instruções usadas para extrair dados sobre espécies de plantas e sua origem. 

**Metodologia de Triagem:**
1. **Identificação de bases de dados**: PubMed, Web of Science, Scopus
2. **Critérios de inclusão**: Artigos peer-reviewed, publicados nos últimos 10 anos
3. **Palavras-chave**: "plant species", "origin", "extraction", "bioactive compounds"
4. **Screening**: Título/abstract → Texto completo

**Instruções de Extração de Dados:**
- Nome científico da espécie
- País/região de origem
- Parte da planta utilizada
- Método de extração
- Compostos identificados
- Atividade biológica reportada`;

  return {
    answer: mockAnswer,
    sources: [
      'Smith et al. (2023) - Journal of Ethnopharmacology',
      'Garcia & Santos (2022) - Phytochemistry Reviews',
      'Zhang et al. (2021) - Molecules',
    ],
    sessionId: sessionId || crypto.randomUUID(),
  };
}

async function getSearchHistory(sessionId: string) {
  return [
    {
      answer: 'Resposta anterior 1...',
      sources: ['Fonte 1'],
      sessionId,
    },
    {
      answer: 'Resposta anterior 2...',
      sources: ['Fonte 2'],
      sessionId,
    },
  ];
}