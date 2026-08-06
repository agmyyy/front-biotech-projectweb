"use client";

import { useState, useCallback, useEffect } from "react";
import { chatService } from "@/services/chat-service";
import type { ChatMessage, ChatSession, FeedbackRating } from "@/types";

interface UseChatReturn {
  sessions: ChatSession[];
  activeSession: ChatSession | null;
  loading: boolean;
  error: string | null;
  loadSessions: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createSession: (title: string) => Promise<ChatSession | null>;
  appendMessages: (
    sessionId: string,
    messages: ChatMessage[],
  ) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  sendFeedback: (feedback: FeedbackRating) => Promise<void>;
  setActiveSession: (session: ChatSession | null) => void;
}

export function useChat(): UseChatReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatService.getSessions();
      setSessions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sessões");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    try {
      const session = await chatService.getSession(sessionId);
      setActiveSession(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sessão");
    } finally {
      setLoading(false);
    }
  }, []);

  const createSession = useCallback(async (title: string) => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await chatService.createSession(title);

      // Força a garantia de que a nova sessão tem a estrutura correta de mensagens
      const sessionWithMessages = {
        ...newSession,
        messages: newSession.messages || [],
      };

      // Atualiza o estado de sessões colocando a nova no topo da lista do histórico
      setSessions((prev) => [sessionWithMessages, ...prev]);
      setActiveSession(sessionWithMessages);

      return sessionWithMessages;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar sessão");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const appendMessages = useCallback(
    async (sessionId: string, messages: ChatMessage[]) => {
      if (messages.length === 0) return;

      try {
        const updated = await chatService.updateSession(sessionId, {
          messages,
        });

        if (!updated) return;

        // Atualiza a sessão na lista do histórico e na sessão ativa
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? updated : s)),
        );
        setActiveSession((prev) => (prev?.id === sessionId ? updated : prev));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao salvar mensagens",
        );
      }
    },
    [],
  );

  //ainda não foi implementado o exclusão de chats
  const deleteSession = useCallback(
    async (sessionId: string) => {
      setLoading(true);
      setError(null);
      try {
        await chatService.deleteSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao excluir sessão");
      } finally {
        setLoading(false);
      }
    },
    [activeSession],
  );

  const sendFeedback = useCallback(async (feedback: FeedbackRating) => {
    try {
      await chatService.sendFeedback(feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar feedback");
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    activeSession,
    loading,
    error,
    loadSessions,
    loadSession,
    createSession,
    appendMessages,
    deleteSession,
    sendFeedback,
    setActiveSession,
  };
}
