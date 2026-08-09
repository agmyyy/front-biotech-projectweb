import {
  SearchSchema,
  CreateSessionSchema,
  QueryResponseSchema,
} from "../schemas/query.schema";

export const validateSearch = (data: unknown) =>
  SearchSchema.safeParse(data);

export const validateCreateSession = (data: unknown) =>
  CreateSessionSchema.safeParse(data);

export const validateQueryResponse = (data: unknown) =>
  QueryResponseSchema.safeParse(data);
