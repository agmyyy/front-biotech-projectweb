import { apiClient } from "./api-client";
import { handleUnauthorizedSession } from "./auth-session";

// Mock do módulo de sessão: em teste não há navegação real para /login
jest.mock("./auth-session", () => ({
  handleUnauthorizedSession: jest.fn(),
}));

const mockedHandleUnauthorizedSession = handleUnauthorizedSession as jest.Mock;

// jsdom não implementa fetch: o mock global substitui a rede
let globalFetch: jest.Mock;

function mockFetchResponse(
  status: number,
  body: unknown,
  ok = status >= 200 && status < 300,
) {
  globalFetch.mockResolvedValue({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  });
}

describe("apiClient", () => {
  beforeEach(() => {
    globalFetch = jest.fn();
    global.fetch = globalFetch as unknown as typeof fetch;
    mockedHandleUnauthorizedSession.mockClear();
  });

  it("retorna os dados em caso de sucesso", async () => {
    mockFetchResponse(200, { id: "s1", title: "Chat" });

    const result = await apiClient.get("/sessions");

    expect(result).toEqual({
      data: { id: "s1", title: "Chat" },
      status: 200,
    });
    expect(result.error).toBeUndefined();
  });

  it("envia credenciais include e Content-Type JSON por padrão", async () => {
    mockFetchResponse(200, {});

    await apiClient.post("/auth/login", { email: "a@b.com" });

    expect(globalFetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/login"),
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ email: "a@b.com" }),
      }),
    );
  });

  describe("respostas 401", () => {
    it("retorna a mensagem do servidor em rota pública de auth", async () => {
      mockFetchResponse(401, { message: "Credenciais inválidas" });

      const result = await apiClient.post("/auth/login", {
        email: "a@b.com",
        password: "123",
      });

      expect(result).toEqual({
        error: "Credenciais inválidas",
        status: 401,
      });
      // Login público não dispara logout: a falha é de credencial, não de sessão
      expect(mockedHandleUnauthorizedSession).not.toHaveBeenCalled();
    });

    it("une mensagens que chegam em array", async () => {
      mockFetchResponse(401, { message: ["Erro um", "Erro dois"] });

      const result = await apiClient.post("/auth/register", {});

      expect(result.error).toBe("Erro um, Erro dois");
    });

    it("usa mensagem padrão quando o corpo não tem message", async () => {
      mockFetchResponse(401, {});

      const result = await apiClient.post("/auth/login", {});

      expect(result.error).toBe("Credenciais inválidas");
    });

    it("encerra a sessão em rota protegida e avisa o usuário", async () => {
      mockFetchResponse(401, {});

      const result = await apiClient.get("/sessions");

      expect(result).toEqual({
        error: "Sessão expirada. Faça login novamente.",
        status: 401,
      });
      expect(mockedHandleUnauthorizedSession).toHaveBeenCalledTimes(1);
    });

    it("trata 401 do logout como falha pública (sem duplicar logout)", async () => {
      mockFetchResponse(401, { message: "Token inválido" });

      const result = await apiClient.post("/auth/logout", {});

      expect(result.error).toBe("Token inválido");
      expect(mockedHandleUnauthorizedSession).not.toHaveBeenCalled();
    });
  });

  describe("respostas de erro", () => {
    it("retorna a mensagem de erro do servidor", async () => {
      mockFetchResponse(500, { message: "Erro interno" });

      const result = await apiClient.get("/sessions");

      expect(result).toEqual({ error: "Erro interno", status: 500 });
    });

    it("une array de mensagens em uma string", async () => {
      mockFetchResponse(400, { message: ["Campo A", "Campo B"] });

      const result = await apiClient.post("/queries", {});

      expect(result.error).toBe("Campo A, Campo B");
    });

    it("usa o campo error quando não há message", async () => {
      mockFetchResponse(400, { error: "Requisição malformada" });

      const result = await apiClient.post("/queries", {});

      expect(result.error).toBe("Requisição malformada");
    });

    it("une o campo details quando vem em array", async () => {
      mockFetchResponse(400, { details: ["detalhe um", "detalhe dois"] });

      const result = await apiClient.post("/queries", {});

      expect(result.error).toBe("detalhe um, detalhe dois");
    });

    it("usa mensagem padrão quando o corpo é vazio", async () => {
      mockFetchResponse(500, {});

      const result = await apiClient.get("/sessions");

      expect(result.error).toBe("Erro na requisição");
    });
  });

  describe("falhas de rede", () => {
    it("converte erro de conexão em status 500", async () => {
      globalFetch.mockRejectedValue(new Error("Failed to fetch"));

      const result = await apiClient.get("/sessions");

      expect(result).toEqual({ error: "Failed to fetch", status: 500 });
    });

    it("usa mensagem genérica para erros não Error", async () => {
      globalFetch.mockRejectedValue("algo estranho");

      const result = await apiClient.get("/sessions");

      expect(result).toEqual({ error: "Erro desconhecido", status: 500 });
    });

    it("não quebra quando o corpo não é JSON válido", async () => {
      globalFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: jest.fn().mockRejectedValue(new Error("JSON inválido")),
      });

      const result = await apiClient.get("/sessions");

      expect(result.status).toBe(502);
      expect(result.error).toBe("Erro na requisição");
    });
  });

  describe("métodos HTTP", () => {
    it("get usa GET, put usa PUT, patch usa PATCH e delete usa DELETE", async () => {
      mockFetchResponse(200, {});

      await apiClient.get("/a");
      await apiClient.put("/a", { x: 1 });
      await apiClient.patch("/a", { x: 1 });
      await apiClient.delete("/a");

      const methods = globalFetch.mock.calls.map(
        (call: RequestInit[]) => call[1]?.method,
      );
      expect(methods).toEqual(["GET", "PUT", "PATCH", "DELETE"]);
    });
  });
});
