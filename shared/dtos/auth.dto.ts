import { UserRegisterSchema, UserLogInSchema } from "../auth.schema";

export const validateRegister = (data: unknown) =>
  UserRegisterSchema.safeParse(data);

export const validateLogin = (data: unknown) =>
  UserLogInSchema.safeParse(data);
