import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ConfigModule } from "@nestjs/config";
import request from "supertest";
import { AuthModule } from "../src/auth/auth.module";
import { QueriesModule } from "../src/queries/queries.module";
import { MasService } from "../src/mas/mas.service";
import { AllExceptionsFilter } from "../src/common/filters/all-exceptions.filter";
import { resetDb } from "./mocks/in-memory-prisma";

// Prisma falso em memória: nenhum teste toca no banco real nem no .env
jest.mock("../src/lib/prisma", () => {
  const { createInMemoryPrisma } = require("./mocks/in-memory-prisma");
  return { prisma: createInMemoryPrisma() };
});

// Segredo do JWT vem da variável de ambiente do teste, nunca do .env
process.env.JWT_SECRET = "segredo-somente-para-testes";

// Resposta determinística: o MAS real tem delay aleatório de 500-2000ms
// e escolhe um resumo aleatório, o que deixaria o teste lento e instável
const fixedMasResponse = {
  summary: "Resumo fixo para o teste",
  suggestions: ["Sugestão 1"],
  justifications: ["Justificativa 1"],
  sources: ["Fonte 1"],
};

describe("Queries (integração)", () => {
  let app: INestApplication;
  let httpServer: ReturnType<INestApplication["getHttpServer"]>;

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

  // Registra um usuário e devolve o cookie de sessão
  async function registerAndLogin(): Promise<string> {
    const res = await request(httpServer)
      .post("/api/auth/register")
      .send({
        name: "Maria Silva",
        email: "maria@email.com",
        password: "senha12345",
      })
      .expect(201);
    return extractAuthCookie(res);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        // Espelho do AppModule, porém sem ThrottlerModule: o rate limit é
        // infraestrutura de proteção e depender de janela de tempo de 1 min
        // tornaria o teste frágil e lento
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        AuthModule,
        QueriesModule,
      ],
    })
      // MAS mockado: sem delay aleatório e com resumo previsível
      .overrideProvider(MasService)
      .useValue({ processQuery: jest.fn().mockResolvedValue(fixedMasResponse) })
      .compile();

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

  describe("POST /api/queries", () => {
    it("responde 401 sem o cookie de autenticação", async () => {
      await request(httpServer)
        .post("/api/queries")
        .send({ query: "fermentação de coco" })
        .expect(401);
    });

    it("responde 400 para query com menos de 2 caracteres", async () => {
      const cookie = await registerAndLogin();

      const res = await request(httpServer)
        .post("/api/queries")
        .set("Cookie", cookie)
        .send({ query: "a" })
        .expect(400);

      expect(res.body.message).toContain("Validação falhou:");
    });

    it("responde 400 para corpo sem query", async () => {
      const cookie = await registerAndLogin();

      const res = await request(httpServer)
        .post("/api/queries")
        .set("Cookie", cookie)
        .send({})
        .expect(400);

      expect(res.body.message).toContain("Validação falhou:");
    });

    it("cria a pergunta e a resposta na mesma sessão nova", async () => {
      const cookie = await registerAndLogin();

      const res = await request(httpServer)
        .post("/api/queries")
        .set("Cookie", cookie)
        .send({ query: "fermentação de coco" })
        .expect(201);

      expect(res.body).toEqual({
        searchId: expect.any(String),
        sessionId: expect.any(String),
        summary: fixedMasResponse.summary,
        status: "completed",
        createdAt: expect.anything(),
      });

      // O histórico da sessão criada contém as duas mensagens, na ordem
      const history = await request(httpServer)
        .get(`/api/queries?sessionId=${res.body.sessionId}`)
        .set("Cookie", cookie)
        .expect(200);

      expect(history.body).toHaveLength(2);
      expect(history.body[0]).toMatchObject({
        role: "user",
        content: "fermentação de coco",
      });
      expect(history.body[1]).toMatchObject({
        role: "assistant",
        content: fixedMasResponse.summary,
        rating: null,
      });
      // searchId aponta para a mensagem do assistente (usada no feedback)
      expect(res.body.searchId).toBe(history.body[1].id);
    });

    it("reutiliza a sessão informada pelo cliente", async () => {
      const cookie = await registerAndLogin();

      const first = await request(httpServer)
        .post("/api/queries")
        .set("Cookie", cookie)
        .send({ query: "primeira pergunta" })
        .expect(201);

      const second = await request(httpServer)
        .post("/api/queries")
        .set("Cookie", cookie)
        .send({
          query: "segunda pergunta",
          sessionId: first.body.sessionId,
        })
        .expect(201);

      expect(second.body.sessionId).toBe(first.body.sessionId);

      // A sessão acumula as quatro mensagens (2 perguntas + 2 respostas)
      const history = await request(httpServer)
        .get(`/api/queries?sessionId=${first.body.sessionId}`)
        .set("Cookie", cookie)
        .expect(200);

      expect(history.body).toHaveLength(4);
    });

    it("lança 502 quando o MAS falha, sem perder a pergunta", async () => {
      const cookie = await registerAndLogin();
      // Sobrescreve o mock do MAS para simular indisponibilidade
      const masService = app.get(MasService) as unknown as {
        processQuery: jest.Mock;
      };
      masService.processQuery.mockRejectedValueOnce(new Error("MAS fora"));

      const res = await request(httpServer)
        .post("/api/queries")
        .set("Cookie", cookie)
        .send({ query: "pergunta que falha" })
        .expect(502);

      expect(res.body.message).toBe(
        "Não foi possível processar a pergunta no momento. Tente novamente.",
      );
    });
  });

  describe("GET /api/queries", () => {
    it("responde 401 sem o cookie de autenticação", async () => {
      await request(httpServer).get("/api/queries?sessionId=s1").expect(401);
    });

    it("responde 400 quando sessionId não é informado", async () => {
      const cookie = await registerAndLogin();

      const res = await request(httpServer)
        .get("/api/queries")
        .set("Cookie", cookie)
        .expect(400);

      expect(res.body.message).toBe("O parâmetro sessionId é obrigatório");
    });

    it("responde 404 para sessão de outro usuário", async () => {
      const cookieOwner = await registerAndLogin();
      const created = await request(httpServer)
        .post("/api/queries")
        .set("Cookie", cookieOwner)
        .send({ query: "pergunta do dono" })
        .expect(201);

      // Outro usuário no mesmo banco em memória
      const otherUser = await request(httpServer)
        .post("/api/auth/register")
        .send({
          name: "Outro Usuário",
          email: "outro@email.com",
          password: "senha12345",
        })
        .expect(201);
      const cookieOther = extractAuthCookie(otherUser);

      const res = await request(httpServer)
        .get(`/api/queries?sessionId=${created.body.sessionId}`)
        .set("Cookie", cookieOther)
        .expect(404);

      expect(res.body.message).toBe("Sessão não encontrada");
    });

    it("retorna lista vazia para sessão sem mensagens", async () => {
      const cookie = await registerAndLogin();

      const created = await request(httpServer)
        .post("/api/sessions")
        .set("Cookie", cookie)
        .send({ title: "Sessão vazia" })
        .expect(201);

      const res = await request(httpServer)
        .get(`/api/queries?sessionId=${created.body.id}`)
        .set("Cookie", cookie)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });
});
