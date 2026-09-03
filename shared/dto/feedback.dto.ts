import { FeedbackSchema } from "../schemas/feedback.schema";

export const validateFeedback = (data: unknown) =>
  FeedbackSchema.safeParse(data);
