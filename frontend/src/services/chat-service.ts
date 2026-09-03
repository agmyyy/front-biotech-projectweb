import { apiClient } from "./api-client";
import type { ChatMessage, ChatSession, FeedbackRating } from "@/types";

export const chatService = {
  async getSessions(): Promise<ChatSession[]> {
    const response = await apiClient.get<ChatSession[]>("/sessions");

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  },

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const response = await apiClient.get<ChatSession>(
      `/sessions/${sessionId}`,
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || null;
  },

  async createSession(title: string): Promise<ChatSession> {
    const response = await apiClient.post<ChatSession>("/sessions", {
      title,
    });

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error("Falha ao criar sessão");
    }

    return response.data;
  },

  async updateSession(
    sessionId: string,
    patch: { title?: string; messages?: ChatMessage[] },
  ): Promise<ChatSession | null> {
    const response = await apiClient.patch<ChatSession>(
      `/sessions/${sessionId}`,
      patch,
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || null;
  },

  async appendSessionMessages(
    sessionId: string,
    messages: ChatMessage[],
  ): Promise<ChatSession | null> {
    const response = await apiClient.post<ChatSession>(
      `/sessions/${sessionId}/messages`,
      { messages },
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || null;
  },

  async deleteSession(sessionId: string): Promise<void> {
    const response = await apiClient.delete(`/sessions/${sessionId}`);

    if (response.error) {
      throw new Error(response.error);
    }
  },

  async sendFeedback(feedback: FeedbackRating): Promise<void> {
    const response = await apiClient.post("/feedback", {
      rating: feedback.rating,
      searchId: feedback.searchId,
    });

    if (response.error) {
      throw new Error(response.error);
    }
  },
};
