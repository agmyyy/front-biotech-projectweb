import { z } from "zod";

export const searchResponseSchema = z.object({
  searchId: z.string({
    message: "O ID da busca é obrigatório.",
  }),
  answer: z.string({
    message: "A resposta deve ser um texto válido.",
  }),
  createdAt: z.string().optional(),
});

export type SearchResponse = z.infer<typeof searchResponseSchema>;
