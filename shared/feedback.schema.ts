import { z } from "zod";

const Feedback = z.object({
  rating: z.number("A nota é obrigatória").int().min(1).max(5),
  searchId: z.string("ID da busca é obrigatório"),
});

export { Feedback };
export type FeeddbackInput = z.infer<typeof Feedback>;
