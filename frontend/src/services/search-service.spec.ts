import { searchService } from "./search-service";
import { apiClient } from "./api-client";
import { handleUnauthorizedSession } from "./auth-session";

// Mocks do cliente HTTP e da sessão: nenhum teste navega de verdade
jest.mock("./api-client", () => ({
  apiClient: { get: jest.fn(), post: jest.fn() },
}));
jest.mock("./auth-session", () => ({
  handleUnauthorizedSession: jest.fn(),
}));

const mockedApiClient = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
};
const mockedHandleUnauthorizedSession = handleUnauthorizedSession as jest.Mock;
let globalFetch: jest.Mock;

describe("searchService", () => {
  beforeEach(() => {
    globalFetch = jest.fn();
    global.fetch = globalFetch as unknown as typeof fetch;
    mockedHandleUnauthorizedSession.mockClear();
  });

  describe("search", () => {
    it("retorna a resposta estruturada", async () => {
      const response = { summary: "resumo", sessionId: "s1" };
      mockedApiClient.post.mockResolvedValue({ data: response, status: 201 });

      const result = await searchService.search({
        query: "fermentação",
      });

      expect(result).toEqual(response);
      expect(mockedApiClient.post).toHaveBeenCalledWith("/queries", {
        query: "fermentação",
      });
    });

    it("lança Error quando a requisição falha", async () => {
      mockedApiClient.post.mockResolvedValue({
        error: "Erro na requisição",
        status: 500,
      });

      await expect(searchService.search({ query: "x" })).rejects.toThrow(
        "Erro na requisição",
      );
    });

    it("lança erro padrão quando a resposta não tem dados", async () => {
      mockedApiClient.post.mockResolvedValue({ status: 201 });

      await expect(searchService.search({ query: "x" })).rejects.toThrow(
        "Resposta inválida da API",
      );
    });
  });

  describe("searchStream", () => {
    function mockStreamResponse(body: unknown, status = 200) {
      globalFetch.mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: jest.fn().mockResolvedValue(body),
      });
    }

    it("repassa o resumo em chunks e finaliza com sessionId e searchId", async () => {
      mockStreamResponse({
        summary: "um dois três",
        sessionId: "s1",
        searchId: "m2",
      });
      const onChunk = jest.fn();
      const onDone = jest.fn();

      await searchService.searchStream("pergunta", undefined, {
        onChunk,
        onDone,
      });

      // Cada palavra vira um chunk com espaçamento preservado
      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, "um ");
      expect(onChunk).toHaveBeenNthCalledWith(2, "dois ");
      expect(onChunk).toHaveBeenNthCalledWith(3, "três");
      expect(onDone).toHaveBeenCalledWith({ sessionId: "s1", searchId: "m2" });
      expect(globalFetch).toHaveBeenCalledWith(
        expect.stringContaining("/queries"),
        expect.objectContaining({
          method: "POST",
          credentials: "include",
        }),
      );
    });

    it("envia o sessionId informado no corpo", async () => {
      mockStreamResponse({ summary: "ok", sessionId: "s1", searchId: "m1" });

      await searchService.searchStream("pergunta", "s9", {
        onChunk: jest.fn(),
        onDone: jest.fn(),
      });

      const body = JSON.parse(
        globalFetch.mock.calls[0][1].body as string,
      ) as { query: string; sessionId: string };
      expect(body).toEqual({ query: "pergunta", sessionId: "s9" });
    });

    it("encerra a sessão e lança erro em caso de 401", async () => {
      mockStreamResponse({ message: "Token inválido" }, 401);

      await expect(
        searchService.searchStream("pergunta", undefined, {
          onChunk: jest.fn(),
          onDone: jest.fn(),
        }),
      ).rejects.toThrow("Sessão expirada. Faça login novamente.");
      expect(mockedHandleUnauthorizedSession).toHaveBeenCalledTimes(1);
    });

    it("usa a mensagem do servidor quando a busca falha", async () => {
      mockStreamResponse({ message: "Busca indisponível" }, 500);

      await expect(
        searchService.searchStream("pergunta", undefined, {
          onChunk: jest.fn(),
          onDone: jest.fn(),
        }),
      ).rejects.toThrow("Busca indisponível");
    });

    it("usa o campo error do corpo quando não há message", async () => {
      mockStreamResponse({ error: "Erro no MAS" }, 502);

      await expect(
        searchService.searchStream("pergunta", undefined, {
          onChunk: jest.fn(),
          onDone: jest.fn(),
        }),
      ).rejects.toThrow("Erro no MAS");
    });

    it("usa mensagem padrão quando o corpo não é JSON", async () => {
      globalFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockRejectedValue(new Error("JSON inválido")),
      });

      await expect(
        searchService.searchStream("pergunta", undefined, {
          onChunk: jest.fn(),
          onDone: jest.fn(),
        }),
      ).rejects.toThrow("Erro na requisição de busca");
    });

    it("propaga erro de rede", async () => {
      globalFetch.mockRejectedValue(new Error("Failed to fetch"));

      await expect(
        searchService.searchStream("pergunta", undefined, {
          onChunk: jest.fn(),
          onDone: jest.fn(),
        }),
      ).rejects.toThrow("Failed to fetch");
    });

    it("chama onDone com strings vazias quando o corpo não tem ids", async () => {
      mockStreamResponse({});

      const onDone = jest.fn();
      await searchService.searchStream("pergunta", undefined, {
        onChunk: jest.fn(),
        onDone,
      });

      expect(onDone).toHaveBeenCalledWith({ sessionId: "", searchId: "" });
    });

    it("não chama onChunk quando não há resumo", async () => {
      mockStreamResponse({ sessionId: "s1", searchId: "m1" });
      const onChunk = jest.fn();
      const onDone = jest.fn();

      await searchService.searchStream("pergunta", undefined, {
        onChunk,
        onDone,
      });

      expect(onChunk).not.toHaveBeenCalled();
      expect(onDone).toHaveBeenCalledTimes(1);
    });
  });

  describe("getHistory", () => {
    it("retorna o histórico da sessão", async () => {
      const history = [{ summary: "resumo", sessionId: "s1" }];
      mockedApiClient.get.mockResolvedValue({ data: history, status: 200 });

      const result = await searchService.getHistory("s1");

      expect(result).toEqual(history);
      expect(mockedApiClient.get).toHaveBeenCalledWith(
        "/queries?sessionId=s1",
      );
    });

    it("retorna lista vazia quando não há dados", async () => {
      mockedApiClient.get.mockResolvedValue({ status: 200 });

      const result = await searchService.getHistory("s1");

      expect(result).toEqual([]);
    });

    it("lança Error quando a requisição falha", async () => {
      mockedApiClient.get.mockResolvedValue({
        error: "Erro na requisição",
        status: 500,
      });

      await expect(searchService.getHistory("s1")).rejects.toThrow(
        "Erro na requisição",
      );
    });
  });
});
