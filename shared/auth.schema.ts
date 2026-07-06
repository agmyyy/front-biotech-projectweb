import { z } from "zod";

const emailBase = z
  .email("E-mail inválido.")
  .trim()
  .lowercase()
  .min(5, "E-mail muito curto.")
  .max(100);
const passwordBase = z
  .string()
  .min(8, "A senha deve conter no mínimo 8 caracteres.")
  .max(100);

/*Cadastro*/
const UserRegister = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nome muito curto.")
      .max(60)
      .regex(/^[A-Za-zÀ-ÿ\s]+$/, "O nome deve conter apenas letras")
      .transform((val) =>
        val
          .split(" ")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(" "),
      ),
    email: emailBase,
    password: passwordBase,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
/* LogIn*/
const UserLogIn = z
  .object({
    email: emailBase,
    password: passwordBase,
  })
  .strict();

export { UserRegister, UserLogIn };

export type UserRegisterInput = z.infer<typeof UserRegister>;
export type UserLogInInput = z.infer<typeof UserLogIn>;
