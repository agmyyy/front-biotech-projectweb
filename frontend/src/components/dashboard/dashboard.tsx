"use client";

import { useCallback } from "react";
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
  const { isCollapsed, toggleSidebar } = useSidebar();

  const {
    query,
    loading,
    result,
    error,
    executeSearch,
    clearSearch,
    inputRef,
  } = useSearch();

  const {
    sessions,
    activeSession,
    createSession,
    deleteSession,
    loadSession,
    setActiveSession,
  } = useChat();

  const { isGenerationComplete, resetGeneration, completeGeneration } =
    useFeedbackControl();

  const { sendFeedback, resetFeedback, isSubmitting, isSubmitted } =
    useFeedbackApi({
      searchId: result?.sessionId || activeSession?.id,
    });

  /**
   * Cria um novo chat limpo na interface.
   */
  const handleNewChat = useCallback(async () => {
    clearSearch();
    resetGeneration();
    resetFeedback();
    setActiveSession(null); // Reseta a sessão ativa para preparar para nova pergunta
  }, [clearSearch, resetGeneration, resetFeedback, setActiveSession]);

  /**
   * Disparado quando o usuário envia uma pergunta na SearchBar.
   */
  const handleSearch = useCallback(
    async (text: string) => {
      const cleanedText = text.trim();
      if (cleanedText.length < 2) return;

      resetGeneration();
      resetFeedback();

      // 1. Cria a variável dynamicTitle AQUI para estar disponível no escopo
      const dynamicTitle =
        cleanedText.length > 30
          ? `${cleanedText.substring(0, 30)}...`
          : cleanedText;

      let currentSession = activeSession;

      // 2. Se não houver sessão ativa na barra lateral, cria uma nova no Mock/BD
      if (!currentSession) {
        currentSession = await createSession(dynamicTitle);
      }

      // 3. Executa a busca após garantir que a sessão foi tratada
      await executeSearch(cleanedText);
    },
    [
      activeSession,
      createSession,
      executeSearch,
      resetGeneration,
      resetFeedback,
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
    },
    [loadSession, clearSearch, completeGeneration, resetFeedback],
  );

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
            {activeSession &&
            activeSession.messages &&
            activeSession.messages.length > 0 ? (
              activeSession.messages.map((msg, index) =>
                msg.role === "user" ? (
                  <SearchInput key={msg.id || index} text={msg.content} />
                ) : (
                  <SearchResult key={msg.id || index} content={msg.content} />
                ),
              )
            ) : (
              <>
                {query && <SearchInput text={query} />}
                {result && result.answer ? (
                  <SearchResult
                    content={result.answer}
                    onComplete={completeGeneration}
                  />
                ) : loading ? (
                  <SearchLoading />
                ) : (
                  !error && (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-green-1/50 text-lg font-light">
                        Inicie uma nova conversa ou selecione uma do histórico
                      </p>
                    </div>
                  )
                )}
              </>
            )}

            {/* Bloco de feedback: Pós-busca e com geração finalizada */}
            {!loading && query && isGenerationComplete && (
              <div className="flex justify-start w-full pt-2 pb-4 shrink-0 animate-in fade-in duration-500">
                {isSubmitted ? (
                  <h2 className="flex items-center justify-center text-center font-medium w-56 h-24 p-4 bg-li text-md text-green-1 shadow-md rounded-t-2xl rounded-br-2xl border border-li/50">
                    Obrigado(a) pelo seu feedback!
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
