import {
  BadGatewayException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from "@nestjs/common";
import { QueriesService } from "./queries.service";
import { AuthService } from "../auth/auth.service";
import { MasService } from "../mas/mas.service";

describe("QueriesService", () => {
  let service: QueriesService;
  let authService: {
    createSession: jest.Mock;
    createMessage: jest.Mock;
    findMessagesBySession: jest.Mock;
  };
  let masService: { processQuery: jest.Mock };

  beforeEach(() => {
    authService = {
      createSession: jest.fn(),
      createMessage: jest.fn(),
      findMessagesBySession: jest.fn(),
    };
    masService = { processQuery: jest.fn() };
    service = new QueriesService(
      authService as unknown as AuthService,
      masService as unknown as MasService,
    );
    // Silencia os console.error do tratamento de falha do MAS
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("create", () => {
    const baseInput = { query: "fermentação de coco", userId: "u1" };

    it("cria uma sessão quando não há sessionId", async () => {
      authService.createSession.mockResolvedValue({ id: "s1" });
      authService.createMessage
        .mockResolvedValueOnce({ id: "m-user", createdAt: new Date() })
        .mockResolvedValueOnce({ id: "m-assistant", createdAt: new Date() });
      masService.processQuery.mockResolvedValue({
        summary: "resumo",
        suggestions: [],
        justifications: [],
        sources: [],
      });

      await service.create(baseInput);

      expect(authService.createSession).toHaveBeenCalledWith("u1");
      expect(authService.createMessage).toHaveBeenNthCalledWith(
        1,
        "u1",
        "s1",
        baseInput.query,
        "user",
      );
    });

    it("reutiliza a sessão informada sem criar outra", async () => {
      authService.createMessage
        .mockResolvedValueOnce({ id: "m-user", createdAt: new Date() })
        .mockResolvedValueOnce({ id: "m-assistant", createdAt: new Date() });
      masService.processQuery.mockResolvedValue({
        summary: "resumo",
        suggestions: [],
        justifications: [],
        sources: [],
      });

      const result = await service.create({ ...baseInput, sessionId: "s9" });

      expect(authService.createSession).not.toHaveBeenCalled();
      expect(result.sessionId).toBe("s9");
    });

    it("retorna o id da mensagem do assistente como searchId", async () => {
      const createdAt = new Date("2026-06-19T15:00:00Z");
      authService.createSession.mockResolvedValue({ id: "s1" });
      authService.createMessage
        .mockResolvedValueOnce({ id: "m-user", createdAt })
        .mockResolvedValueOnce({ id: "m-assistant", createdAt });
      masService.processQuery.mockResolvedValue({
        summary: "resumo detalhado",
        suggestions: [],
        justifications: [],
        sources: [],
      });

      const result = await service.create(baseInput);

      expect(result).toEqual({
        searchId: "m-assistant",
        sessionId: expect.any(String),
        summary: "resumo detalhado",
        status: "completed",
        createdAt,
      });
      // A resposta do assistente é gravada como segunda mensagem
      expect(authService.createMessage).toHaveBeenNthCalledWith(
        2,
        "u1",
        expect.any(String),
        "resumo detalhado",
        "assistant",
      );
    });

    it("lança 502 quando o MAS falha, mantendo a pergunta gravada", async () => {
      authService.createSession.mockResolvedValue({ id: "s1" });
      authService.createMessage.mockResolvedValue({
        id: "m-user",
        createdAt: new Date(),
      });
      masService.processQuery.mockRejectedValue(new Error("MAS fora do ar"));

      await expect(service.create(baseInput)).rejects.toThrow(
        BadGatewayException,
      );
      await expect(service.create(baseInput)).rejects.toThrow(
        "Não foi possível processar a pergunta no momento. Tente novamente.",
      );
      // A pergunta do usuário já está no histórico antes da falha
      expect(authService.createMessage).toHaveBeenNthCalledWith(
        1,
        "u1",
        expect.any(String),
        baseInput.query,
        "user",
      );
    });

    it("preserva o status original de HttpException vinda do banco", async () => {
      authService.createSession.mockResolvedValue({ id: "s1" });
      authService.createMessage.mockResolvedValue({
        id: "m-user",
        createdAt: new Date(),
      });
      masService.processQuery.mockRejectedValue(
        new InternalServerErrorException("Erro ao gravar"),
      );

      await expect(service.create(baseInput)).rejects.toThrow(
        InternalServerErrorException,
      );
      // Não deve mascarar o erro como 502
      await expect(service.create(baseInput)).rejects.not.toThrow(
        BadGatewayException,
      );
    });

    it("propaga HttpException quando a mensagem do assistente falha", async () => {
      authService.createSession.mockResolvedValue({ id: "s1" });
      authService.createMessage
        .mockResolvedValueOnce({ id: "m-user", createdAt: new Date() })
        .mockRejectedValueOnce(
          new InternalServerErrorException("Erro ao gravar"),
        );
      masService.processQuery.mockResolvedValue({
        summary: "resumo",
        suggestions: [],
        justifications: [],
        sources: [],
      });

      await expect(service.create(baseInput)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("findAll", () => {
    it("lança 400 quando sessionId não é informado", () => {
      expect(() => service.findAll("u1")).toThrow(BadRequestException);
      expect(() => service.findAll("u1")).toThrow(
        "O parâmetro sessionId é obrigatório",
      );
    });

    it("lista as mensagens da sessão", async () => {
      const messages = [{ id: "m1" }];
      authService.findMessagesBySession.mockResolvedValue(messages);

      const result = await service.findAll("u1", "s1");

      expect(result).toEqual(messages);
      expect(authService.findMessagesBySession).toHaveBeenCalledWith(
        "u1",
        "s1",
      );
    });

    it("propaga o 404 de sessão alheia", async () => {
      authService.findMessagesBySession.mockRejectedValue(
        new HttpException("Sessão não encontrada", 404),
      );

      await expect(service.findAll("u1", "s1-alheia")).rejects.toThrow(
        HttpException,
      );
    });
  });
});
