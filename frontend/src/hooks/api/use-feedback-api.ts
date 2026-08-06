"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseFeedbackOptions {
  searchId?: string;
}

//envio da avaliação para o BD
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
        const response = await fetch("/api/chat/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating,
            searchId: activeSearchId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Exibe o erro formatado pelo Zod / Route Handler
          toast.error("Erro na validação do feedback", {
            description: data.message || "Tente novamente em instantes.",
          });
          return;
        }

        setIsSubmitted(true);
        toast.success(data.message || "Obrigado pelo seu feedback!");
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
