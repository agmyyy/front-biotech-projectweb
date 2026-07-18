"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SearchResultProps {
  content: string;
  isLoading?: boolean;
  onComplete?: () => void;
}

/**
 * Componente responsável por renderizar a área de exibição do resultado de uma busca.
 * Agora possui um efeito typewriter que digita o texto de forma fluida assim que ele chega.
 */
export function SearchResult({
  content,
  isLoading = false,
  onComplete,
}: SearchResultProps) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    // Se não houver conteúdo, limpa o texto anterior e sai
    if (!content) {
      setDisplayedText("");
      return;
    }

    let currentPosition = 0;
    const speed = 6;

    // Reseta o texto exibido para começar do zero toda vez que chegar uma nova resposta
    setDisplayedText("");

    const timer = setInterval(() => {
      if (currentPosition < content.length) {
        // Pega o texto do início até a posição atual e avança uma letra
        setDisplayedText(content.substring(0, currentPosition + 1));
        currentPosition++;
      } else {
        // Quando terminar de digitar todo o texto, limpa o intervalo para poupar memória
        clearInterval(timer);

        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    // Função de limpeza (cleanup) do React caso o usuário mude de chat antes de terminar de digitar
    return () => clearInterval(timer);
  }, [content]);

  if (isLoading) return null;

  return (
    <div className="flex justify-center w-full py-4">
      <div className="w-full max-w-3xl">
        <p
          className={cn(
            "font-normal leading-relaxed text-lg text-green-1 whitespace-pre-wrap wrap-break-words pr-2",
            displayedText.length < content.length &&
              "after:content-['|'] after:animate-pulse after:ml-0.5 after:text-green-1",
          )}
        >
          {displayedText}
        </p>
      </div>
    </div>
  );
}
