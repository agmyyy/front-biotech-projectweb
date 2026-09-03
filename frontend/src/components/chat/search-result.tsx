"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FeedbackRating } from "@/components/feedback/feedback-rating";
import { isMessageRated, markMessageAsRated } from "@/lib/feedback-storage";
import { useTypewriter } from "@/hooks/use-typewriter";
import type { SearchResponse } from "@/types";
import type { StreamingPhase } from "@/hooks/control/use-search";

interface SearchResultStructuredProps {
  result: SearchResponse;
  isLoading?: boolean;
  onComplete?: () => void;
  onFeedback?: (rating: number) => void;
  animated?: boolean;
  currentPhase?: StreamingPhase;
  messageId?: string;
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
  messageId,
}: SearchResultStructuredProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(() =>
    messageId ? isMessageRated(messageId) : false,
  );
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  const { displayedText: typewriterSummary, isTyping } = useTypewriter({
    text: result.summary,
    enabled: animated,
    onComplete,
  });

  const displayedSummary = animated ? typewriterSummary : result.summary;
  const currentPhase = externalPhase ?? "done";
  const isStreamingComplete = animated ? currentPhase === "done" : true;

  const handleFeedback = (rating: number) => {
    setFeedbackGiven(true);
    if (messageId) markMessageAsRated(messageId);
    onFeedback?.(rating);
  };

  if (isLoading) return null;

  const hasStructuredData =
    result.suggestions.length > 0 ||
    result.justifications.length > 0 ||
    result.sources.length > 0;

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

        {result.suggestions.length > 0 && currentPhase !== "summary" && (
          <Section title="Sugestões de Formulação">
            <ul className="space-y-1.5">
              {result.suggestions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-green-1 text-base font-normal leading-relaxed"
                >
                  <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-green-1/40" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {result.justifications.length > 0 &&
          (currentPhase === "sources" || currentPhase === "done") && (
            <Section title="Justificativas">
              <ul className="space-y-1.5">
                {result.justifications.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-green-1 text-base font-normal leading-relaxed"
                  >
                    <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-green-1" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

        {result.sources.length > 0 && currentPhase === "done" && (
          <Section title="Fontes">
            <button
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
              className="flex items-center gap-1 text-sm font-normal text-green-1 hover:text-green-1/70 transition-colors mb-2"
            ></button>
            <ul className="space-y-1">
              {(sourcesExpanded
                ? result.sources
                : result.sources.slice(0, 2)
              ).map((source, i) => (
                <li
                  key={i}
                  className="text-sm font-normal text-green-1 leading-relaxed pl-3 border-l border-green-1/10"
                >
                  {source}
                </li>
              ))}
            </ul>
            {!sourcesExpanded && result.sources.length > 2 && (
              <p className="text-xs text-green-1/40 mt-1">
                +{result.sources.length - 2} mais...
              </p>
            )}
          </Section>
        )}

        {hasStructuredData && isStreamingComplete && !isTyping && onFeedback && (
          <div className="flex justify-start animate-in fade-in duration-300">
            {feedbackGiven ? (
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-green-1/50 uppercase tracking-wide">
        {title}
      </h4>
      {children}
    </div>
  );
}
