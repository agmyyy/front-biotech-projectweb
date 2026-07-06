"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { searchService } from "@/services/search-service";
import type { SearchResponse } from "@/types";

/**
 * Interface que define o objeto de retorno do hook `useSearch`.
 */
interface UseSearchReturn {
  query: string;
  /** Função para atualizar manualmente o estado da query de busca. */
  setQuery: (query: string) => void;
  loading: boolean;
  /** O resultado retornado pela API de busca, ou `null` caso não haja busca ativa ou ocorra um erro. */
  result: SearchResponse | null;
  error: string | null;
  setResult: React.Dispatch<React.SetStateAction<SearchResponse | null>>;

  /**
   * Função assíncrona responsável por disparar a busca na API.
   * Cancela automaticamente requisições anteriores que ainda estejam pendentes.
   * * @param text - O texto/termo a ser pesquisado.
   * @returns Uma Promise que se resolve quando a busca é concluída (com sucesso ou falha).
   */
  executeSearch: (text: string) => Promise<void>;
  clearSearch: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Hook customizado para gerenciamento de estado e controle de requisições de busca.
 * * Oferece suporte nativo a cancelamento de requisições obsoletas via `AbortController`
 * (evita Race Conditions) e manipulação direta de foco do input através de Refs.
 * * @example
 * ```tsx
 * const { query, loading, result, executeSearch, clearSearch, inputRef } = useSearch();
 * * return (
 * <form onSubmit={(e) => { e.preventDefault(); executeSearch(texto); }}>
 * <input ref={inputRef} />
 * <button type="button" onClick={clearSearch}>Limpar</button>
 * </form>
 * );
 * ```
 * * @returns {UseSearchReturn} Um objeto contendo os estados da busca, funções de execução e referências a elementos HTML.
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Dispara o processo de busca.
   * Gerencia os estados de carregamento, erro e cancelamento HTTP.
   */
  const executeSearch = useCallback(async (text: string) => {
    if (!text.trim()) return;

    // Se houver uma busca anterior ainda rodando, cancela ela imediatamente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoading(true);
    setError(null);
    setQuery(text);

    try {
      // Executa a chamada do serviço passando o sinal de cancelamento, se a API suportar.
      const searchResult = await searchService.search({ query: text });
      setResult(searchResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao buscar";
      setError(errorMessage);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reseta completamente os estados do hook e força o foco do teclado
   * de volta para o input de texto.
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

  /**
   * Efeito de limpeza
   * Garante que se o componente que utiliza este hook for desmontado da tela
   * enquanto uma requisição estiver pendente, ela será cancelada para evitar memory leaks.
   */
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
