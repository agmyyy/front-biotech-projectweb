"use client";

import { cn } from "@/lib/utils";

interface SearchResultProps {
  content: string;
  isLoading?: boolean;
}

/**
 * Componente responsável por renderizar a área de exibição do resultado de uma busca.
 * Limita a altura do bloco de conteúdo a um teto dinâmico (Viewport Height) e adiciona
 * rolagem interna customizada, prevenindo que textos muito longos quebrem a estrutura principal da página.
 * * @example
 * <SearchResult content={apiData.responseString} isLoading={isValidating} />
 */
export function SearchResult({
  content,
  isLoading = false,
}: SearchResultProps) {
  if (isLoading) return null;

  return (
    <div
      className={cn(
        "flex justify-center w-full py-10 custom-scrollbar",
        "flex-1",
      )}
    >
      <div className="w-full max-w-3xl">
        <p
          className={cn(
            "font-normal leading-relaxed text-lg text-green-1 whitespace-pre-wrap wrap-break-words",
            "overflow-y-auto max-h-[40vh] pr-2 custom-scrollbar",
          )}
        >
          {content}
        </p>
      </div>
    </div>
  );
}
