import { apiClient } from './api-client';
import type { SearchRequest, SearchResponse, StreamChunk } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface SearchStreamCallbacks {
  onChunk: (text: string) => void;
  onSuggestionChunk: (text: string) => void;
  onSuggestionDone: () => void;
  onJustificationChunk: (text: string) => void;
  onJustificationDone: () => void;
  onSourceChunk: (text: string) => void;
  onSourceDone: () => void;
  onDone: (data: { sessionId: string }) => void;
  signal?: AbortSignal;
}

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
    callbacks: SearchStreamCallbacks,
  ): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sessionId }),
      signal: callbacks.signal,
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

          switch (event.type) {
            case 'chunk':
              if (event.content) callbacks.onChunk(event.content);
              break;
            case 'suggestion_chunk':
              if (event.content) callbacks.onSuggestionChunk(event.content);
              break;
            case 'suggestion_done':
              callbacks.onSuggestionDone();
              break;
            case 'justification_chunk':
              if (event.content) callbacks.onJustificationChunk(event.content);
              break;
            case 'justification_done':
              callbacks.onJustificationDone();
              break;
            case 'source_chunk':
              if (event.content) callbacks.onSourceChunk(event.content);
              break;
            case 'source_done':
              callbacks.onSourceDone();
              break;
            case 'done':
              callbacks.onDone({ sessionId: event.sessionId || '' });
              break;
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