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
import { useSidebar } from "@/hooks/use-sidebar";
import { useSearch } from "@/hooks/use-search";
import { useChat } from "@/hooks/use-chat";
import { cn } from "@/lib/utils";

export function Dashboard() {
  // Gerencia se a barra lateral está expandida ou recolhida
  const { isCollapsed, toggleSidebar } = useSidebar();

  // Concentra toda a lógica de requisição HTTP, loading, erros e a Ref do input de texto
  const {
    query,
    loading,
    result,
    error,
    executeSearch,
    clearSearch,
    inputRef,
    setQuery,
    setResult,
  } = useSearch();

  // CRUD de conversas
  // Como deve estar antes:
  const {
    sessions,
    activeSession,
    createSession,
    deleteSession,
    loadSession,
    setActiveSession,
  } = useChat();

  console.log("SESSÕES NO DASHBOARD:", sessions);

  //  HANDLERS / CALLBACKS
  /**
   * Cria um novo chat limpo. Limpa a busca atual na tela, gera uma nova
   * sessão no banco/estado e a define instantaneamente como a conversa ativa.
   */
  const handleNewChat = useCallback(async () => {
    clearSearch();
    const newSession = await createSession("Nova conversa");
    if (newSession) {
      setActiveSession(newSession);
    }
  }, [clearSearch, createSession, setActiveSession]);

  /**
   * Disparado quando o usuário envia o formulário da SearchBar.
   * Repassa o texto diretamente para o motor de busca do `useSearch`.
   */
  const handleSearch = useCallback(
    async (text: string) => {
      let currentSession = activeSession;

      // 1. Se não houver chat ativo, cria um na barra lateral com o título da pergunta
      if (!currentSession) {
        const dynamicTitle =
          text.length > 24 ? `${text.substring(0, 24)}...` : text;
        currentSession = await createSession(dynamicTitle);
      }

      // 2. Executa a busca na API
      await executeSearch(text);
    },
    [activeSession, createSession, executeSearch],
  );

  /**
   * Altera a conversa ativa ao clicar em um item do histórico lateral.
   * Reseta a tela de busca para que os dados do chat anterior sumam imediatamente.
   */
  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      // 1. Limpa a tela central antes de carregar o novo chat
      clearSearch();

      // 2. Avisa o useChat para buscar a sessão completa na API
      await loadSession(sessionId);
    },
    [loadSession, clearSearch],
  );

  /**
   * Remove uma sessão do histórico.
   * O `e.stopPropagation()` é crítico aqui para evitar que o clique no botão de deletar
   * ative também o clique do card (o que dispararia o `handleSelectSession` por engano).
   */
  const handleDeleteSession = useCallback(
    (sessionId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deleteSession(sessionId);
    },
    [deleteSession],
  );

  const handleFeedback = useCallback((rating: number) => {
    console.log("Feedback:", rating);
  }, []);

  return (
    <div className={cn("flex h-screen bg-main overflow-hidden font-primary")}>
      {/* BARRA LATERAL (ESTRUTURA DE NAVEGAÇÃO E HISTÓRICO) */}
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
            "flex flex-col flex-1 w-full max-w-4xl mx-auto px-4 py-5 overflow-hidden",
          )}
        >
          <div
            className={cn(
              "flex-1 flex border-2 flex-col overflow-y-auto custom-scrollbar pr-2",
            )}
          >
            {/* SE A SESSÃO ATIVA TIVER MENSAGENS, RENDERIZA O HISTÓRICO COMPLETO */}
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
              /* CASO CONTRÁRIO, MANTÉM O FLUXO ATUAL DE UMA BUSCA ISOLADA EM TEMPO REAL */
              <>
                {query && <SearchInput text={query} />}
                {loading ? (
                  <SearchLoading />
                ) : result ? (
                  <SearchResult content={result.answer} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-green-1/50 text-lg font-light">
                      Inicie uma nova conversa ou selecione uma do histórico
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Bloco de utilitários pós-busca: Feedback (Estrelas) e Erros da API */}
            {!loading && query && <FeedbackRating onSelect={handleFeedback} />}

            {error && (
              <div className="flex justify-center mt-4 animate-in fade-in duration-300">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm w-full max-w-xl">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* RODAPÉ: COMPONENTE DE ENTRADA DE DADOS */}
          <div className="pt-4 shrink-0">
            {/* O input é desativado (`disabled={loading}`) para impedir o usuário de enviar 
                múltiplas requisições paralelas enquanto a API não responde. */}
            <SearchBar
              onSearch={handleSearch}
              inputRef={inputRef}
              disabled={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
