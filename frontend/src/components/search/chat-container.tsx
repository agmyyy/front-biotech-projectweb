"use client";

import { useRef, useState } from "react";
import { SearchBar } from "./search-bar";
import { SearchInput } from "../chat";
import { CreateSessionInput } from "@shared/search.schema";

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

  const handleSearch = async (text: string) => {
    setIsLoading(true);

    try {
      const payload: CreateSessionInput = { title: text };

      const response = await fetch("/api/chat/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Erro ao processar a pesquisa.");
        return;
      }

      const newSession: Session = await response.json();

      // 1. Atualiza a sessão ativa na tela imediatamente (sem mudar de página)
      setCurrentSession(newSession);

      // 2. Notifica o componente pai (para atualizar a lista do histórico na Sidebar)
      if (onSessionCreated) {
        onSessionCreated(newSession);
      }

      // 3. Atualiza a URL suavemente no navegador sem dar reload (opcional)
      window.history.pushState({}, "", `/chat/${newSession.id}`);
    } catch (error) {
      console.error("Erro na requisição:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeMessages = currentSession?.messages || [];

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 justify-between">
      {/* ÁREA DE MENSAGENS / CONTEÚDO */}
      <div className="flex-1 overflow-y-auto space-y-6 py-4">
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
                /* Exibe a resposta do assistente/sistema */
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
