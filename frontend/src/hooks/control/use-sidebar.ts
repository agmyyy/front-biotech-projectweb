"use client";

import { useState, useCallback } from "react";

interface UseSidebarReturn {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export function useSidebar(initialCollapsed = true): UseSidebarReturn {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return {
    isCollapsed,
    toggleSidebar,
    setCollapsed,
  };
}
