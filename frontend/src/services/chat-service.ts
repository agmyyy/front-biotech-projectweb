import { apiClient } from "./api-client";
import type { ChatSession, FeedbackRating } from "@/types";

/*
// Helper simples para simular o comportamento de ler e escrever no localStorage
const getLocalSessions = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("agmy_chat_sessions");
  return data ? JSON.parse(data) : [];
};

const saveLocalSessions = (sessions: ChatSession[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("agmy_chat_sessions", JSON.stringify(sessions));
  }
};

export const chatService = {
  /**
   * Retorna todas as sessões guardadas localmente.
   */
/* async getSessions(): Promise<ChatSession[]> {
    // Simula um pequeno delay de rede
    await new Promise((resolve) => setTimeout(resolve, 10));
    return getLocalSessions();
  },

  /**
   * Busca uma sessão específica pelo ID.
   */
/*async getSession(sessionId: string): Promise<ChatSession | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const sessions = getLocalSessions();
    return sessions.find((s) => s.id === sessionId) || null;
  },

  /**
   * Cria uma nova sessão em memória e a empurra para o topo do localStorage.
   */
/*async createSession(title: string): Promise<ChatSession> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const sessions = getLocalSessions();

    const newSession: ChatSession = {
      id: crypto.randomUUID(), // Gera um ID único string automaticamente
      title,
      messages: [], // Começa sem mensagens
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    saveLocalSessions([newSession, ...sessions]);
    return newSession;
  },

  /**
   * Deleta a sessão selecionada do localStorage.
   */
/*async deleteSession(sessionId: string): Promise<void> {
    const sessions = getLocalSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    saveLocalSessions(filtered);
  },

  /**
   * Apenas simula o envio do feedback sem quebrar
   */
/* async sendFeedback(feedback: FeedbackRating): Promise<void> {
    console.log("Feedback mockado enviado:", feedback);
  },
};*/

//MANTER PARA CONSUMO DA API

export const chatService = {
  //renderizar histórico de conversas anteriores
  //GET
  async getSessions(): Promise<ChatSession[]> {
    const response = await apiClient.get<ChatSession[]>("/chat/sessions");

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || [];
  },

  async getSession(sessionId: string): Promise<ChatSession | null> {
    //Quando o usuário clica em um item do histórico lateral, você dispara esse
    //método passando o ID para carregar as mensagens antigas e os detalhes
    //daquela conversa na tela principal
    //GET
    const response = await apiClient.get<ChatSession>(
      `/chat/sessions/${sessionId}`,
    );

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data || null;
  },

  //POST
  //Criar uma nova conversa no sistema.
  async createSession(title: string): Promise<ChatSession> {
    const response = await apiClient.post<ChatSession>("/chat/sessions", {
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

  //Apagar uma conversa permanentemente do banco de dados.
  //DELET
  async deleteSession(sessionId: string): Promise<void> {
    const response = await apiClient.delete(`/chat/sessions/${sessionId}`);

    if (response.error) {
      throw new Error(response.error);
    }
  },

  //POST
  //Registrar a avaliação do usuário sobre as respostas da IA
  async sendFeedback(feedback: FeedbackRating): Promise<void> {
    const response = await apiClient.post("/chat/feedback", {
      rating: feedback.rating,
      searchId: feedback.searchId,
    });

    if (response.error) {
      throw new Error(response.error);
    }
  },
};
