import { UserRegisterSchema, UserLoginSchema } from "../schemas/auth.schema";

export const validateRegister = (data: unknown) =>
  UserRegisterSchema.safeParse(data);

export const validateLogin = (data: unknown) =>
  UserLoginSchema.safeParse(data);
