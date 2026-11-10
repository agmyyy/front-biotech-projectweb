import { renderHook, act } from "@testing-library/react";
import { useFeedbackApi } from "./use-feedback-api";
import { apiClient } from "@/services/api-client";
import { toast } from "sonner";

// Mocks: sem requisição real e sem toasts na tela durante o teste
jest.mock("@/services/api-client", () => ({
  apiClient: { post: jest.fn(), get: jest.fn() },
}));
jest.mock("sonner", () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockedPost = apiClient.post as jest.Mock;
const mockedToastError = toast.error as jest.Mock;

describe("useFeedbackApi", () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedToastError.mockReset();
    // Silencia o console.error do ramo de falha de conexão
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("retorna saved quando a avaliação é aceita", async () => {
    mockedPost.mockResolvedValue({ data: { id: "r1" }, status: 201 });
    const { result } = renderHook(() => useFeedbackApi());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.sendFeedback("m1", 4);
    });

    expect(outcome).toBe("saved");
    expect(mockedPost).toHaveBeenCalledWith("/feedback", {
      rating: 4,
      searchId: "m1",
    });
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it("retorna already-rated quando o servidor responde 409", async () => {
    mockedPost.mockResolvedValue({
      error: "Esta mensagem já foi avaliada",
      status: 409,
    });
    const { result } = renderHook(() => useFeedbackApi());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.sendFeedback("m1", 3);
    });

    // 409 não é erro para o usuário: a nota já existe em outra aba
    expect(outcome).toBe("already-rated");
    expect(mockedToastError).not.toHaveBeenCalled();
  });

  it("retorna failed e avisa o usuário em erro de validação", async () => {
    mockedPost.mockResolvedValue({
      error: "A nota deve ser um número inteiro entre 1 e 5",
      status: 400,
    });
    const { result } = renderHook(() => useFeedbackApi());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.sendFeedback("m1", 9);
    });

    expect(outcome).toBe("failed");
    expect(mockedToastError).toHaveBeenCalledWith(
      "Erro na validação do feedback",
      expect.objectContaining({
        description: "A nota deve ser um número inteiro entre 1 e 5",
      }),
    );
  });

  it("retorna failed quando o identificador da mensagem está ausente", async () => {
    const { result } = renderHook(() => useFeedbackApi());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.sendFeedback("", 4);
    });

    expect(outcome).toBe("failed");
    // Nem tenta enviar sem identificador
    expect(mockedPost).not.toHaveBeenCalled();
    expect(mockedToastError).toHaveBeenCalledWith(
      "Erro ao enviar avaliação",
      expect.objectContaining({
        description: "Identificador da resposta não encontrado.",
      }),
    );
  });

  it("retorna failed em falha de conexão", async () => {
    mockedPost.mockRejectedValue(new Error("sem internet"));
    const { result } = renderHook(() => useFeedbackApi());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.sendFeedback("m1", 4);
    });

    expect(outcome).toBe("failed");
    expect(mockedToastError).toHaveBeenCalledWith(
      "Erro de conexão",
      expect.objectContaining({
        description: "Verifique sua internet e tente novamente.",
      }),
    );
  });

  it("retorna failed com a mensagem do servidor em erro 500", async () => {
    mockedPost.mockResolvedValue({
      error: "Erro na requisição",
      status: 500,
    });
    const { result } = renderHook(() => useFeedbackApi());

    let outcome: string | undefined;
    await act(async () => {
      outcome = await result.current.sendFeedback("m1", 4);
    });

    expect(outcome).toBe("failed");
    expect(mockedToastError).toHaveBeenCalledWith(
      "Erro na validação do feedback",
      expect.objectContaining({
        description: "Erro na requisição",
      }),
    );
  });
});
