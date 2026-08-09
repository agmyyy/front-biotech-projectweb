import { z } from "zod";

export const SearchSchema = z.object({
  query: z
    .string({ message: "A pesquisa deve ser um texto válido." })
    .trim()
    .min(2, "A pesquisa deve ter pelo menos 2 caracteres.")
    .max(1000, "Limite de 1000 caracteres atingido."),
  sessionId: z.string().optional(),
});

export const CreateSessionSchema = z.object({
  title: z
    .string({ message: "O título é obrigatório." })
    .trim()
    .min(1, "O título não pode estar vazio.")
    .max(200, "Limite de 200 caracteres atingido."),
});

export const QueryResponseSchema = z.object({
  id: z.string(),
  query: z.string(),
  sessionId: z.string(),
  summary: z.string().optional(),
  suggestions: z.array(z.string()).default([]),
  justifications: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  clarifications: z.array(z.string()).default([]),
  status: z.enum(["pending", "processing", "completed", "error"]),
  createdAt: z.string(),
});

export const SearchResponseSchema = z.object({
  summary: z
    .string({ message: "O resumo deve ser um texto válido." })
    .min(1, "O resumo não pode estar vazio."),
  suggestions: z.array(z.string()).default([]),
  justifications: z.array(z.string()).default([]),
  sources: z.array(z.string()).default([]),
  clarifications: z.array(z.string()).optional(),
  sessionId: z
    .string({ message: "O ID da sessão é obrigatório." })
    .min(1, "O ID da sessão não pode estar vazio."),
});

export type SearchInput = z.infer<typeof SearchSchema>;
export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type QueryResponse = z.infer<typeof QueryResponseSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

// Compatibilidade com nomes anteriores (camelCase)
export const searchSchema = SearchSchema;
export const createSessionSchema = CreateSessionSchema;
export const searchResponseSchema = SearchResponseSchema;
