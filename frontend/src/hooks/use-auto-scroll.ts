"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD = 100;

export function useAutoScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const isAtBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollTop + clientHeight >= scrollHeight - BOTTOM_THRESHOLD;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    if (isAtBottom()) {
      setAutoScrollEnabled(true);
      isUserScrollingRef.current = false;
    } else {
      isUserScrollingRef.current = true;
      scrollTimeoutRef.current = setTimeout(() => {
        if (isUserScrollingRef.current) {
          setAutoScrollEnabled(false);
        }
      }, 150);
    }
  }, [isAtBottom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [handleScroll]);

  return {
    containerRef,
    autoScrollEnabled,
    scrollToBottom,
  };
}
