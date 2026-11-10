import { ArgumentsHost, BadRequestException, NotFoundException } from "@nestjs/common";
import { HttpException } from "@nestjs/common";
import { z } from "zod";
import { AllExceptionsFilter } from "./all-exceptions.filter";

// Monta um host falso com um response espionável, como o Express entregaria
function createHostMock() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe("AllExceptionsFilter", () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    // Silencia o console.error do ramo de erro não tratado
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    filter = new AllExceptionsFilter();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("responde 400 com details quando recebe um ZodError", () => {
    const schema = z.object({ name: z.string().min(2, "Nome muito curto.") });
    const parsed = schema.safeParse({ name: "A" });
    const zodError = parsed.success ? new Error() : parsed.error;
    const { host, response } = createHostMock();

    filter.catch(zodError, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith({
      error: "Dados inválidos",
      details: ["name: Nome muito curto."],
    });
  });

  it("preserva o status original de uma HttpException", () => {
    const { host, response } = createHostMock();

    filter.catch(new NotFoundException("Sessão não encontrada"), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Sessão não encontrada" }),
    );
  });

  it("converte HttpException com resposta string em objeto { error }", () => {
    const { host, response } = createHostMock();

    // HttpException com resposta string pura: o filter envolve em { error }
    filter.catch(new HttpException("algo quebrou", 500), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ error: "algo quebrou" });
  });

  it("repassa o corpo completo de BadRequestException", () => {
    const { host, response } = createHostMock();

    filter.catch(new BadRequestException("Validação falhou: erro"), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Validação falhou: erro",
        statusCode: 400,
      }),
    );
  });

  it("responde 500 genérico para erros desconhecidos", () => {
    const { host, response } = createHostMock();

    filter.catch(new TypeError("boom"), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: "Erro interno do servidor",
    });
    // O erro inesperado fica no log do servidor para investigação
    expect(console.error).toHaveBeenCalled();
  });

  it("responde 500 genérico para erros não Error", () => {
    const { host, response } = createHostMock();

    filter.catch("string qualquer", host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      error: "Erro interno do servidor",
    });
  });
});
