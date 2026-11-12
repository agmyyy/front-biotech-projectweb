import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  const schema = z.object({
    name: z.string().min(2, "Nome muito curto."),
  });

  it("retorna os dados validados quando o schema aprova", () => {
    const pipe = new ZodValidationPipe(schema);

    expect(pipe.transform({ name: "Maria" })).toEqual({ name: "Maria" });
  });

  it("aplica as transformações do schema no valor retornado", () => {
    const emailSchema = z.object({ email: z.string().trim().toLowerCase() });
    const pipe = new ZodValidationPipe(emailSchema);

    expect(pipe.transform({ email: "  MARIA@Exemplo.COM " })).toEqual({
      email: "maria@exemplo.com",
    });
  });

  it("lança BadRequestException quando o schema rejeita", () => {
    const pipe = new ZodValidationPipe(schema);

    expect(() => pipe.transform({ name: "A" })).toThrow(BadRequestException);
  });

  it("inclui as mensagens do Zod na exceção", () => {
    const pipe = new ZodValidationPipe(schema);

    try {
      pipe.transform({ name: "A" });
      fail("Esperava BadRequestException");
    } catch (error) {
      expect((error as BadRequestException).message).toBe(
        "Validação falhou: Nome muito curto.",
      );
    }
  });

  it("junta várias mensagens de erro com vírgula", () => {
    const multiSchema = z.object({
      name: z.string().min(2, "Nome muito curto."),
      email: z.string().email("E-mail inválido."),
    });
    const pipe = new ZodValidationPipe(multiSchema);

    try {
      pipe.transform({ name: "A", email: "invalido" });
      fail("Esperava BadRequestException");
    } catch (error) {
      const message = (error as BadRequestException).message;
      expect(message).toContain("Validação falhou:");
      expect(message).toContain("Nome muito curto.");
      expect(message).toContain("E-mail inválido.");
    }
  });

  it("rejeita valores que não passam no schema", () => {
    const pipe = new ZodValidationPipe(schema);

    expect(() => pipe.transform(null)).toThrow(BadRequestException);
    expect(() => pipe.transform({})).toThrow(BadRequestException);
    expect(() => pipe.transform({ name: 123 })).toThrow(BadRequestException);
  });
});
