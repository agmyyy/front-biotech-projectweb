import { chatService } from "./chat-service";
import { apiClient } from "./api-client";

// Mock do cliente HTTP: nenhum teste faz requisição real
jest.mock("./api-client", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as unknown as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  delete: jest.Mock;
};

describe("chatService", () => {
  describe("getSessions", () => {
    it("retorna a lista de sessões", async () => {
      const sessions = [{ id: "s1", title: "Chat" }];
      mockedApiClient.get.mockResolvedValue({ data: sessions, status: 200 });

      const result = await chatService.getSessions();

      expect(result).toEqual(sessions);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/sessions");
    });

    it("retorna lista vazia quando o servidor não devolve dados", async () => {
      mockedApiClient.get.mockResolvedValue({ status: 200 });

      const result = await chatService.getSessions();

      expect(result).toEqual([]);
    });

    it("lança Error quando a requisição falha", async () => {
      mockedApiClient.get.mockResolvedValue({
        error: "Erro na requisição",
        status: 500,
      });

      await expect(chatService.getSessions()).rejects.toThrow(
        "Erro na requisição",
      );
    });
  });

  describe("getSession", () => {
    it("retorna a sessão pelo id", async () => {
      const session = { id: "s1", title: "Chat" };
      mockedApiClient.get.mockResolvedValue({ data: session, status: 200 });

      const result = await chatService.getSession("s1");

      expect(result).toEqual(session);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/sessions/s1");
    });

    it("retorna null quando não há dados", async () => {
      mockedApiClient.get.mockResolvedValue({ status: 200 });

      const result = await chatService.getSession("inexistente");

      expect(result).toBeNull();
    });

    it("lança Error quando a sessão não é encontrada", async () => {
      mockedApiClient.get.mockResolvedValue({
        error: "Sessão não encontrada",
        status: 404,
      });

      await expect(chatService.getSession("x")).rejects.toThrow(
        "Sessão não encontrada",
      );
    });
  });

  describe("createSession", () => {
    it("cria a sessão com o título informado", async () => {
      const session = { id: "s1", title: "Novo chat" };
      mockedApiClient.post.mockResolvedValue({ data: session, status: 201 });

      const result = await chatService.createSession("Novo chat");

      expect(result).toEqual(session);
      expect(mockedApiClient.post).toHaveBeenCalledWith("/sessions", {
        title: "Novo chat",
      });
    });

    it("lança erro padrão quando a resposta não tem dados", async () => {
      mockedApiClient.post.mockResolvedValue({ status: 201 });

      await expect(chatService.createSession("Novo chat")).rejects.toThrow(
        "Falha ao criar sessão",
      );
    });

    it("lança Error com a mensagem do servidor", async () => {
      mockedApiClient.post.mockResolvedValue({
        error: "Limite de sessões atingido",
        status: 400,
      });

      await expect(chatService.createSession("Novo")).rejects.toThrow(
        "Limite de sessões atingido",
      );
    });
  });

  describe("updateSession", () => {
    it("envia o patch do título", async () => {
      const session = { id: "s1", title: "Renomeado" };
      mockedApiClient.patch.mockResolvedValue({ data: session, status: 200 });

      const result = await chatService.updateSession("s1", {
        title: "Renomeado",
      });

      expect(result).toEqual(session);
      expect(mockedApiClient.patch).toHaveBeenCalledWith("/sessions/s1", {
        title: "Renomeado",
      });
    });

    it("retorna null quando não há dados", async () => {
      mockedApiClient.patch.mockResolvedValue({ status: 200 });

      const result = await chatService.updateSession("s1", {});

      expect(result).toBeNull();
    });

    it("lança Error quando a sessão é alheia", async () => {
      mockedApiClient.patch.mockResolvedValue({
        error: "Sessão não encontrada",
        status: 404,
      });

      await expect(
        chatService.updateSession("s1", { title: "x" }),
      ).rejects.toThrow("Sessão não encontrada");
    });
  });

  describe("deleteSession", () => {
    it("resolve sem valor quando a exclusão dá certo", async () => {
      mockedApiClient.delete.mockResolvedValue({ status: 200 });

      await expect(chatService.deleteSession("s1")).resolves.toBeUndefined();
      expect(mockedApiClient.delete).toHaveBeenCalledWith("/sessions/s1");
    });

    it("lança Error quando a sessão é alheia", async () => {
      mockedApiClient.delete.mockResolvedValue({
        error: "Sessão não encontrada",
        status: 404,
      });

      await expect(chatService.deleteSession("s1")).rejects.toThrow(
        "Sessão não encontrada",
      );
    });
  });
});
