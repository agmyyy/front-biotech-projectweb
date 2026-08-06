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
  executeSearch: (
    text: string,
    sessionId?: string,
  ) => Promise<SearchResponse | null>;
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
   * Dispara o processo de busca com streaming de resposta.
   * Retorna o resultado final (answer, sources, sessionId) ou null em erro.
   */
  const executeSearch = useCallback(
    async (text: string, sessionId?: string): Promise<SearchResponse | null> => {
      const cleanedText = text.trim();

      if (cleanedText.length < 2) {
        setError("Sua pesquisa deve ter pelo menos 2 caracteres");
        setResult(null);
        setQuery("");
        return null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);
      setQuery(cleanedText);
      setResult(null);

      let accumulatedAnswer = "";
      let finalSources: string[] = [];
      let finalSessionId = sessionId || "";

      try {
        await searchService.searchStream(
          cleanedText,
          sessionId,
          (chunk) => {
            accumulatedAnswer += chunk;
            setResult((prev) => ({
              ...prev,
              answer: accumulatedAnswer,
              sessionId: prev?.sessionId || sessionId || "",
            }));
          },
          (sources, returnedSessionId) => {
            finalSources = sources;
            finalSessionId = returnedSessionId || sessionId || "";
            setResult({
              answer: accumulatedAnswer,
              sources,
              sessionId: finalSessionId,
            });
            setLoading(false);
          },
          abortControllerRef.current.signal,
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return null;
        }
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao buscar";
        setError(errorMessage);
        setResult(null);
        setQuery("");
        return null;
      } finally {
        setLoading(false);
      }

      if (!finalSessionId) return null;

      return {
        answer: accumulatedAnswer,
        sources: finalSources,
        sessionId: finalSessionId,
      };
    },
    [],
  );

  /**
   * Reseta os estados do hook.
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
