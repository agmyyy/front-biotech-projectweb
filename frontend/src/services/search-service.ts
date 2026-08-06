import { apiClient } from './api-client';
import type { SearchRequest, SearchResponse, StreamChunk } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const searchService = {
  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await apiClient.post<SearchResponse>('/search', request);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error('Resposta inválida da API');
    }

    return response.data;
  },

  async searchStream(
    query: string,
    sessionId: string | undefined,
    onChunk: (text: string) => void,
    onDone: (sources: string[], sessionId: string) => void,
    signal?: AbortSignal,
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sessionId }),
      signal,
    });

    if (!response.ok) {
      throw new Error('Erro na requisição de busca');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream não disponível');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const event: StreamChunk = JSON.parse(jsonStr);

          if (event.type === 'chunk' && event.content) {
            onChunk(event.content);
          } else if (event.type === 'done') {
            onDone(event.sources || [], event.sessionId || '');
          }
        } catch {
          // Ignora linhas malformadas
        }
      }
    }
  },

  async getHistory(sessionId: string): Promise<SearchResponse[]> {
    const response = await apiClient.get<SearchResponse[]>(`/search/history/${sessionId}`);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  },
};