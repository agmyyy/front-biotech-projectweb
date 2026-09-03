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
  const [animatedText, setAnimatedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const animationPosRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const animate = useCallback(
    (from: number, target: string) => {
      cleanupRef.current?.();

      if (from >= target.length) {
        setAnimatedText(target);
        setIsAnimating(false);
        animationPosRef.current = 0;
        onCompleteRef.current?.();
        return;
      }

      setIsAnimating(true);
      let pos = from;
      let lastChar: string | undefined = target[pos - 1];
      let timerId: ReturnType<typeof setTimeout>;

      const step = () => {
        if (pos >= target.length) {
          setAnimatedText(target);
          setIsAnimating(false);
          animationPosRef.current = 0;
          onCompleteRef.current?.();
          return;
        }
        const ch = target[pos];
        const delay = getDelay(ch, lastChar);
        lastChar = ch;
        pos++;
        animationPosRef.current = pos;
        setAnimatedText(target.substring(0, pos));
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
    if (!enabled || !text) {
      cleanupRef.current?.();
      animationPosRef.current = 0;
      return;
    }

    const currentPos = animationPosRef.current;
    const currentDisplayed = text.substring(0, currentPos);

    if (text.startsWith(currentDisplayed) && text.length > currentPos) {
      animate(currentPos, text);
    } else if (text.length <= currentPos) {
      setAnimatedText(text);
      setIsAnimating(false);
      animationPosRef.current = text.length;
      cleanupRef.current?.();
    } else {
      animationPosRef.current = 0;
      setAnimatedText("");
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

  const isActive = enabled && text.length > 0;

  return {
    displayedText: isActive ? animatedText : text,
    isTyping: isActive ? isAnimating : false,
  };
}
