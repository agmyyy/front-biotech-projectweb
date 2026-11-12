import { authService } from "./auth-service";
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
};

describe("authService", () => {
  describe("register", () => {
    it("retorna o usuário em caso de sucesso", async () => {
      const user = { id: "u1", name: "Maria", email: "maria@email.com" };
      mockedApiClient.post.mockResolvedValue({ data: { user }, status: 201 });

      const result = await authService.register({
        name: "Maria",
        email: "maria@email.com",
        password: "senha12345",
      });

      expect(result).toEqual({ user });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/register", {
        name: "Maria",
        email: "maria@email.com",
        password: "senha12345",
      });
    });

    it("lança Error com a mensagem do servidor quando há erro", async () => {
      mockedApiClient.post.mockResolvedValue({
        error: "E-mail já está em uso",
        status: 409,
      });

      await expect(
        authService.register({
          name: "Maria",
          email: "maria@email.com",
          password: "senha12345",
        }),
      ).rejects.toThrow("E-mail já está em uso");
    });

    it("lança erro padrão quando a resposta não tem dados", async () => {
      mockedApiClient.post.mockResolvedValue({ status: 201 });

      await expect(
        authService.register({
          name: "Maria",
          email: "maria@email.com",
          password: "senha12345",
        }),
      ).rejects.toThrow("Falha ao criar conta");
    });
  });

  describe("login", () => {
    it("retorna o usuário em caso de sucesso", async () => {
      const user = { id: "u1", name: "Maria", email: "maria@email.com" };
      mockedApiClient.post.mockResolvedValue({ data: { user }, status: 201 });

      const result = await authService.login({
        email: "maria@email.com",
        password: "senha12345",
      });

      expect(result).toEqual({ user });
      expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/login", {
        email: "maria@email.com",
        password: "senha12345",
      });
    });

    it("lança Error com as credenciais inválidas", async () => {
      mockedApiClient.post.mockResolvedValue({
        error: "Credenciais inválidas",
        status: 401,
      });

      await expect(
        authService.login({
          email: "maria@email.com",
          password: "errada",
        }),
      ).rejects.toThrow("Credenciais inválidas");
    });

    it("lança erro padrão quando a resposta não tem dados", async () => {
      mockedApiClient.post.mockResolvedValue({ status: 201 });

      await expect(
        authService.login({
          email: "maria@email.com",
          password: "senha12345",
        }),
      ).rejects.toThrow("Falha ao fazer login");
    });
  });

  describe("getProfile", () => {
    it("retorna o usuário logado", async () => {
      const user = { id: "u1", name: "Maria", email: "maria@email.com" };
      mockedApiClient.get.mockResolvedValue({ data: user, status: 200 });

      const result = await authService.getProfile();

      expect(result).toEqual(user);
      expect(mockedApiClient.get).toHaveBeenCalledWith("/auth/profile");
    });

    it("lança Error quando a sessão expirou", async () => {
      mockedApiClient.get.mockResolvedValue({
        error: "Sessão expirada. Faça login novamente.",
        status: 401,
      });

      await expect(authService.getProfile()).rejects.toThrow(
        "Sessão expirada. Faça login novamente.",
      );
    });

    it("lança erro padrão quando a resposta não tem dados", async () => {
      mockedApiClient.get.mockResolvedValue({ status: 200 });

      await expect(authService.getProfile()).rejects.toThrow(
        "Usuário não encontrado",
      );
    });
  });

  describe("logout", () => {
    it("retorna true e limpa o localStorage quando o servidor confirma", async () => {
      mockedApiClient.post.mockResolvedValue({ status: 201 });
      localStorage.setItem("biotech_user", "u1");
      localStorage.setItem("biotech_token", "token");

      const result = await authService.logout();

      expect(result).toBe(true);
      expect(mockedApiClient.post).toHaveBeenCalledWith("/auth/logout", {});
      expect(localStorage.getItem("biotech_user")).toBeNull();
      expect(localStorage.getItem("biotech_token")).toBeNull();
    });

    it("retorna false quando o servidor não confirma o logout", async () => {
      mockedApiClient.post.mockResolvedValue({
        error: "Token inválido",
        status: 401,
      });
      localStorage.setItem("biotech_user", "u1");

      const result = await authService.logout();

      // Sem confirmação o cookie continuaria válido: o front mantém o estado
      expect(result).toBe(false);
      expect(localStorage.getItem("biotech_user")).toBe("u1");
    });
  });
});
