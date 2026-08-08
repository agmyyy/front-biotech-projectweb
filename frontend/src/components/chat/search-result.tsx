"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeedbackRating } from "@/components/feedback/feedback-rating";
import { isMessageRated, markMessageAsRated } from "@/lib/feedback-storage";
import type { SearchResponse } from "@/types";
import type { StreamingPhase } from "@/hooks/control/use-search";

interface SearchResultStructuredProps {
  result: SearchResponse;
  isLoading?: boolean;
  onComplete?: () => void;
  onFeedback?: (rating: number) => void;
  animated?: boolean;
  displayedSummary?: string;
  displayedSuggestions?: string[];
  displayedJustifications?: string[];
  displayedSources?: string[];
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
  displayedSummary: externalSummary,
  displayedSuggestions: externalSuggestions,
  displayedJustifications: externalJustifications,
  displayedSources: externalSources,
  currentPhase: externalPhase,
  messageId,
}: SearchResultStructuredProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(
    () => (messageId ? isMessageRated(messageId) : false),
  );
  const [internalSummary, setInternalSummary] = useState("");
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const displayedSummary = animated
    ? (externalSummary ?? internalSummary)
    : result.summary;
  const displayedSuggestions = animated
    ? (externalSuggestions ?? [])
    : result.suggestions;
  const displayedJustifications = animated
    ? (externalJustifications ?? [])
    : result.justifications;
  const displayedSources = animated ? (externalSources ?? []) : result.sources;
  const currentPhase = externalPhase ?? "done";

  const prevSummaryRef = useRef("");

  useEffect(() => {
    if (!animated || externalSummary !== undefined) return;

    const summary = result.summary;
    if (!summary) {
      setInternalSummary("");
      prevSummaryRef.current = "";
      return;
    }

    const prevSummary = prevSummaryRef.current;
    const isStreaming =
      summary.startsWith(prevSummary) && summary.length > prevSummary.length;
    const isNewSearch =
      !summary.startsWith(prevSummary) || summary.length < prevSummary.length;

    let currentPosition: number;
    if (isStreaming) {
      currentPosition = prevSummary.length;
    } else if (isNewSearch) {
      currentPosition = 0;
      setInternalSummary("");
    } else {
      return;
    }

    prevSummaryRef.current = summary;
    const speed = 6;

    const timer = setInterval(() => {
      if (currentPosition < summary.length) {
        setInternalSummary(summary.substring(0, currentPosition + 1));
        currentPosition++;
      } else {
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [result.summary, animated, externalSummary]);

  useEffect(() => {
    if (currentPhase === "done" && animated) {
      onCompleteRef.current?.();
    }
  }, [currentPhase, animated]);

  const handleFeedback = (rating: number) => {
    setFeedbackGiven(true);
    if (messageId) markMessageAsRated(messageId);
    onFeedback?.(rating);
  };

  if (isLoading) return null;

  const isStreamingComplete = animated ? currentPhase === "done" : true;

  const hasStructuredData =
    result.suggestions.length > 0 ||
    result.justifications.length > 0 ||
    result.sources.length > 0;

  const showCursor = animated && !isStreamingComplete;

  return (
    <div className="flex justify-center w-full py-4">
      <div className="w-full max-w-3xl space-y-5">
        <p
          className={cn(
            "leading-relaxed font-normal text-green-1 whitespace-pre-wrap wrap-break-words pr-2",
            showCursor &&
              currentPhase === "summary" &&
              "after:content-['|'] after:animate-pulse after:ml-0.5 after:text-green-1",
          )}
        >
          {displayedSummary}
        </p>

        {displayedSuggestions.length > 0 && (
          <Section title="Sugestoes de Formulação">
            <ul className="space-y-1.5">
              {displayedSuggestions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-green-1 text-base font-normal leading-relaxed"
                >
                  <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-green-1/40" />
                  <span>
                    {item}
                    {showCursor &&
                      currentPhase === "suggestions" &&
                      i === displayedSuggestions.length - 1 && (
                        <span className="animate-pulse ml-0.5 text-green-1">
                          |
                        </span>
                      )}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {displayedJustifications.length > 0 && (
          <Section title="Justificativas">
            <ul className="space-y-1.5">
              {displayedJustifications.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-green-1 text-base font-normal leading-relaxed"
                >
                  <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-green-1" />
                  <span>
                    {item}
                    {showCursor &&
                      currentPhase === "justifications" &&
                      i === displayedJustifications.length - 1 && (
                        <span className="animate-pulse ml-0.5 text-green-1">
                          |
                        </span>
                      )}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {displayedSources.length > 0 && (
          <Section title="Fontes">
            <button
              onClick={() => setSourcesExpanded(!sourcesExpanded)}
              className="flex items-center gap-1 text-sm font-normal text-green-1 hover:text-green-1/70 transition-colors mb-2"
            ></button>
            <ul className="space-y-1">
              {(sourcesExpanded
                ? displayedSources
                : displayedSources.slice(0, 2)
              ).map((source, i) => (
                <li
                  key={i}
                  className="text-sm font-normal text-green-1 leading-relaxed pl-3 border-l border-green-1/10"
                >
                  {source}
                  {showCursor &&
                    currentPhase === "sources" &&
                    i === displayedSources.length - 1 && (
                      <span className="animate-pulse ml-0.5 text-green-1">
                        |
                      </span>
                    )}
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

        {/*result.clarifications && result.clarifications.length > 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-li/50 border border-li/50 animate-in fade-in duration-300">
            <MessageCircle
              size={16}
              className="shrink-0 mt-0.5 text-green-1/50"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-green-1/60 uppercase tracking-wide">
                Clarificacoes
              </p>
              <ul className="space-y-1">
                {result.clarifications.map((q, i) => (
                  <li
                    key={i}
                    className="text-base font-normal text-green-1/70 leading-relaxed"
                  >
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )*/}

        {hasStructuredData && isStreamingComplete && onFeedback && (
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
  const [displayedText, setDisplayedText] = useState("");
  const prevContentRef = useRef("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!animated) return;

    if (!content) {
      setDisplayedText("");
      prevContentRef.current = "";
      return;
    }

    const prevContent = prevContentRef.current;
    const isStreaming =
      content.startsWith(prevContent) && content.length > prevContent.length;
    const isNewSearch =
      !content.startsWith(prevContent) || content.length < prevContent.length;

    let currentPosition: number;
    if (isStreaming) {
      currentPosition = prevContent.length;
    } else if (isNewSearch) {
      currentPosition = 0;
      setDisplayedText("");
    } else {
      return;
    }

    prevContentRef.current = content;
    const speed = 6;

    const timer = setInterval(() => {
      if (currentPosition < content.length) {
        setDisplayedText(content.substring(0, currentPosition + 1));
        currentPosition++;
      } else {
        clearInterval(timer);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [content, animated]);

  if (isLoading) return null;

  const displayText = animated ? displayedText : content;

  return (
    <div className="flex justify-center w-full py-4">
      <div className="w-full max-w-3xl">
        <p
          className={cn(
            "leading-relaxed font-normal text-green-1 whitespace-pre-wrap wrap-break-words pr-2",
            animated &&
              displayedText.length < content.length &&
              "after:content-['|'] after:animate-pulse after:ml-0.5 after:text-green-1",
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
