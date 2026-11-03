import { apiClient } from './api-client';
import type { SearchRequest, SearchResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface SearchStreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (data: { sessionId: string; searchId: string }) => void;
  signal?: AbortSignal;
}

export const searchService = {
  async search(request: SearchRequest): Promise<SearchResponse> {
    const response = await apiClient.post<SearchResponse>('/queries', request);

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
    const token = apiClient.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/queries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, sessionId }),
      signal: callbacks.signal,
    });

    if (!response.ok) {
      let message = 'Erro na requisição de busca';
      try {
        const body = await response.json();
        if (body.message) message = body.message;
        else if (body.error) message = body.error;
      } catch {}
      throw new Error(message);
    }

    const data = await response.json();

    if (data.summary) {
      const words = data.summary.split(' ');
      for (let i = 0; i < words.length; i++) {
        await new Promise((r) => setTimeout(r, 30));
        callbacks.onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
      }
    }

    callbacks.onDone({ sessionId: data.sessionId || "", searchId: data.searchId || "" });
  },

  async getHistory(sessionId: string): Promise<SearchResponse[]> {
    const response = await apiClient.get<SearchResponse[]>(`/queries?sessionId=${sessionId}`);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  },
};
