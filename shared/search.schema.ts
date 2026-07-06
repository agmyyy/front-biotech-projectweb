import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const SearchInput = z.object({
  content: z
    .string()
    .trim()
    .min(1, "A mensagem não pode estar vazia.")
    .max(1000, "Limite de 1000 caracteres atingido"),
});
export { SearchInput };

export type SearchInput = z.infer<typeof SearchInput>;
