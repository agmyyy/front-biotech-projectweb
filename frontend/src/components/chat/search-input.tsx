"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  text: string;
  maxLength?: number;
}

/**
 * Componente de exibição de texto expansível (Read More / Show Less).
 * Geralmente utilizado para apresentar queries longas de busca ou descrições no histórico do usuário.
 * Renderiza um botão de alternância dinamicamente apenas se o texto ultrapassar o limite de caracteres informado.
 * * @example
 * <SearchInput
 * text="Uma query de busca muito longa enviada pelo usuário que pode quebrar o layout se exibida por inteiro..."
 * maxLength={100}
 * />
 */
export function SearchInput({ text, maxLength = 200 }: SearchInputProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongText = text.length > maxLength;
  const displayText =
    isExpanded || !isLongText ? text : `${text.substring(0, maxLength)}...`;

  return (
    <div className="flex justify-end">
      <div
        className={cn(
          "flex items-start gap-3 bg-li px-5 py-3 max-w-140 rounded-3xl shadow-md text-lg overflow-hidden",
          "border border-li/50",
        )}
      >
        <span className="whitespace-pre-wrap font-normal wrap-break-words flex-1 text-green-1 leading-relaxed">
          {displayText}
        </span>

        {isLongText && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "text-green-1 hover:opacity-65 transition-opacity shrink-0 mt-1",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-1 rounded",
            )}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Mostrar menos" : "Mostrar mais"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
