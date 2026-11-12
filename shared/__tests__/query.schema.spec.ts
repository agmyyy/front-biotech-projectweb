import {
  SearchSchema,
  CreateSessionSchema,
  UpdateSessionSchema,
  QueryResponseSchema,
  SearchResponseSchema,
} from "../schemas/query.schema";

describe("SearchSchema", () => {
  it("aceita uma busca válida", () => {
    const result = SearchSchema.safeParse({ query: "fermentação de coco" });

    expect(result.success).toBe(true);
  });

  it("faz trim da busca", () => {
    const result = SearchSchema.safeParse({ query: "  óleo de argan  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("óleo de argan");
    }
  });

  it("aceita sessionId opcional", () => {
    const result = SearchSchema.safeParse({
      query: "fermentação",
      sessionId: "sessão-1",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita busca com menos de 2 caracteres", () => {
    const result = SearchSchema.safeParse({ query: "a" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "A pesquisa deve ter pelo menos 2 caracteres.",
      );
    }
  });

  it("rejeita busca acima de 1000 caracteres", () => {
    const result = SearchSchema.safeParse({ query: "a".repeat(1001) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Limite de 1000 caracteres atingido.",
      );
    }
  });

  it("rejeita busca ausente", () => {
    const result = SearchSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "A pesquisa deve ser um texto válido.",
      );
    }
  });
});

describe("CreateSessionSchema", () => {
  it("aceita título válido", () => {
    const result = CreateSessionSchema.safeParse({ title: "Nova conversa" });

    expect(result.success).toBe(true);
  });

  it("faz trim do título", () => {
    const result = CreateSessionSchema.safeParse({ title: "  Meu chat  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Meu chat");
    }
  });

  it("rejeita título vazio", () => {
    const result = CreateSessionSchema.safeParse({ title: "   " });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "O título não pode estar vazio.",
      );
    }
  });

  it("rejeita título acima de 200 caracteres", () => {
    const result = CreateSessionSchema.safeParse({ title: "a".repeat(201) });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "Limite de 200 caracteres atingido.",
      );
    }
  });

  it("aceita título com exatamente 200 caracteres", () => {
    const result = CreateSessionSchema.safeParse({ title: "a".repeat(200) });

    expect(result.success).toBe(true);
  });
});

describe("UpdateSessionSchema", () => {
  it("valida o mesmo contrato do CreateSessionSchema", () => {
    expect(UpdateSessionSchema.safeParse({ title: "Renomeado" }).success).toBe(
      true,
    );
    expect(UpdateSessionSchema.safeParse({ title: "" }).success).toBe(false);
    // Sem title o corpo null quebrava o handler com 500 antes da validação
    expect(UpdateSessionSchema.safeParse(null).success).toBe(false);
    expect(UpdateSessionSchema.safeParse({}).success).toBe(false);
  });
});

describe("QueryResponseSchema", () => {
  it("aceita uma resposta com status válido", () => {
    const result = QueryResponseSchema.safeParse({
      id: "1",
      query: "fermentação",
      sessionId: "sessão-1",
      summary: "resumo",
      status: "completed",
      createdAt: "2026-06-19T15:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("aceita status sem summary (opcional)", () => {
    const result = QueryResponseSchema.safeParse({
      id: "1",
      query: "fermentação",
      sessionId: "sessão-1",
      status: "pending",
      createdAt: "2026-06-19T15:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita status fora do enum", () => {
    const result = QueryResponseSchema.safeParse({
      id: "1",
      query: "fermentação",
      sessionId: "sessão-1",
      status: "qualquer-coisa",
      createdAt: "2026-06-19T15:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});

describe("SearchResponseSchema", () => {
  it("aceita uma resposta válida", () => {
    const result = SearchResponseSchema.safeParse({
      summary: "resumo da busca",
      sessionId: "sessão-1",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita summary vazio", () => {
    const result = SearchResponseSchema.safeParse({
      summary: "",
      sessionId: "sessão-1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "O resumo não pode estar vazio.",
      );
    }
  });

  it("rejeita sessionId vazio", () => {
    const result = SearchResponseSchema.safeParse({
      summary: "resumo",
      sessionId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "O ID da sessão não pode estar vazio.",
      );
    }
  });
});
