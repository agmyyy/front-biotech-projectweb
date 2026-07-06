'use client';

import { useState, useCallback } from 'react';

interface UseSidebarReturn {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export function useSidebar(initialCollapsed = false): UseSidebarReturn {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const setCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  return {
    isCollapsed,
    toggleSidebar,
    setCollapsed,
  };
}