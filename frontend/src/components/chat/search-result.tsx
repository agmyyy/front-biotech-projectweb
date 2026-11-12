"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FeedbackRating } from "@/components/feedback/feedback-rating";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { SearchResponse } from "@/types";
import type { StreamingPhase } from "@/hooks/control/use-search";

interface SearchResultStructuredProps {
  result: SearchResponse;
  isLoading?: boolean;
  onComplete?: () => void;
  onFeedback?: (rating: number) => Promise<boolean>;
  animated?: boolean;
  currentPhase?: StreamingPhase;
  isRated?: boolean;
}

interface SearchResultLegacyProps {
  content: string;
  isLoading?: boolean;
  onComplete?: () => void;
  animated?: boolean;
}

type SearchResultProps = SearchResultStructuredProps | SearchResultLegacyProps;

function isStructuredProps(
  props: SearchResultProps,
): props is SearchResultStructuredProps {
  return "result" in props;
}

export function SearchResult(props: SearchResultProps) {
  if (isStructuredProps(props)) {
    return <SearchResultStructured {...props} />;
  }
  return <SearchResultLegacy {...props} />;
}

function SearchResultStructured({
  result,
  isLoading = false,
  onComplete,
  onFeedback,
  animated = true,
  currentPhase: externalPhase,
  isRated = false,
}: SearchResultStructuredProps) {
  // A nota vem do backend (isRated); feedbackGiven cobre a nota enviada agora nesta tela
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const { displayedText: typewriterSummary, isTyping } = useTypewriter({
    text: result.summary,
    enabled: animated,
    onComplete,
  });

  const displayedSummary = animated ? typewriterSummary : result.summary;
  const currentPhase = externalPhase ?? "done";
  const isStreamingComplete = animated ? currentPhase === "done" : true;

  // Só marca como avaliada depois que o backend confirma a gravação
  const handleFeedback = async (rating: number) => {
    const saved = await onFeedback?.(rating);
    if (saved) setFeedbackGiven(true);
  };

  if (isLoading) return null;

  const showCursor = animated && (isTyping || !isStreamingComplete);

  return (
    <div className="flex justify-center w-full py-4">
      <div className="w-full max-w-3xl space-y-5">
        <p
          className={cn(
            "leading-relaxed font-normal text-green-1 whitespace-pre-wrap wrap-break-words pr-2",
            showCursor &&
              "after:content-[''] after:animate-cursor-blink after:ml-0.5 after:text-green-1 after:text-sm",
          )}
        >
          {displayedSummary}
        </p>

        {isStreamingComplete && !isTyping && onFeedback && (
          <div className="flex justify-start animate-in fade-in duration-300">
            {feedbackGiven || isRated ? (
              <p className="text-sm text-green-1/40">
                Agradecemos seu feedback!
              </p>
            ) : (
              <FeedbackRating onSelect={handleFeedback} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultLegacy({
  content,
  isLoading = false,
  onComplete,
  animated = true,
}: SearchResultLegacyProps) {
  const { displayedText, isTyping } = useTypewriter({
    text: content,
    enabled: animated,
    onComplete,
  });

  if (isLoading) return null;

  const displayText = animated ? displayedText : content;

  return (
    <div className="flex justify-center w-full py-4">
      <div className="w-full max-w-3xl">
        <p
          className={cn(
            "leading-relaxed font-normal text-green-1 whitespace-pre-wrap wrap-break-words pr-2",
            animated &&
              isTyping &&
              "after:content-['█'] after:animate-cursor-blink after:ml-0.5 after:text-green-1 after:text-sm",
          )}
        >
          {displayText}
        </p>
      </div>
    </div>
  );
}

