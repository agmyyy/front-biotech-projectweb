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
import { div } from "framer-motion/client";

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
   * Cria um novo chat limpo.
   */
  const handleNewChat = useCallback(async () => {
    clearSearch();
    resetGeneration();
    resetFeedback();
    const newSession = await createSession("Nova conversa");
    if (newSession) {
      setActiveSession(newSession);
    }
  }, [clearSearch, createSession, setActiveSession, resetGeneration]);

  /**
   * Disparado quando o usuário envia uma pergunta.
   */
  const handleSearch = useCallback(
    async (text: string) => {
      // 1. Executa a busca (a validação e o setQuery agora acontecem de forma segura lá dentro)
      await executeSearch(text);

      // 2. Se houver erro de validação imediata (ex: 1 caractere), o executeSearch
      // não vai atualizar a query. Portanto, não criamos uma sessão nova na barra lateral.
      const cleanedText = text.trim();
      if (cleanedText.length < 2) return;

      // 3. Se o texto for válido, gerencia a sessão normalmente
      let currentSession = activeSession;
      resetGeneration(); // Esconde o feedback anterior
      resetFeedback();

      if (!currentSession) {
        const dynamicTitle =
          cleanedText.length > 30
            ? `${cleanedText.substring(0, 30)}...`
            : cleanedText;
        currentSession = await createSession(dynamicTitle);
      }
    },
    [activeSession, createSession, executeSearch, resetGeneration],
  );

  /**
   * Altera a conversa ativa ao clicar no histórico lateral.
   */
  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      clearSearch();
      completeGeneration();
      await loadSession(sessionId);
    },
    [loadSession, clearSearch, completeGeneration],
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
          {/* CONTAINER ÚNICO DE SCROLL (Apenas mensagens e feedback rolam aqui) */}
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
                  <SearchInput key={index} text={msg.content} />
                ) : (
                  <SearchResult key={index} content={msg.content} />
                ),
              )
            ) : (
              <>
                {query && <SearchInput text={query} />}
                {loading ? (
                  <SearchLoading />
                ) : result ? (
                  <SearchResult
                    content={result.answer}
                    onComplete={completeGeneration}
                  />
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

            {/* Bloco de feedback: Só aparece pós-busca e com geração finalizada */}
            {!loading && query && isGenerationComplete && (
              <div className="flex justify-start w-full pt-2 pb-4 shrink-0 animate-in fade-in duration-500">
                {isSubmitted ? (
                  <h2 className="items-center justify-center text-center pt-6 font-medium  w-56 h-24 p-4 bg-li text-md text-green-1 shadow-ms rounded-t-2xl rounded-br-2xl shadow-md border border-li/50">
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
              /* Quando o usuário clica para corrigir o texto, o erro some */
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
