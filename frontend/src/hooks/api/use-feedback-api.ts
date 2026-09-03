"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/services/api-client";

interface UseFeedbackOptions {
  searchId?: string;
}

export function useFeedbackApi({ searchId }: UseFeedbackOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sendFeedback = useCallback(
    async (rating: number, customSearchId?: string) => {
      const activeSearchId = customSearchId || searchId;

      if (!activeSearchId) {
        toast.error("Erro ao enviar avaliação", {
          description: "Identificador da busca não encontrado.",
        });
        return;
      }

      setIsSubmitting(true);

      try {
        const response = await apiClient.post("/feedback", {
          rating,
          searchId: activeSearchId,
        });

        if (response.error) {
          toast.error("Erro na validação do feedback", {
            description: response.error || "Tente novamente em instantes.",
          });
          return;
        }

        setIsSubmitted(true);
      } catch (error) {
        console.error("Erro ao enviar feedback:", error);
        toast.error("Erro de conexão", {
          description: "Verifique sua internet e tente novamente.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [searchId],
  );

  const resetFeedback = useCallback(() => {
    setIsSubmitted(false);
    setIsSubmitting(false);
  }, []);

  return {
    sendFeedback,
    resetFeedback,
    isSubmitting,
    isSubmitted,
  };
}
