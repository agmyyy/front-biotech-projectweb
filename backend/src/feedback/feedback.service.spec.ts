import { FeedbackService } from "./feedback.service";
import { AuthService } from "../auth/auth.service";

describe("FeedbackService", () => {
  let service: FeedbackService;
  let authService: { createRating: jest.Mock };

  beforeEach(() => {
    authService = { createRating: jest.fn() };
    service = new FeedbackService(
      authService as unknown as AuthService,
    );
  });

  it("delega a criação da avaliação para o AuthService", async () => {
    authService.createRating.mockResolvedValue({ id: "r1", score: 4 });

    const result = await service.create({
      rating: 4,
      searchId: "mensagem-assistente-1",
      userId: "u1",
    });

    // A ordem dos argumentos é (userId, score, messageId)
    expect(authService.createRating).toHaveBeenCalledWith(
      "u1",
      4,
      "mensagem-assistente-1",
    );
    expect(result).toEqual({ id: "r1", score: 4 });
  });

  it("propaga erros do AuthService (ex.: 409 de nota duplicada)", async () => {
    authService.createRating.mockRejectedValue(
      new Error("Esta mensagem já foi avaliada"),
    );

    await expect(
      service.create({ rating: 5, searchId: "m1", userId: "u1" }),
    ).rejects.toThrow("Esta mensagem já foi avaliada");
  });
});
