/*import { NextRequest, NextResponse } from "next/server";
// Importa o seu schema de feedback da pasta @Shared
import { Feedback } from "@shared/validation/feedback.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação com o Zod
    const result = Feedback.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validação do feedback falhou",
          details: result.error.format(),
        },
        { status: 400 },
      );
    }

    const { rating, searchId } = result.data;

    // Log para você ver no terminal do Next.js se o dado chegou limpo
    console.log(
      `[Feedback Recebido] Busca ID: ${searchId} | Nota: ${rating} estrelas`,
    );

    // Quando integrar com o NestJS, aqui você faria o fetch repassando o feedback
    return NextResponse.json(
      { success: true, message: "Feedback registrado!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao processar feedback:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}*/
