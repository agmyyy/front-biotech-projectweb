"use client";

import { useState, useCallback } from "react";

export function useFeedbackControl() {
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);

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
