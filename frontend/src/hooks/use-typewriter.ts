"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const BASE_SPEED_MS = 33;
const PUNCTUATION_SPEED_MS = 165;
const SPACE_AFTER_PUNCTUATION_MS = 105;

const PUNCTUATION_CHARS = new Set([".", ",", "!", "?", ";", ":"]);

function getDelay(char: string, prevChar: string | undefined): number {
  if (PUNCTUATION_CHARS.has(char)) return PUNCTUATION_SPEED_MS;
  if (char === " " && prevChar && PUNCTUATION_CHARS.has(prevChar))
    return SPACE_AFTER_PUNCTUATION_MS;
  return BASE_SPEED_MS;
}

interface UseTypewriterOptions {
  text: string;
  enabled?: boolean;
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  enabled = true,
  onComplete,
}: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("");
  const prevTextRef = useRef("");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanupRef = useRef<(() => void) | null>(null);

  const animate = useCallback(
    (from: number, target: string) => {
      cleanupRef.current?.();
      let pos = from;
      let lastChar: string | undefined = target[pos - 1];
      let timerId: ReturnType<typeof setTimeout>;

      const step = () => {
        if (pos >= target.length) {
          setDisplayedText(target);
          onCompleteRef.current?.();
          return;
        }
        const ch = target[pos];
        const delay = getDelay(ch, lastChar);
        lastChar = ch;
        pos++;
        setDisplayedText(target.substring(0, pos));
        timerId = setTimeout(step, delay);
      };

      timerId = setTimeout(step, 0);

      cleanupRef.current = () => {
        clearTimeout(timerId);
        cleanupRef.current = null;
      };
    },
    [],
  );

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      prevTextRef.current = text;
      return;
    }

    if (!text) {
      setDisplayedText("");
      prevTextRef.current = "";
      return;
    }

    const prev = prevTextRef.current;

    if (text.startsWith(prev) && text.length > prev.length) {
      prevTextRef.current = text;
      animate(prev.length, text);
    } else if (!text.startsWith(prev) || text.length < prev.length) {
      prevTextRef.current = text;
      setDisplayedText("");
      animate(0, text);
    } else {
      prevTextRef.current = "";
      setDisplayedText("");
      animate(0, text);
    }

    return () => {
      cleanupRef.current?.();
    };
  }, [text, enabled, animate]);

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return { displayedText };
}
