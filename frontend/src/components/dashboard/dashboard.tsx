"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sidebar,
  AsideHeader,
  NewChat,
  ChatList,
  Logout,
} from "@/components/sidebar";
import { SearchInput, SearchResult, SearchLoading } from "@/components/chat";
import { SearchBar } from "@/components/search";
import { useSidebar } from "@/hooks/control/use-sidebar";
import { useSearch } from "@/hooks/control/use-search";
import { useChat } from "@/hooks/control/use-chat";
import { useFeedbackApi } from "@/hooks/api/use-feedback-api";
import { useFeedbackControl } from "@/hooks/control/use-feedback-control";
import { useAutoScroll } from "@/hooks/use-auto-scroll";

import { cn } from "@/lib/utils";
import type { User } from "@shared/schemas/auth.schema";

const MOBILE_BREAKPOINT = 768;

export function Dashboard() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { isCollapsed, toggleSidebar } = useSidebar(isMobile);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const {
    loading,
    result,
    setResult,
    error,
    executeSearch,
    clearSearch,
    inputRef,
    currentPhase,
  } = useSearch();

  const {
    sessions,
    activeSession,
    createSession,
    appendMessages,
    updateMessageRating,
    deleteSession,
    renameSession,
    loadSession,
    setActiveSession,
  } = useChat();

  const { resetGeneration, completeGeneration } = useFeedbackControl();

  const [pendingAnswerId, setPendingAnswerId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const confirmToastId = useRef<string | number | null>(null);
  const { containerRef, autoScrollEnabled, scrollToBottom } = useAutoScroll();

  const { sendFeedback, resetFeedback } = useFeedbackApi({
    searchId: result?.sessionId || activeSession?.id,
  });

  /**
   * Cria um novo chat limpo na interface.
   */
  const handleNewChat = useCallback(() => {
    clearSearch();
    resetGeneration();
    resetFeedback();
    setActiveSession(null); // Reseta a sessão ativa para preparar para nova pergunta
    router.replace("/dashboard", { scroll: false });
  }, [clearSearch, resetGeneration, resetFeedback, setActiveSession, router]);

  /**
   * Sincroniza a URL com a sessão ativa (ex.: /dashboard?chat=abc-123).
   */
  const syncUrl = useCallback(
    (sessionId?: string) => {
      router.replace(
        sessionId ? `/dashboard?chat=${sessionId}` : "/dashboard",
        { scroll: false },
      );
    },
    [router],
  );

  /**
   * Disparado quando o usuário envia uma pergunta na SearchBar.
   */
  const handleSearch = useCallback(
    async (text: string) => {
      const cleanedText = text.trim();
      if (cleanedText.length < 2) return;

      resetGeneration();
      resetFeedback();
      setResult(null);

      const dynamicTitle =
        cleanedText.length > 30
          ? `${cleanedText.substring(0, 30)}...`
          : cleanedText;

      let currentSession = activeSession;

      if (!currentSession) {
        currentSession = await createSession(dynamicTitle);
      }

      if (!currentSession) return;

      syncUrl(currentSession.id);

      // Gera o id da resposta agora para que a chave do balão ao vivo
      // seja estável durante a transição ao vivo, persistido.
      const pendingAnswerId = crypto.randomUUID();
      setPendingAnswerId(pendingAnswerId);

      // Persiste a pergunta no histórico da sessão
      await appendMessages(currentSession.id, [
        {
          id: crypto.randomUUID(),
          role: "user",
          content: cleanedText,
          createdAt: new Date().toISOString(),
        },
      ]);

      const searchResult = await executeSearch(cleanedText, currentSession.id);

      if (searchResult && searchResult.summary) {
        await appendMessages(currentSession.id, [
          {
            id: pendingAnswerId,
            role: "assistant",
            content: searchResult.summary,
            createdAt: new Date().toISOString(),
            suggestions: searchResult.suggestions,
            justifications: searchResult.justifications,
            sources: searchResult.sources,
            clarifications: searchResult.clarifications,
          },
        ]);
      }
    },
    [
      activeSession,
      createSession,
      executeSearch,
      appendMessages,
      resetGeneration,
      resetFeedback,
      setResult,
      syncUrl,
    ],
  );

  /**
   * Altera a conversa ativa ao clicar no histórico lateral.
   */
  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      clearSearch();
      resetFeedback();
      completeGeneration();
      await loadSession(sessionId);
      syncUrl(sessionId);
    },
    [loadSession, clearSearch, completeGeneration, resetFeedback, syncUrl],
  );

  /**
   * Lê o usuário do localStorage ao montar.
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("biotech_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // JSON inválido ou indisponível
    }
  }, []);

  /**
   * Ao montar, restaura a sessão indicada na URL (?chat=id).
   */
  useEffect(() => {
    const chatId = new URLSearchParams(window.location.search).get("chat");
    if (chatId) {
      loadSession(chatId);
    }
  }, [loadSession]);

  /**
   * Suporta o botão voltar/avançar do navegador.
   */
  useEffect(() => {
    const handlePopState = () => {
      const chatId = new URLSearchParams(window.location.search).get("chat");
      if (chatId) {
        loadSession(chatId);
      } else {
        clearSearch();
        setActiveSession(null);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [loadSession, clearSearch, setActiveSession]);

  const handleConfirmDelete = useCallback(
    async (sessionId: string) => {
      const toastId = confirmToastId.current;
      confirmToastId.current = null;
      const wasActive = activeSession?.id === sessionId;
      if (toastId) {
        toast.loading("Excluindo chat…", { id: toastId });
      }
      const ok = await deleteSession(sessionId, toastId ?? undefined);
      if (ok && wasActive) {
        clearSearch();
        resetFeedback();
        completeGeneration();
        syncUrl(undefined);
      }
    },
    [
      deleteSession,
      activeSession,
      clearSearch,
      resetFeedback,
      completeGeneration,
      syncUrl,
    ],
  );

  const handleRequestDelete = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const target = sessions.find((s) => s.id === sessionId);
      if (!target) return;
      if (confirmToastId.current) {
        toast.dismiss(confirmToastId.current);
      }
      const id = `delete-chat-${sessionId}`;
      confirmToastId.current = id;
      toast(`Excluir "${target.title}"?`, {
        id,
        description: "Essa ação não pode ser desfeita.",
        duration: Infinity,
        action: {
          label: "Excluir",
          onClick: () => handleConfirmDelete(sessionId),
        },
        cancel: {
          label: "Manter",
          onClick: () => {
            toast.dismiss(id);
          },
        },
        actionButtonStyle: {
          background: "var(--color-button)",
          color: "#fff",
          borderRadius: "9999px",
        },
        cancelButtonStyle: {
          background: "transparent",
          color: "var(--color-green-1)",
          border: "1px solid var(--color-li)",
          borderRadius: "9999px",
        },
        onDismiss: () => {
          if (confirmToastId.current === id) confirmToastId.current = null;
        },
      });
    },
    [sessions, handleConfirmDelete],
  );

  const handleRequestRename = useCallback(
    async (sessionId: string, title: string) => {
      return renameSession(sessionId, title);
    },
    [renameSession],
  );

  const handleFeedback = useCallback(
    (rating: number) => {
      sendFeedback(rating);
      if (activeSession && pendingAnswerId) {
        updateMessageRating(activeSession.id, pendingAnswerId, rating);
      }
    },
    [sendFeedback, activeSession, pendingAnswerId, updateMessageRating],
  );

  const sessionMessages = activeSession?.messages ?? [];

  // Remove a última resposta persistida enquanto ela está sendo exibida ao vivo,
  // evitando duplicar o balão ao finalizar a busca.
  const persistedMessages = result?.summary
    ? sessionMessages.filter(
        (msg, i) =>
          !(
            i === sessionMessages.length - 1 &&
            msg.role === "assistant" &&
            msg.content === result.summary
          ),
      )
    : sessionMessages;

  // Lista unificada: mensagens persistidas + resposta ao vivo (com chave estável)
  const liveMessage = useMemo(
    () =>
      result?.summary
        ? {
            id: pendingAnswerId,
            role: "assistant" as const,
            content: result.summary,
            createdAt: "",
          }
        : null,
    [result, pendingAnswerId],
  );

  const hasPersistedMessages = persistedMessages.length > 0;

  useEffect(() => {
    if (autoScrollEnabled) {
      scrollToBottom();
    }
  }, [persistedMessages.length, liveMessage, autoScrollEnabled, scrollToBottom]);

  return (
    <div className={cn("flex h-screen bg-main overflow-hidden font-primary")}>
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar} user={user}>
        <AsideHeader isCollapsed={isCollapsed} />
        <NewChat isCollapsed={isCollapsed} onClick={handleNewChat} />
        <ChatList
          isCollapsed={isCollapsed}
          sessions={sessions}
          activeSessionId={activeSession?.id}
          onSelect={handleSelectSession}
          onRequestDelete={handleRequestDelete}
          onRequestRename={handleRequestRename}
        />
        <Logout isCollapsed={isCollapsed} />
      </Sidebar>

      {/* CONTEÚDO PRINCIPAL (ÁREA DA CONVERSA E BUSCA) */}
      <main className={cn("flex-1 flex flex-col min-w-0")}>
        <div
          className={cn(
            "flex flex-col flex-1 w-full max-w-5xl mx-auto px-4 py-5 overflow-hidden",
          )}
        >
          {/* CONTAINER UNICO DE SCROLL */}
          <div
            ref={containerRef}
            className={cn(
              "flex-1 flex flex-col overflow-y-auto custom-scrollbar px-4 space-y-5",
            )}
          >
            {hasPersistedMessages &&
              persistedMessages.map((msg, index) =>
                msg.role === "user" ? (
                  <SearchInput key={msg.id || index} text={msg.content} />
                ) : msg.suggestions ? (
                  <SearchResult
                    key={msg.id || index}
                    result={{
                      summary: msg.content,
                      suggestions: msg.suggestions,
                      justifications: msg.justifications ?? [],
                      sources: msg.sources ?? [],
                      clarifications: msg.clarifications,
                      sessionId: activeSession?.id ?? "",
                    }}
                    animated={false}
                    messageId={msg.id}
                    onFeedback={msg.rating ? undefined : handleFeedback}
                  />
                ) : (
                  <SearchResult
                    key={msg.id || index}
                    content={msg.content}
                    animated={false}
                  />
                ),
              )}

            {liveMessage && (
              <SearchResult
                key={liveMessage.id}
                result={result!}
                animated={true}
                onComplete={completeGeneration}
                onFeedback={handleFeedback}
                currentPhase={currentPhase}
                messageId={pendingAnswerId ?? undefined}
              />
            )}

            {loading && !result?.summary && <SearchLoading />}

            {!hasPersistedMessages && !liveMessage && !loading && !error && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-green-1/50 text-lg font-light">
                  Inicie uma nova conversa ou selecione uma do historico
                </p>
              </div>
            )}
          </div>

          {/* BARRA DE BUSCA FIXA NO RODAPÉ */}
          <div className="pt-4 shrink-0 flex flex-col items-center w-full relative">
            {error && (
              <div className="w-full max-w-xl mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-2.5 rounded-full text-sm text-center shadow-sm">
                  {error}
                </div>
              </div>
            )}

            <SearchBar
              onSearch={handleSearch}
              inputRef={inputRef}
              disabled={loading}
              onFocus={() => {
                if (error) {
                  clearSearch();
                }
              }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
