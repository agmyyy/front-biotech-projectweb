"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  appendMessages: (sessionId: string, messages: ChatMessage[]) => Promise<void>;
  updateMessageRating: (
    sessionId: string,
    messageId: string,
    rating: number,
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
      setError(err instanceof Error ? err.message : "Erro ao carregar o chat");
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
      setError(err instanceof Error ? err.message : "Erro ao carregar o chat");
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

  const activeSessionRef = useRef<ChatSession | null>(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  });

  const appendMessages = useCallback(
    async (sessionId: string, newMessages: ChatMessage[]) => {
      if (newMessages.length === 0) return;

      try {
        const existingMessages =
          activeSessionRef.current?.id === sessionId
            ? activeSessionRef.current.messages
            : [];
        const mergedMessages = [...existingMessages, ...newMessages];

        const updated = await chatService.appendSessionMessages(
          sessionId,
          mergedMessages,
        );

        if (!updated) return;

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

  const updateMessageRating = useCallback(
    async (sessionId: string, messageId: string, rating: number) => {
      const session =
        activeSessionRef.current?.id === sessionId
          ? activeSessionRef.current
          : null;
      if (!session) return;

      const updatedMessages = session.messages.map((msg) =>
        msg.id === messageId ? { ...msg, rating } : msg,
      );

      try {
        const updated = await chatService.appendSessionMessages(
          sessionId,
          updatedMessages,
        );

        if (!updated) return;

        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? updated : s)),
        );
        setActiveSession((prev) => (prev?.id === sessionId ? updated : prev));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erro ao salvar avaliação",
        );
      }
    },
    [],
  );

  //ainda não foi implementado a exclusão de chats
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
    updateMessageRating,
    deleteSession,
    sendFeedback,
    setActiveSession,
  };
}
