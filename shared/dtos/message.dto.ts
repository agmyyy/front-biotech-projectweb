import { searchSchema, createSessionSchema } from "../search.schema";

export const validateSearch = (data: unknown) =>
  searchSchema.safeParse(data);

export const validateCreateSession = (data: unknown) =>
  createSessionSchema.safeParse(data);
