import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { scryptSync, randomBytes } from "node:crypto";
import { AuthService } from "./auth.service";
import { prisma } from "../lib/prisma";

// Mock do módulo: o Prisma é singleton importado diretamente (não é provider
// do Nest), então o mock de módulo é o caminho sem refactor do código
jest.mock("../lib/prisma", () => {
  const prismaMock = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    rating: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  // $transaction recebe o próprio mock como "tx", simulando a transação do Prisma
  prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));

  return { prisma: prismaMock };
});

const mockedPrisma = prisma as unknown as {
  user: { create: jest.Mock; findUnique: jest.Mock; updateMany: jest.Mock };
  session: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  message: { create: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock };
  rating: { create: jest.Mock };
  $transaction: jest.Mock;
};

// Gera um hash real no formato versionado usado pelo AuthService
function buildPasswordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString("hex")}`;
}

describe("AuthService", () => {
  let service: AuthService;
  let jwtService: { sign: jest.Mock; verifyAsync: jest.Mock };

  beforeEach(() => {
    jwtService = {
      sign: jest.fn().mockReturnValue("token-jwt"),
      verifyAsync: jest.fn(),
    };
    service = new AuthService(jwtService as unknown as JwtService);
  });

  describe("register", () => {
    const validInput = {
      name: "Maria Silva",
      email: " MARIA@Exemplo.COM ",
      password: "senha12345",
    };

    it("normaliza o e-mail antes de salvar", async () => {
      mockedPrisma.user.create.mockResolvedValue({
        id: "u1",
        name: "Maria Silva",
        email: "maria@exemplo.com",
        sessionVersion: 0,
      });

      await service.register(validInput);

      expect(mockedPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: "maria@exemplo.com" }),
        }),
      );
    });

    it("nunca grava a senha em texto puro no banco", async () => {
      mockedPrisma.user.create.mockResolvedValue({
        id: "u1",
        name: "Maria Silva",
        email: "maria@exemplo.com",
        sessionVersion: 0,
      });

      await service.register(validInput);

      const savedPassword = mockedPrisma.user.create.mock.calls[0][0].data
        .password as string;
      expect(savedPassword).not.toBe(validInput.password);
      expect(savedPassword).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
    });

    it("retorna o usuário sem a senha e o token", async () => {
      mockedPrisma.user.create.mockResolvedValue({
        id: "u1",
        name: "Maria Silva",
        email: "maria@exemplo.com",
        sessionVersion: 3,
      });

      const result = await service.register(validInput);

      expect(result.user).toEqual({
        id: "u1",
        name: "Maria Silva",
        email: "maria@exemplo.com",
      });
      expect(result.user).not.toHaveProperty("password");
      expect(result.token).toBe("token-jwt");
      // O token carrega a versão de sessão para permitir revogação global
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: "u1", ver: 3 });
    });

    it("lança 409 quando o e-mail já está em uso (P2002)", async () => {
      mockedPrisma.user.create.mockRejectedValue({ code: "P2002" });

      await expect(service.register(validInput)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(validInput)).rejects.toThrow(
        "E-mail já está em uso",
      );
    });

    it("lança 500 para outros erros de banco", async () => {
      mockedPrisma.user.create.mockRejectedValue(new Error("db down"));

      await expect(service.register(validInput)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("login", () => {
    const loginInput = { email: "maria@email.com", password: "senha12345" };

    it("lança 401 quando o usuário não existe", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginInput)).rejects.toThrow(
        "Credenciais inválidas",
      );
    });

    it("normaliza o e-mail na busca", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await service.login({ ...loginInput, email: "  MARIA@Email.COM " }).catch(
        () => undefined,
      );

      expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: "maria@email.com" } }),
      );
    });

    it("lança 401 quando a senha está errada", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        name: "Maria",
        email: "maria@email.com",
        password: buildPasswordHash("senha-correta"),
        sessionVersion: 0,
      });

      await expect(service.login(loginInput)).rejects.toThrow(
        "Credenciais inválidas",
      );
      // Nunca revela se o e-mail existe: mesma mensagem nos dois casos
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it("aceita senha correta e retorna token", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        name: "Maria",
        email: "maria@email.com",
        password: buildPasswordHash("senha12345"),
        sessionVersion: 2,
      });

      const result = await service.login(loginInput);

      expect(result.user).toEqual({
        id: "u1",
        name: "Maria",
        email: "maria@email.com",
      });
      expect(result.token).toBe("token-jwt");
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: "u1", ver: 2 });
    });

    it("lança 401 para hash antigo em formato inválido", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        name: "Maria",
        email: "maria@email.com",
        password: "formato-antigo-invalido",
        sessionVersion: 0,
      });

      await expect(service.login(loginInput)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("lança 500 quando o banco falha na busca", async () => {
      mockedPrisma.user.findUnique.mockRejectedValue(new Error("db down"));

      await expect(service.login(loginInput)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("getProfile", () => {
    it("retorna o perfil sem a senha", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        name: "Maria",
        email: "maria@email.com",
        createdAt: new Date("2026-01-01"),
      });

      const profile = await service.getProfile("u1");

      expect(profile).toEqual({
        id: "u1",
        name: "Maria",
        email: "maria@email.com",
        createdAt: new Date("2026-01-01"),
      });
      expect(profile).not.toHaveProperty("password");
    });

    it("lança 401 quando o usuário não existe", async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile("inexistente")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("createSession", () => {
    it("usa o título padrão quando o texto é vazio", async () => {
      mockedPrisma.session.create.mockResolvedValue({ id: "s1" });

      await service.createSession("u1", "");

      expect(mockedPrisma.session.create).toHaveBeenCalledWith({
        data: { title: "Nova conversa", userId: "u1" },
      });
    });

    it("faz trim e usa o título informado", async () => {
      mockedPrisma.session.create.mockResolvedValue({ id: "s1" });

      await service.createSession("u1", "  Meu chat  ");

      expect(mockedPrisma.session.create).toHaveBeenCalledWith({
        data: { title: "Meu chat", userId: "u1" },
      });
    });

    it("trunca títulos acima de 200 caracteres", async () => {
      mockedPrisma.session.create.mockResolvedValue({ id: "s1" });

      await service.createSession("u1", "a".repeat(300));

      const savedTitle = mockedPrisma.session.create.mock.calls[0][0].data
        .title as string;
      expect(savedTitle).toHaveLength(200);
    });

    it("lança 500 quando o banco falha", async () => {
      mockedPrisma.session.create.mockRejectedValue(new Error("db down"));

      await expect(service.createSession("u1")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("createMessage", () => {
    it("rejeita role inválida", async () => {
      await expect(
        service.createMessage("u1", "s1", "olá", "system"),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createMessage("u1", "s1", "olá", "system"),
      ).rejects.toThrow("Role inválida");
    });

    it("lança 404 quando a sessão não pertence ao usuário", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.createMessage("u1", "s1", "olá", "user"),
      ).rejects.toThrow(NotFoundException);
    });

    it("usa a primeira mensagem do usuário como título da sessão", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue({ id: "s1" });
      // Sessão ainda com o título padrão: deve ser sobrescrito
      mockedPrisma.session.findUnique.mockResolvedValue({
        title: "Nova conversa",
      });
      mockedPrisma.session.update.mockResolvedValue({});
      mockedPrisma.message.create.mockResolvedValue({
        id: "m1",
        content: "Qual o melhor óleo?",
        role: "user",
        sessionId: "s1",
      });

      await service.createMessage("u1", "s1", "Qual o melhor óleo?", "user");

      expect(mockedPrisma.session.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: "Qual o melhor óleo?" }),
        }),
      );
    });

    it("não altera o título quando a sessão já foi nomeada", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue({ id: "s1" });
      mockedPrisma.session.findUnique.mockResolvedValue({
        title: "Meu chat",
      });
      mockedPrisma.session.update.mockResolvedValue({});
      mockedPrisma.message.create.mockResolvedValue({
        id: "m1",
        content: "segunda pergunta",
        role: "user",
        sessionId: "s1",
      });

      await service.createMessage("u1", "s1", "segunda pergunta", "user");

      const updateData = mockedPrisma.session.update.mock.calls[0][0].data;
      expect(updateData).not.toHaveProperty("title");
      // updatedAt é sempre atualizado para ordenar a listagem por atividade
      expect(updateData).toHaveProperty("updatedAt");
    });

    it("não usa mensagem do assistente como título", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue({ id: "s1" });
      mockedPrisma.session.findUnique.mockResolvedValue({
        title: "Nova conversa",
      });
      mockedPrisma.session.update.mockResolvedValue({});
      mockedPrisma.message.create.mockResolvedValue({
        id: "m2",
        content: "resumo da resposta",
        role: "assistant",
        sessionId: "s1",
      });

      await service.createMessage(
        "u1",
        "s1",
        "resumo da resposta",
        "assistant",
      );

      const updateData = mockedPrisma.session.update.mock.calls[0][0].data;
      expect(updateData).not.toHaveProperty("title");
    });
  });

  describe("createRating", () => {
    it("rejeita nota fora do intervalo 1 a 5", async () => {
      await expect(service.createRating("u1", 0, "m1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createRating("u1", 6, "m1")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createRating("u1", 4.5, "m1")).rejects.toThrow(
        "A nota deve ser um número inteiro entre 1 e 5",
      );
    });

    it("lança 404 quando a mensagem não pertence ao usuário", async () => {
      mockedPrisma.message.findFirst.mockResolvedValue(null);

      await expect(service.createRating("u1", 5, "m1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("só permite avaliar mensagens do assistente", async () => {
      mockedPrisma.message.findFirst.mockResolvedValue({
        id: "m1",
        role: "user",
        content: "pergunta",
        sessionId: "s1",
        createdAt: new Date(),
      });

      await expect(service.createRating("u1", 5, "m1")).rejects.toThrow(
        "Apenas mensagens do assistente podem ser avaliadas",
      );
    });

    it("cria a avaliação para mensagem do assistente", async () => {
      mockedPrisma.message.findFirst.mockResolvedValue({
        id: "m1",
        role: "assistant",
        content: "resposta",
        sessionId: "s1",
        createdAt: new Date(),
      });
      mockedPrisma.rating.create.mockResolvedValue({ id: "r1", score: 4 });

      const result = await service.createRating("u1", 4, "m1");

      expect(result).toEqual({ id: "r1", score: 4 });
      expect(mockedPrisma.rating.create).toHaveBeenCalledWith({
        data: { score: 4, messageId: "m1" },
      });
    });

    it("lança 409 quando a mensagem já foi avaliada (P2002)", async () => {
      mockedPrisma.message.findFirst.mockResolvedValue({
        id: "m1",
        role: "assistant",
        content: "resposta",
        sessionId: "s1",
        createdAt: new Date(),
      });
      mockedPrisma.rating.create.mockRejectedValue({ code: "P2002" });

      await expect(service.createRating("u1", 4, "m1")).rejects.toThrow(
        ConflictException,
      );
      await expect(service.createRating("u1", 4, "m1")).rejects.toThrow(
        "Esta mensagem já foi avaliada",
      );
    });
  });

  describe("findOwnedSession", () => {
    it("retorna a sessão quando pertence ao usuário", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue({ id: "s1" });

      const session = await service.findOwnedSession("u1", "s1");

      expect(session).toEqual({ id: "s1" });
      expect(mockedPrisma.session.findFirst).toHaveBeenCalledWith({
        where: { id: "s1", userId: "u1" },
        select: { id: true },
      });
    });

    it("lança 404 para sessão de outro usuário (sem revelar existência)", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue(null);

      await expect(service.findOwnedSession("u1", "s1")).rejects.toThrow(
        "Sessão não encontrada",
      );
    });
  });

  describe("findOwnedMessage", () => {
    it("lança 404 para mensagem de outro usuário", async () => {
      mockedPrisma.message.findFirst.mockResolvedValue(null);

      await expect(service.findOwnedMessage("u1", "m1")).rejects.toThrow(
        "Mensagem não encontrada",
      );
    });
  });

  describe("revokeToken", () => {
    it("não faz nada com token nulo", async () => {
      await service.revokeToken(null);

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(mockedPrisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("ignora token inválido ou expirado silenciosamente", async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error("jwt inválido"));

      await expect(service.revokeToken("token-lixo")).resolves.toBeUndefined();
      expect(mockedPrisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("ignora token sem subject", async () => {
      jwtService.verifyAsync.mockResolvedValue({ ver: 1 });

      await service.revokeToken("token-sem-sub");

      expect(mockedPrisma.user.updateMany).not.toHaveBeenCalled();
    });

    it("incrementa sessionVersion para revogar as sessões ativas", async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: "u1", ver: 2 });
      mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeToken("token-válido");

      expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith({
        where: { id: "u1", sessionVersion: 2 },
        data: { sessionVersion: { increment: 1 } },
      });
    });

    it("trata token antigo sem ver como versão zero", async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: "u1" });
      mockedPrisma.user.updateMany.mockResolvedValue({ count: 1 });

      await service.revokeToken("token-antigo");

      expect(mockedPrisma.user.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "u1", sessionVersion: 0 },
        }),
      );
    });

    it("lança 500 quando o banco falha na revogação", async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: "u1", ver: 1 });
      mockedPrisma.user.updateMany.mockRejectedValue(new Error("db down"));

      await expect(service.revokeToken("token")).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe("findMessagesBySession", () => {
    it("lista as mensagens da sessão com as avaliações", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue({ id: "s1" });
      mockedPrisma.message.findMany.mockResolvedValue([]);

      const messages = await service.findMessagesBySession("u1", "s1");

      expect(messages).toEqual([]);
      expect(mockedPrisma.message.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sessionId: "s1" },
          include: { rating: true },
        }),
      );
    });

    it("lança 404 antes de listar quando a sessão é alheia", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.findMessagesBySession("u1", "s1"),
      ).rejects.toThrow(NotFoundException);
      expect(mockedPrisma.message.findMany).not.toHaveBeenCalled();
    });
  });

  describe("deleteSession", () => {
    it("exclui a sessão após checar a posse", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue({ id: "s1" });
      mockedPrisma.session.delete.mockResolvedValue({});

      await service.deleteSession("u1", "s1");

      expect(mockedPrisma.session.delete).toHaveBeenCalledWith({
        where: { id: "s1" },
      });
    });

    it("lança 404 para sessão de outro usuário sem excluir nada", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue(null);

      await expect(service.deleteSession("u1", "s1")).rejects.toThrow(
        NotFoundException,
      );
      expect(mockedPrisma.session.delete).not.toHaveBeenCalled();
    });
  });

  describe("updateSessionTitle", () => {
    it("atualiza o título após checar a posse", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue({ id: "s1" });
      mockedPrisma.session.update.mockResolvedValue({});

      await service.updateSessionTitle("u1", "s1", "  Novo título  ");

      expect(mockedPrisma.session.update).toHaveBeenCalledWith({
        where: { id: "s1" },
        data: { title: "Novo título" },
      });
    });

    it("lança 404 para sessão de outro usuário", async () => {
      mockedPrisma.session.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSessionTitle("u1", "s1", "Título"),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
