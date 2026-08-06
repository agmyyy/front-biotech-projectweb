"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SearchResultProps {
  content: string;
  isLoading?: boolean;
  onComplete?: () => void;
  animated?: boolean;
}

export function SearchResult({
  content,
  isLoading = false,
  onComplete,
  animated = true,
}: SearchResultProps) {
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
    const isStreaming = content.startsWith(prevContent) && content.length > prevContent.length;
    const isNewSearch = !content.startsWith(prevContent) || content.length < prevContent.length;

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
            " leading-relaxed font-light text-green-1 whitespace-pre-wrap wrap-break-words pr-2",
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
