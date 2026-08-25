"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchService } from "@/services/search-service";
import type { SearchResponse } from "@/types";

export type StreamingPhase = "summary" | "suggestions" | "justifications" | "sources" | "done";

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
  displayedSummary: string;
  displayedSuggestions: string[];
  displayedJustifications: string[];
  displayedSources: string[];
  currentPhase: StreamingPhase;
}

export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayedSummary, setDisplayedSummary] = useState("");
  const [displayedSuggestions, setDisplayedSuggestions] = useState<string[]>([]);
  const [displayedJustifications, setDisplayedJustifications] = useState<string[]>([]);
  const [displayedSources, setDisplayedSources] = useState<string[]>([]);
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
      setDisplayedSummary("");
      setDisplayedSuggestions([]);
      setDisplayedJustifications([]);
      setDisplayedSources([]);
      setCurrentPhase("summary");

      let accumulatedSummary = "";
      let accumulatedSuggestions: string[] = [];
      let accumulatedJustifications: string[] = [];
      let accumulatedSources: string[] = [];
      let currentItemIndex = 0;

      try {
        await searchService.searchStream(cleanedText, sessionId, {
          onChunk: (chunk) => {
            accumulatedSummary += chunk;
            setDisplayedSummary(accumulatedSummary);
            setResult((prev) => ({
              ...prev,
              summary: accumulatedSummary,
              suggestions: prev?.suggestions || [],
              justifications: prev?.justifications || [],
              sources: prev?.sources || [],
              sessionId: prev?.sessionId || sessionId || "",
            }));
          },
          onSuggestionChunk: (chunk) => {
            if (accumulatedSuggestions.length === 0) {
              accumulatedSuggestions = [""];
              currentItemIndex = 0;
            }
            accumulatedSuggestions[currentItemIndex] += chunk;
            setDisplayedSuggestions([...accumulatedSuggestions]);
          },
          onSuggestionDone: () => {
            setCurrentPhase("justifications");
            currentItemIndex = 0;
          },
          onJustificationChunk: (chunk) => {
            if (accumulatedJustifications.length === 0) {
              accumulatedJustifications = [""];
              currentItemIndex = 0;
            }
            accumulatedJustifications[currentItemIndex] += chunk;
            setDisplayedJustifications([...accumulatedJustifications]);
          },
          onJustificationDone: () => {
            setCurrentPhase("sources");
            currentItemIndex = 0;
          },
          onSourceChunk: (chunk) => {
            if (accumulatedSources.length === 0) {
              accumulatedSources = [""];
              currentItemIndex = 0;
            }
            accumulatedSources[currentItemIndex] += chunk;
            setDisplayedSources([...accumulatedSources]);
          },
          onSourceDone: () => {
            setCurrentPhase("done");
          },
          onDone: (data) => {
            const finalResponse: SearchResponse = {
              summary: accumulatedSummary,
              sources: accumulatedSources,
              suggestions: accumulatedSuggestions,
              justifications: accumulatedJustifications,
              clarifications: undefined,
              sessionId: data.sessionId,
            };
            finalResultRef.current = finalResponse;
            setResult(finalResponse);
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
    setDisplayedSummary("");
    setDisplayedSuggestions([]);
    setDisplayedJustifications([]);
    setDisplayedSources([]);
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
    displayedSummary,
    displayedSuggestions,
    displayedJustifications,
    displayedSources,
    currentPhase,
  };
}
