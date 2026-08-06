import { z } from "zod";

export const searchResponseSchema = z.object({
  answer: z.string({ message: "A resposta deve ser um texto válido." }),
  sources: z.array(z.string()).optional(),
  sessionId: z.string({ message: "O ID da sessão é obrigatório." }),
});

export type SearchResponseOutput = z.infer<typeof searchResponseSchema>;
