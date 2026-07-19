// @Shared/validation/feedback.schema.ts
import { z } from "zod";

export const Feedback = z.object({
  // Garante que o valor vindo do clique das estrelas seja um número inteiro entre 1 e 5
  rating: z
    .number({
      required_error: "A nota é obrigatória",
      invalid_type_error: "A nota deve ser um número",
    })
    .int("A nota deve ser um número inteiro")
    .min(1, "A avaliação mínima é 1 estrela")
    .max(5, "A avaliação máxima é 5 estrelas"),

  searchId: z.string({
    required_error: "ID da busca é obrigatório",
  }),
});

export type FeedbackInput = z.infer<typeof Feedback>;
