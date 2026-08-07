"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sidebar,
  AsideHeader,
  NewChat,
  ChatList,
  Logout,
} from "@/components/sidebar";
import { SearchInput, SearchResult, SearchLoading } from "@/components/chat";
import { SearchBar } from "@/components/search";
import { FeedbackRating } from "@/components/feedback";
import { useSidebar } from "@/hooks/control/use-sidebar";
import { useSearch } from "@/hooks/control/use-search";
import { useChat } from "@/hooks/control/use-chat";
import { useFeedbackApi } from "@/hooks/api/use-feedback-api";
import { useFeedbackControl } from "@/hooks/control/use-feedback-control";

import { cn } from "@/lib/utils";

export function Dashboard() {
  const router = useRouter();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const {
    query,
    loading,
    result,
    setResult,
    error,
    executeSearch,
    clearSearch,
    inputRef,
  } = useSearch();

  const {
    sessions,
    activeSession,
    createSession,
    appendMessages,
    deleteSession,
    loadSession,
    setActiveSession,
  } = useChat();

  const { isGenerationComplete, resetGeneration, completeGeneration } =
    useFeedbackControl();

  const [pendingAnswerId, setPendingAnswerId] = useState<string | null>(null);

  const { sendFeedback, resetFeedback, isSubmitting, isSubmitted } =
    useFeedbackApi({
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
      // seja estável durante a transição ao vivo → persistido.
      const pendingAnswerId = crypto.randomUUID();
      setPendingAnswerId(pendingAnswerId);

      // Persiste a pergunta imediatamente no histórico da sessão
      await appendMessages(currentSession.id, [
        {
          id: crypto.randomUUID(),
          role: "user",
          content: cleanedText,
          createdAt: new Date().toISOString(),
        },
      ]);

      const searchResult = await executeSearch(cleanedText, currentSession.id);

      if (searchResult && searchResult.answer) {
        await appendMessages(currentSession.id, [
          {
            id: pendingAnswerId,
            role: "assistant",
            content: searchResult.answer,
            createdAt: new Date().toISOString(),
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

  const handleDeleteSession = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteSession(sessionId);
    },
    [deleteSession],
  );

  const handleFeedback = useCallback(
    (rating: number) => {
      sendFeedback(rating);
    },
    [sendFeedback],
  );

  const sessionMessages = activeSession?.messages ?? [];

  // Remove a última resposta persistida enquanto ela está sendo exibida ao vivo,
  // evitando duplicar o balão ao finalizar a busca.
  const persistedMessages = result?.answer
    ? sessionMessages.filter(
        (msg, i) =>
          !(
            i === sessionMessages.length - 1 &&
            msg.role === "assistant" &&
            msg.content === result.answer
          ),
      )
    : sessionMessages;

  // Lista unificada: mensagens persistidas + resposta ao vivo (com chave estável)
  const displayMessages = result?.answer
    ? [
        ...persistedMessages,
        {
          id: pendingAnswerId,
          role: "assistant" as const,
          content: result.answer,
          createdAt: "",
        },
      ]
    : persistedMessages;

  const hasMessages = displayMessages.length > 0;

  return (
    <div className={cn("flex h-screen bg-main overflow-hidden font-primary")}>
      <Sidebar isCollapsed={isCollapsed} onToggle={toggleSidebar}>
        <AsideHeader isCollapsed={isCollapsed} />
        <NewChat isCollapsed={isCollapsed} onClick={handleNewChat} />
        <ChatList
          isCollapsed={isCollapsed}
          sessions={sessions}
          activeSessionId={activeSession?.id}
          onSelect={handleSelectSession}
          onDelete={handleDeleteSession}
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
          {/* CONTAINER ÚNICO DE SCROLL */}
          <div
            className={cn(
              "flex-1 flex flex-col overflow-y-auto custom-scrollbar px-4 space-y-5",
            )}
          >
            {hasMessages &&
              displayMessages.map((msg, index) =>
                msg.role === "user" ? (
                  <SearchInput key={msg.id || index} text={msg.content} />
                ) : (
                  <SearchResult
                    key={msg.id || index}
                    content={msg.content}
                    animated={msg.id === pendingAnswerId}
                    onComplete={
                      msg.id === pendingAnswerId
                        ? completeGeneration
                        : undefined
                    }
                  />
                ),
              )}

            {loading && !result?.answer && <SearchLoading />}

            {!hasMessages && !loading && !error && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-green-1/50 text-lg font-light">
                  Inicie uma nova conversa ou selecione uma do histórico
                </p>
              </div>
            )}

            {/* Bloco de feedback: Pós-busca e com geração finalizada */}
            {!loading && query && isGenerationComplete && (
              <div className="flex justify-start w-full pt-2 pb-4 shrink-0 animate-in fade-in duration-500">
                {isSubmitted ? (
                  <h2 className="flex items-center justify-center text-center font-medium w-56 h-24 p-4 bg-li text-md text-green-1 shadow-md rounded-t-2xl rounded-br-2xl border border-li/50">
                    Agradecemos seu feedback!
                  </h2>
                ) : (
                  <FeedbackRating
                    onSelect={handleFeedback}
                    disabled={isSubmitting}
                  />
                )}
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
