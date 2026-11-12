"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchService } from "@/services/search-service";
import type { SearchResponse } from "@/types";

export type StreamingPhase = "summary" | "done";

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
  currentPhase: StreamingPhase;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<StreamingPhase>("summary");

  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const finalResultRef = useRef<SearchResponse | null>(null);

  const executeSearch = useCallback(
    async (text: string, sessionId?: string): Promise<SearchResponse | null> => {
      const cleanedText = text.trim();

      if (cleanedText.length < 2) {
        setError("Sua pesquisa deve ter pelo menos 2 caracteres");
        setResult(null);
        setQuery("");
        return null;
      }

      if (cleanedText.length > 1000) {
        setError("Sua pesquisa ultrapassa o limite de 1000 caracteres. Reduza o texto e tente novamente.");
        setResult(null);
        setQuery("");
        return null;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      finalResultRef.current = null;
      setLoading(true);
      setError(null);
      setQuery(cleanedText);
      setResult(null);
      setCurrentPhase("summary");

      let accumulatedSummary = "";

      try {
        await searchService.searchStream(cleanedText, sessionId, {
          onChunk: (chunk) => {
            accumulatedSummary += chunk;
            setResult((prev) => ({
              summary: accumulatedSummary,
              sessionId: prev?.sessionId || sessionId || "",
            }));
          },
          onDone: (data) => {
            // searchId é o id da mensagem do assistente, usado na avaliação
            const finalResponse: SearchResponse = {
              summary: accumulatedSummary,
              sessionId: data.sessionId,
              searchId: data.searchId,
            };
            finalResultRef.current = finalResponse;
            setResult(finalResponse);
            setCurrentPhase("done");
            setLoading(false);
          },
          signal: abortControllerRef.current.signal,
        });
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

      return finalResultRef.current;
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setResult(null);
    setError(null);
    setLoading(false);
    finalResultRef.current = null;
    setCurrentPhase("summary");

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
    currentPhase,
  };
}
