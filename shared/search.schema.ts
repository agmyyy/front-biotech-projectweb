import { z } from "zod";

export const searchSchema = z.object({
  query: z
    .string({ message: "A pesquisa deve ser um texto válido." })
    .trim()
    .min(2, "A pesquisa deve ter pelo menos 2 caracteres.")
    .max(1000, "Limite de 1000 caracteres atingido."),
  sessionId: z.string().optional(),
});

export type SearchInput = z.infer<typeof searchSchema>;

export const createSessionSchema = z.object({
  title: z
    .string({ message: "O título é obrigatório." })
    .trim()
    .min(1, "O título não pode estar vazio.")
    .max(200, "Limite de 200 caracteres atingido."),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
