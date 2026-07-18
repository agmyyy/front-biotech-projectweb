"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchService } from "@/services/search-service";
import type { SearchResponse } from "@/types";

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  loading: boolean;
  result: SearchResponse | null;
  error: string | null;
  setResult: React.Dispatch<React.SetStateAction<SearchResponse | null>>;
  executeSearch: (text: string) => Promise<void>;
  clearSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Dispara o processo de busca com validação prévia de tamanho.
   */
  const executeSearch = useCallback(async (text: string) => {
    const cleanedText = text.trim();

    // Se o texto for menor que 2 caracteres, seta o erro e para o código aqui.
    // Isso impede que 'setQuery' seja executado e que o balão cinza apareça por engano.
    if (cleanedText.length < 2) {
      setError("Sua pesquisa deve ter pelo menos 2 caracteres");
      setResult(null);
      setQuery("");
      return;
    }

    // Se houver uma busca anterior ainda rodando, cancela ela imediatamente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setQuery(cleanedText);

    try {
      const searchResult = await searchService.search({ query: cleanedText });
      setResult(searchResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar";
      setError(errorMessage);
      setResult(null);
      setQuery("");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reseta completamente os estados do hook.
   */
  const clearSearch = useCallback(() => {
    setQuery("");
    setResult(null);
    setError(null);
    setLoading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    loading,
    result,
    setResult,
    error,
    executeSearch,
    clearSearch,
    inputRef,
  };
}
