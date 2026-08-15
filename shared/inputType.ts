import { z } from "zod";

/** SCHEMA(Base de tudo)*/
export const UserSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

/** * SCHEMA DE RESPOSTA SEGURA (Output)*/
export const UserResponseSchema = UserSchema.omit({ password: true });

// Tipo extraído para o Frontend (Sem o campo 'password')
export type UserResponse = z.infer<typeof UserResponseSchema>;

/**  TIPAGEM PARA LISTAGEM (ARRAY)*/
export const UserListSchema = z.object({
  userData: z.array(UserResponseSchema),
});

export type InputArrayAPIResponse = z.infer<typeof UserListSchema>;

/**TIPAGEM BARRA DE PESQUISA*/
export const SearchBarSchema = z.object({
  searchBar: z.string().min(1, "Digite algo para pesquisar"),
});

export type SearchBarAPIResponse = z.infer<typeof SearchBarSchema>;
