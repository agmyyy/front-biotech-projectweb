import { validateRegister, validateLogin } from "../dto/auth.dto";
import {
  validateSearch,
  validateCreateSession,
  validateQueryResponse,
} from "../dto/query.dto";
import { validateFeedback } from "../dto/feedback.dto";

describe("validateRegister", () => {
  it("retorna success com os dados validados", () => {
    const result = validateRegister({
      name: "Maria Silva",
      email: "maria@email.com",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
  });

  it("retorna success false com os issues do Zod", () => {
    const result = validateRegister({ name: "M", email: "invalido" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("trata input que não é objeto", () => {
    expect(validateRegister(null).success).toBe(false);
    expect(validateRegister("string").success).toBe(false);
    expect(validateRegister(undefined).success).toBe(false);
  });
});

describe("validateLogin", () => {
  it("retorna success com credenciais válidas", () => {
    const result = validateLogin({
      email: "maria@email.com",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita login sem senha", () => {
    expect(validateLogin({ email: "maria@email.com" }).success).toBe(false);
  });
});

describe("validateSearch", () => {
  it("retorna success com busca válida", () => {
    expect(validateSearch({ query: "fermentação" }).success).toBe(true);
  });

  it("rejeita busca vazia", () => {
    expect(validateSearch({ query: "" }).success).toBe(false);
  });
});

describe("validateCreateSession", () => {
  it("retorna success com título válido", () => {
    expect(validateCreateSession({ title: "Nova conversa" }).success).toBe(
      true,
    );
  });

  it("rejeita sessão sem título", () => {
    expect(validateCreateSession({}).success).toBe(false);
  });
});

describe("validateQueryResponse", () => {
  it("retorna success com resposta completa", () => {
    const result = validateQueryResponse({
      id: "1",
      query: "fermentação",
      sessionId: "sessão-1",
      status: "completed",
      createdAt: "2026-06-19T15:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita status inválido", () => {
    const result = validateQueryResponse({
      id: "1",
      query: "fermentação",
      sessionId: "sessão-1",
      status: "boom",
      createdAt: "2026-06-19T15:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});

describe("validateFeedback", () => {
  it("retorna success com avaliação válida", () => {
    expect(
      validateFeedback({ rating: 5, searchId: "mensagem-1" }).success,
    ).toBe(true);
  });

  it("rejeita avaliação fora do intervalo", () => {
    expect(validateFeedback({ rating: 9, searchId: "m1" }).success).toBe(false);
  });
});
