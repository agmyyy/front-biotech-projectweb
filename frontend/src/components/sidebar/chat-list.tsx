"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types";

interface ChatListProps {
  isCollapsed?: boolean;
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelect: (sessionId: string) => void;
  onRequestDelete: (sessionId: string, e: React.MouseEvent) => void;
}

export function ChatList({
  isCollapsed,
  sessions,
  activeSessionId,
  onSelect,
  onRequestDelete,
}: ChatListProps) {
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
        {sessions.map((session) => (
          <li
            key={session.id}
            className={cn(
              "group relative flex items-center gap-2 py-2 pl-4 pr-2 w-full rounded-full cursor-pointer ",
              "whitespace-nowrap overflow-hidden",
              activeSessionId === session.id ? "bg-li/50" : "hover:bg-li",
            )}
            onClick={() => onSelect(session.id)}
          >
            <span className="flex-1 truncate text-sm font-medium pr-8">
              {session.title}
            </span>
            <button
              type="button"
              aria-label={`Excluir ${session.title}`}
              title={`Excluir ${session.title}`}
              onClick={(e) => {
                e.stopPropagation();
                onRequestDelete(session.id, e);
              }}
              className="absolute right-2 flex items-center justify-center size-6 rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:opacity-100 max-md:opacity-60 text-green-1/60 hover:text-green-1 hover:bg-aside transition-all duration-200 cursor-pointer"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
