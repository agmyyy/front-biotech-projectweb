"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types";

interface ChatListProps {
  isCollapsed?: boolean;
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string, e: React.MouseEvent) => void;
}

export function ChatList({
  isCollapsed,
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
}: ChatListProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const clearPending = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setPendingDeleteId(null);
  };

  const handleDeleteClick = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pendingDeleteId !== sessionId) {
      setPendingDeleteId(sessionId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setPendingDeleteId(null), 5000);
      return;
    }
    clearPending();
    onDelete(sessionId, e);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearPending();
  };

  if (sessions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex-1 min-h-6 pr-2 overflow-y-auto transition-al duration-300 custom-scrollbar ease-in-out",
        // Se estiver colapsado, some com a opacidade e desativa cliques
        isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <ul className="w-full space-y-1 max-h-120 overflow-y-auto custom-scrollbar pr-5">
        {sessions.map((session) => {
          const isConfirming = pendingDeleteId === session.id;
          return (
            <li
              key={session.id}
              className={cn(
                "group relative flex items-center gap-2 py-2 pl-4 pr-2 w-full rounded-full cursor-pointer ",
                "whitespace-nowrap overflow-hidden",
                activeSessionId === session.id ? "bg-li/50" : "hover:bg-li",
              )}
              onClick={() => onSelect(session.id)}
              onMouseLeave={() => {
                if (isConfirming) clearPending();
              }}
            >
              {isConfirming ? (
                <>
                  <span
                    className="flex-1 truncate text-sm font-medium text-green-1"
                    title={`Excluir "${session.title}"?`}
                  >
                    Excluir &quot;{session.title}&quot;?
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      aria-label={`Confirmar exclusão de ${session.title}`}
                      title="Confirmar exclusão"
                      onClick={(e) => handleDeleteClick(session.id, e)}
                      className="flex items-center justify-center size-6 rounded-full bg-button text-white hover:opacity-90 transition-all duration-200 cursor-pointer"
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Cancelar exclusão de ${session.title}`}
                      title="Cancelar"
                      onClick={handleCancelDelete}
                      className="flex items-center justify-center size-6 rounded-full bg-aside text-green-1/70 hover:text-green-1 hover:bg-hover transition-all duration-200 cursor-pointer"
                    >
                      <X size={14} strokeWidth={2.5} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm font-medium pr-8">
                    {session.title}
                  </span>
                  <button
                    type="button"
                    aria-label={`Excluir ${session.title}`}
                    title={`Excluir ${session.title}`}
                    onClick={(e) => handleDeleteClick(session.id, e)}
                    className="absolute right-2 flex items-center justify-center size-6 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:opacity-100 max-md:opacity-60 text-green-1/60 hover:text-green-1 hover:bg-aside transition-all duration-200 cursor-pointer"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
