import { renderHook, act } from "@testing-library/react";
import { useSearch } from "./use-search";
import { searchService } from "@/services/search-service";

// Mock do serviço de busca: nenhum teste faz requisição real
jest.mock("@/services/search-service", () => ({
  searchService: {
    search: jest.fn(),
    searchStream: jest.fn(),
    getHistory: jest.fn(),
  },
}));

const mockedSearchStream = searchService.searchStream as jest.Mock;

describe("useSearch", () => {
  beforeEach(() => {
    mockedSearchStream.mockReset();
  });

  it("inicia com estado limpo", () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.query).toBe("");
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.currentPhase).toBe("summary");
  });

  describe("validação da busca", () => {
    it("rejeita pesquisa com menos de 2 caracteres", async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        const response = await result.current.executeSearch("a");
        expect(response).toBeNull();
      });

      expect(result.current.error).toBe(
        "Sua pesquisa deve ter pelo menos 2 caracteres",
      );
      expect(result.current.result).toBeNull();
      expect(mockedSearchStream).not.toHaveBeenCalled();
    });

    it("rejeita pesquisa só com espaços (após trim fica curta)", async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.executeSearch("   ");
      });

      expect(result.current.error).toBe(
        "Sua pesquisa deve ter pelo menos 2 caracteres",
      );
      expect(mockedSearchStream).not.toHaveBeenCalled();
    });

    it("rejeita pesquisa acima de 1000 caracteres", async () => {
      const { result } = renderHook(() => useSearch());

      await act(async () => {
        const response = await result.current.executeSearch("a".repeat(1001));
        expect(response).toBeNull();
      });

      expect(result.current.error).toBe(
        "Sua pesquisa ultrapassa o limite de 1000 caracteres. Reduza o texto e tente novamente.",
      );
      expect(mockedSearchStream).not.toHaveBeenCalled();
    });
  });

  describe("fluxo de sucesso", () => {
    it("acumula os chunks no resultado e finaliza com phase done", async () => {
      mockedSearchStream.mockImplementation(
        async (
          _query: string,
          _sessionId: string | undefined,
          callbacks: {
            onChunk: (text: string) => void;
            onDone: (data: { sessionId: string; searchId: string }) => void;
          },
        ) => {
          callbacks.onChunk("resumo ");
          callbacks.onChunk("parcial");
          callbacks.onDone({ sessionId: "s1", searchId: "m1" });
        },
      );

      const { result } = renderHook(() => useSearch());

      let response: Awaited<ReturnType<typeof result.current.executeSearch>>;
      await act(async () => {
        response = await result.current.executeSearch("fermentação");
      });

      expect(response).toEqual({
        summary: "resumo parcial",
        sessionId: "s1",
        searchId: "m1",
      });
      expect(result.current.result).toEqual({
        summary: "resumo parcial",
        sessionId: "s1",
        searchId: "m1",
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.currentPhase).toBe("done");
      // O texto digitado vira a query limpa (trim)
      expect(mockedSearchStream).toHaveBeenCalledWith(
        "fermentação",
        undefined,
        expect.any(Object),
      );
    });

    it("passa o sessionId informado para o serviço", async () => {
      mockedSearchStream.mockImplementation(
        async (
          _query: string,
          _sessionId: string | undefined,
          callbacks: {
            onDone: (data: { sessionId: string; searchId: string }) => void;
          },
        ) => {
          callbacks.onDone({ sessionId: "s9", searchId: "m9" });
        },
      );

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.executeSearch("pergunta", "s9");
      });

      expect(mockedSearchStream).toHaveBeenCalledWith(
        "pergunta",
        "s9",
        expect.any(Object),
      );
      expect(result.current.result?.sessionId).toBe("s9");
    });

    it("fica em loading enquanto a busca está em andamento", async () => {
      let resolveStream: (() => void) | undefined;
      mockedSearchStream.mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveStream = resolve;
          }),
      );

      const { result } = renderHook(() => useSearch());

      act(() => {
        void result.current.executeSearch("pergunta");
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.currentPhase).toBe("summary");

      await act(async () => {
        resolveStream?.();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe("fluxo de erro", () => {
    it("captura a mensagem de erro do serviço", async () => {
      mockedSearchStream.mockRejectedValue(new Error("Busca indisponível"));

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        const response = await result.current.executeSearch("pergunta");
        expect(response).toBeNull();
      });

      expect(result.current.error).toBe("Busca indisponível");
      expect(result.current.result).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("usa mensagem genérica para erros que não são Error", async () => {
      mockedSearchStream.mockRejectedValue("estranho");

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.executeSearch("pergunta");
      });

      expect(result.current.error).toBe("Erro ao buscar");
    });
  });

  describe("clearSearch", () => {
    it("limpa todos os estados", async () => {
      mockedSearchStream.mockRejectedValue(new Error("falhou"));

      const { result } = renderHook(() => useSearch());

      await act(async () => {
        await result.current.executeSearch("pergunta");
      });
      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.clearSearch();
      });

      expect(result.current.query).toBe("");
      expect(result.current.result).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.currentPhase).toBe("summary");
    });
  });

  describe("setQuery", () => {
    it("atualiza o texto digitado", () => {
      const { result } = renderHook(() => useSearch());

      act(() => {
        result.current.setQuery("novo texto");
      });

      expect(result.current.query).toBe("novo texto");
    });
  });
});
