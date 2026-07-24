import { z } from "zod";

// Base reusável para E-mail
const emailBase = z
  .string({ message: "O e-mail é obrigatório." })
  .trim()
  .lowercase()
  .email("E-mail inválido.")
  .min(5, "E-mail muito curto.")
  .max(100);

// Base reusável para Senha
const passwordBase = z
  .string({ message: "A senha é obrigatória." })
  .min(8, "A senha deve conter no mínimo 8 caracteres.")
  .max(100);

/* --- CADASTRO --- */
export const UserRegisterSchema = z
  .object({
    name: z
      .string({ message: "O nome é obrigatório." })
      .trim()
      .min(2, "Nome muito curto.")
      .max(60, "Nome muito longo.")
      .regex(/^[A-Za-zÀ-ÿ\s]+$/, "O nome deve conter apenas letras")
      .transform((val) =>
        val
          .split(" ")
          .filter(Boolean)
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" "),
      ),
    email: emailBase,
    password: passwordBase,
    confirmPassword: z.string({ message: "Confirme sua senha." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

/* --- LOGIN --- */
export const UserLogInSchema = z
  .object({
    email: emailBase,
    password: passwordBase,
  })
  .strict();

/* --- USUÁRIO AUTENTICADO (Objeto de perfil/Sessão) --- */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
});

export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
export type UserLogInInput = z.infer<typeof UserLogInSchema>;
export type User = z.infer<typeof UserSchema>;
