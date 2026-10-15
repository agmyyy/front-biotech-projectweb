"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
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
  deleteSession: (
    sessionId: string,
    toastId?: string | number,
  ) => Promise<boolean>;
  sendFeedback: (feedback: FeedbackRating) => Promise<void>;
  setActiveSession: (session: ChatSession | null) => void;
}

export function useChat(): UseChatReturn {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tempo mínimo (ms) que o toast de confirmação de exclusão fica visível.
  const DELETE_TOAST_DURATION = 3000;  const loadSessions = useCallback(async () => {
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

  const deleteSession = useCallback(
    async (sessionId: string, toastId?: string | number) => {
      setLoading(true);
      setError(null);
      const target =
        sessions.find((s) => s.id === sessionId) ??
        (activeSession?.id === sessionId ? activeSession : null);
      try {
        await chatService.deleteSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (activeSession?.id === sessionId) {
          setActiveSession(null);
        }
        toast.success("Chat excluído", {
          id: toastId,
          duration: DELETE_TOAST_DURATION,
          description: target?.title
            ? `"${target.title}" foi removido do histórico.`
            : "A conversa foi removida do histórico.",
        });
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao excluir sessão";
        setError(message);
        toast.error("Não foi possível excluir", {
          id: toastId,
          duration: DELETE_TOAST_DURATION,
          description: message,
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [activeSession, sessions],
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
