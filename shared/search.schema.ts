import { z } from "zod";

export const searchSchema = z.object({
  content: z
    .string({
      message: "A mensagem deve ser um texto válido.",
    })
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(1000, "Limite de 1000 caracteres atingido."),
});

export type SearchInput = z.infer<typeof searchSchema>;
