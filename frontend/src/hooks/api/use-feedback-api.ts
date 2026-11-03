"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/services/api-client";

// "saved": nota gravada; "already-rated": o backend já tem nota para a mensagem (409); "failed": erro de validação ou conexão
export type FeedbackOutcome = "saved" | "already-rated" | "failed";

export function useFeedbackApi() {
  // messageId é o id da mensagem do assistente, que o backend espera no campo searchId de POST /feedback
  const sendFeedback = useCallback(
    async (messageId: string, rating: number): Promise<FeedbackOutcome> => {
      if (!messageId) {
        toast.error("Erro ao enviar avaliação", {
          description: "Identificador da resposta não encontrado.",
        });
        return "failed";
      }

      try {
        const response = await apiClient.post("/feedback", {
          rating,
          searchId: messageId,
        });

        // 409 indica que a mensagem já foi avaliada, em outra aba ou dispositivo
        if (response.status === 409) {
          return "already-rated";
        }

        if (response.error) {
          toast.error("Erro na validação do feedback", {
            description: response.error || "Tente novamente em instantes.",
          });
          return "failed";
        }

        return "saved";
      } catch (error) {
        console.error("Erro ao enviar feedback:", error);
        toast.error("Erro de conexão", {
          description: "Verifique sua internet e tente novamente.",
        });
        return "failed";
      }
    },
    [],
  );

  return { sendFeedback };
}
