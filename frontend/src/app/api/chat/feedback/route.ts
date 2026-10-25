import { NextRequest, NextResponse } from "next/server";
import { Feedback } from "@shared/schemas/feedback.schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = Feedback.safeParse(body);

    if (!result.success) {
      const firstMessage =
        result.error.issues[0]?.message || "Dados de feedback inválidos.";

      const fieldErrors = result.error.flatten().fieldErrors;

      return NextResponse.json(
        {
          success: false,
          message: firstMessage,
        },
        { status: 400 },
      );
    }

    const { rating, searchId } = result.data;

    console.log(
      `[Feedback Recebido] Busca ID: ${searchId} | Nota: ${rating} estrelas`,
    );

    return NextResponse.json(
      {
        success: true,
        message: "Obrigado pelo seu feedback!",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erro ao processar feedback:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          "Não foi possível enviar seu feedback no momento. Tente novamente.",
      },
      { status: 500 },
    );
  }
}
