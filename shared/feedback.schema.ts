import { z } from "zod";

export const Feedback = z.object({
  rating: z
    .number({
      message: "A nota é obrigatória e deve ser um número",
    })
    .int("A nota deve ser um número inteiro")
    .min(1, "A avaliação mínima é 1 estrela")
    .max(5, "A avaliação máxima é 5 estrelas"),

  searchId: z
    .string({
      message: "ID da busca é obrigatório",
    })
    .min(1, "ID da busca não pode ser vazio"),
});

export type FeedbackInput = z.infer<typeof Feedback>;
