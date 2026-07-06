import { apiClient } from './api-client';
import type { SearchRequest, SearchResponse } from '@/types';

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

  async getHistory(sessionId: string): Promise<SearchResponse[]> {
    const response = await apiClient.get<SearchResponse[]>(`/search/history/${sessionId}`);

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  },
};