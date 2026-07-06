"use client";

import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componente de feedback visual para estados de carregamento de busca (Loading State).
 * Centraliza um indicador de progresso (spinner) acompanhado de um texto descritivo.
 * Utiliza classes de animação do Tailwind para garantir uma transição suave de entrada (fade-in).
 * * @example
 * if (isLoading) return <SearchLoading />;
 */
export function SearchLoading() {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center  mt-auto pt-90 animate-in fade-in duration-700",
        "flex-1",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-2 text-sm text-green-1/70",
          "font-medium",
        )}
      >
        <span>Carregando sua pesquisa</span>
        <Loader
          className="h-4 w-4 animate-spin text-green-1 shrink-0"
          aria-hidden="true"
        />
      </p>
    </div>
  );
}
