"use client";

import { useState, useCallback } from "react";

export function useFeedbackControl() {
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);

  //observam se o texto teminou de ser gerado para exibir o balão de feedback
  const resetGeneration = useCallback(() => {
    setIsGenerationComplete(false);
  }, []);

  const completeGeneration = useCallback(() => {
    setIsGenerationComplete(true);
  }, []);

  return {
    isGenerationComplete,
    resetGeneration,
    completeGeneration,
  };
}
