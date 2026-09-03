"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBar } from "./search-bar";
import { SearchInput } from "../chat";
import { chatService } from "@/services/chat-service";
import { useAutoScroll } from "@/hooks/use-auto-scroll";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatContainerProps {
  selectedSession?: Session | null;
  onSessionCreated?: (newSession: Session) => void;
}

export function ChatContainer({
  selectedSession,
  onSessionCreated,
}: ChatContainerProps) {
  const [currentSession, setCurrentSession] = useState<Session | null>(
    selectedSession || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { containerRef, autoScrollEnabled, scrollToBottom } = useAutoScroll();

  const handleSearch = async (text: string) => {
    setIsLoading(true);

    try {
      const newSession = await chatService.createSession(text);

      setCurrentSession(newSession);

      if (onSessionCreated) {
        onSessionCreated(newSession);
      }

      window.history.pushState({}, "", `/chat/${newSession.id}`);
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao processar a pesquisa.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeMessages = currentSession?.messages || [];

  useEffect(() => {
    if (autoScrollEnabled) {
      scrollToBottom();
    }
  }, [activeMessages.length, isLoading, autoScrollEnabled, scrollToBottom]);

  return (
    <div className="flex border-4 flex-col h-full w-full max-w-4xl mx-auto p-4 justify-between">
      {/* ÁREA DE MENSAGENS / CONTEÚDO */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-6 py-4">
        {activeMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-green-1/70 text-xl font-medium">
            Como posso te ajudar hoje?
          </div>
        ) : (
          activeMessages.map((msg) => (
            <div key={msg.id} className="w-full">
              {msg.role === "user" ? (
                /* Exibe a pergunta do usuário com o seu componente SearchInput */
                <SearchInput text={msg.content} maxLength={150} />
              ) : (
                /* Exibe a resposta do sistema */
                <div className="bg-white/80 p-4 rounded-2xl border border-green-1/20 text-gray-800">
                  {msg.content}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* CAMPO DE BUSCA FIXO NA PARTE INFERIOR */}
      <SearchBar
        onSearch={handleSearch}
        inputRef={inputRef}
        disabled={isLoading}
        placeholder={isLoading ? "Buscando..." : "Faça uma pesquisa..."}
      />
    </div>
  );
}
