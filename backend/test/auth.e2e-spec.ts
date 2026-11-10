import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import request from "supertest";
import { AuthModule } from "../src/auth/auth.module";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { resetDb } from "./mocks/in-memory-prisma";

// Prisma falso em memória: nenhum teste toca no banco real nem no .env
jest.mock("../src/lib/prisma", () => {
  const { createInMemoryPrisma } = require("./mocks/in-memory-prisma");
  return { prisma: createInMemoryPrisma() };
});

// Segredo do JWT vem da variável de ambiente do teste, nunca do .env
process.env.JWT_SECRET = "segredo-somente-para-testes";

describe("Auth (integração)", () => {
  let app: INestApplication;
  let httpServer: ReturnType<INestApplication["getHttpServer"]>;

  // Cookie extraído do set-cookie da resposta, como o navegador faria
  function extractAuthCookie(res: request.Response): string {
    const cookies = res.headers["set-cookie"] as unknown as string[];
    const authCookie = cookies?.find((cookie) =>
      cookie.startsWith("biotech_token="),
    );
    if (!authCookie) {
      throw new Error("Resposta não definiu o cookie biotech_token");
    }
    return authCookie.split(";")[0];
  }

  const validUser = {
    name: "Maria Silva",
    email: "maria@email.com",
    password: "senha12345",
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        // Espelho do AppModule, porém sem ThrottlerModule: o rate limit é
        // infraestrutura de proteção e depender de janela de tempo de 1 min
        // tornaria o teste frágil e lento
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AuthModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mesma configuração do main.ts para o contrato das rotas ficar igual
    app.setGlobalPrefix("api");
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetDb();
  });

  describe("POST /api/auth/register", () => {
    it("cria a conta, define o cookie HttpOnly e não expõe a senha", async () => {
      const res = await request(httpServer)
        .post("/api/auth/register")
        .send(validUser)
        .expect(201);

      expect(res.body.user).toEqual({
        id: expect.any(String),
        name: "Maria Silva",
        email: "maria@email.com",
      });
      expect(res.body.user).not.toHaveProperty("password");
      expect(res.body).not.toHaveProperty("password");

      const cookie = extractAuthCookie(res);
      expect(cookie).toContain("biotech_token=");
      // O Express entrega set-cookie como array de strings
      const setCookies = res.headers["set-cookie"] as unknown as string[];
      expect(setCookies.join("; ")).toContain("HttpOnly");
    });

    it("normaliza o e-mail aceitando variações de caixa e espaços", async () => {
      const res = await request(httpServer)
        .post("/api/auth/register")
        .send({ ...validUser, email: "  MARIA@Email.COM " })
        .expect(201);

      expect(res.body.user.email).toBe("maria@email.com");
    });

    it("responde 409 para e-mail duplicado", async () => {
      await request(httpServer).post("/api/auth/register").send(validUser);

      const res = await request(httpServer)
        .post("/api/auth/register")
        .send(validUser)
        .expect(409);

      expect(res.body.message).toBe("E-mail já está em uso");
    });

    it("responde 400 com a mensagem do Zod para corpo inválido", async () => {
      const res = await request(httpServer)
        .post("/api/auth/register")
        .send({ name: "Maria", email: "maria@email.com", password: "123" })
        .expect(400);

      expect(res.body.message).toContain("Validação falhou:");
      expect(res.body.message).toContain(
        "A senha deve ter no mínimo 8 caracteres.",
      );
    });

    it("responde 400 para corpo ausente", async () => {
      const res = await request(httpServer)
        .post("/api/auth/register")
        .send({})
        .expect(400);

      expect(res.body.message).toContain("Validação falhou:");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(httpServer).post("/api/auth/register").send(validUser);
    });

    it("autentica com credenciais válidas e devolve o cookie", async () => {
      const res = await request(httpServer)
        .post("/api/auth/login")
        .send({ email: "maria@email.com", password: "senha12345" })
        .expect(201);

      expect(res.body.user).toEqual({
        id: expect.any(String),
        name: "Maria Silva",
        email: "maria@email.com",
      });
      expect(extractAuthCookie(res)).toContain("biotech_token=");
    });

    it("responde 401 para senha incorreta", async () => {
      const res = await request(httpServer)
        .post("/api/auth/login")
        .send({ email: "maria@email.com", password: "senha-errada" })
        .expect(401);

      expect(res.body.message).toBe("Credenciais inválidas");
    });

    it("responde 401 para e-mail inexistente com a mesma mensagem", async () => {
      const res = await request(httpServer)
        .post("/api/auth/login")
        .send({ email: "outra@email.com", password: "senha12345" })
        .expect(401);

      // Mesma mensagem dos dois casos: não revela quais e-mails existem
      expect(res.body.message).toBe("Credenciais inválidas");
    });

    it("normaliza o e-mail no login", async () => {
      await request(httpServer)
        .post("/api/auth/login")
        .send({ email: " MARIA@Email.COM ", password: "senha12345" })
        .expect(201);
    });
  });

  describe("GET /api/auth/profile", () => {
    it("responde 401 sem o cookie de autenticação", async () => {
      const res = await request(httpServer).get("/api/auth/profile").expect(401);

      expect(res.body.statusCode).toBe(401);
    });

    it("responde 401 para cookie inválido", async () => {
      await request(httpServer)
        .get("/api/auth/profile")
        .set("Cookie", "biotech_token=token-falso")
        .expect(401);
    });

    it("retorna o perfil do usuário logado", async () => {
      const register = await request(httpServer)
        .post("/api/auth/register")
        .send(validUser)
        .expect(201);
      const cookie = extractAuthCookie(register);

      const res = await request(httpServer)
        .get("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body).toEqual({
        id: expect.any(String),
        name: "Maria Silva",
        email: "maria@email.com",
        createdAt: expect.anything(),
      });
      expect(res.body).not.toHaveProperty("password");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("encerra a sessão e revoga o token em todos os dispositivos", async () => {
      const register = await request(httpServer)
        .post("/api/auth/register")
        .send(validUser)
        .expect(201);
      const cookie = extractAuthCookie(register);

      // O perfil funciona enquanto o token está válido
      await request(httpServer)
        .get("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(200);

      const logout = await request(httpServer)
        .post("/api/auth/logout")
        .set("Cookie", cookie)
        .expect(201);

      expect(logout.body.message).toBe(
        "Sessão encerrada em todos os dispositivos",
      );
      // O cookie é limpo pelo servidor (expires no passado)
      const clearedCookies = logout.headers["set-cookie"] as unknown as string[];
      expect(clearedCookies.join("; ")).toContain("biotech_token=;");

      // sessionVersion foi incrementado: o token antigo vale para todos os casos
      const res = await request(httpServer)
        .get("/api/auth/profile")
        .set("Cookie", cookie)
        .expect(401);

      expect(res.body.message).toBe("Sessão revogada");
    });

    it("funciona mesmo sem cookie (nenhuma sessão para revogar)", async () => {
      const res = await request(httpServer)
        .post("/api/auth/logout")
        .expect(201);

      expect(res.body.message).toBe(
        "Sessão encerrada em todos os dispositivos",
      );
    });

    it("ignora token inválido sem derrubar o logout", async () => {
      const res = await request(httpServer)
        .post("/api/auth/logout")
        .set("Cookie", "biotech_token=token-expirado")
        .expect(201);

      expect(res.body.message).toBe(
        "Sessão encerrada em todos os dispositivos",
      );
    });
  });
});
