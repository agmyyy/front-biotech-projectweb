import { FeedbackSchema } from "../schemas/feedback.schema";

describe("FeedbackSchema", () => {
  it("aceita uma avaliação válida", () => {
    const result = FeedbackSchema.safeParse({
      rating: 4,
      searchId: "mensagem-1",
    });

    expect(result.success).toBe(true);
  });

  it("aceita os limites 1 e 5", () => {
    expect(
      FeedbackSchema.safeParse({ rating: 1, searchId: "m1" }).success,
    ).toBe(true);
    expect(
      FeedbackSchema.safeParse({ rating: 5, searchId: "m1" }).success,
    ).toBe(true);
  });

  it("rejeita nota abaixo de 1", () => {
    const result = FeedbackSchema.safeParse({ rating: 0, searchId: "m1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "A avaliação mínima é 1 estrela.",
      );
    }
  });

  it("rejeita nota acima de 5", () => {
    const result = FeedbackSchema.safeParse({ rating: 6, searchId: "m1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "A avaliação máxima é 5 estrelas.",
      );
    }
  });

  it("rejeita nota não inteira", () => {
    const result = FeedbackSchema.safeParse({ rating: 4.5, searchId: "m1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "A nota deve ser um número inteiro.",
      );
    }
  });

  it("rejeita nota ausente ou não numérica", () => {
    const semNota = FeedbackSchema.safeParse({ searchId: "m1" });
    const notaTexto = FeedbackSchema.safeParse({ rating: "4", searchId: "m1" });

    expect(semNota.success).toBe(false);
    expect(notaTexto.success).toBe(false);
    if (!semNota.success) {
      expect(semNota.error.issues[0].message).toBe(
        "A nota é obrigatória e deve ser um número.",
      );
    }
  });

  it("rejeita searchId vazio ou ausente", () => {
    const vazio = FeedbackSchema.safeParse({ rating: 4, searchId: "" });
    const ausente = FeedbackSchema.safeParse({ rating: 4 });

    expect(vazio.success).toBe(false);
    expect(ausente.success).toBe(false);
    if (!vazio.success) {
      expect(vazio.error.issues[0].message).toBe(
        "ID da busca não pode ser vazio.",
      );
    }
    if (!ausente.success) {
      expect(ausente.error.issues[0].message).toBe(
        "ID da busca é obrigatório.",
      );
    }
  });
});
