import { z } from "zod";

export const searchResponseSchema = z.object({
  summary: z.string({ message: "O resumo deve ser um texto válido." }),
  suggestions: z.array(z.string()).default([]),
  justifications: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  clarifications: z.array(z.string()).optional(),
  sessionId: z.string({ message: "O ID da sessão é obrigatório." }),
});

export type SearchResponseOutput = z.infer<typeof searchResponseSchema>;
