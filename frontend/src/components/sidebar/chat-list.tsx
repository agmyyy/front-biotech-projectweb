"use client";

import Image from "next/image";
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
  if (sessions.length === 0) return null;

  return (
    <div
      className={cn(
        "flex-1 min-h-6 pr-2 overflow-y-auto transition-al duration-300 custom-scrollbar ease-in-out",
        // Se estiver colapsado, some com a opacidade e desativa cliques (pointer-events-none)
        isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <ul className="w-full space-y-1 max-h-120 overflow-y-auto custom-scrollbar pr-5">
        {sessions.map((session) => (
          <li
            key={session.id}
            className={cn(
              "group relative flex items-center gap-2 p-2 w-full rounded-full cursor-pointer ",
              // whitespace-nowrap impede que o texto quebre em duas linhas durante a animação de abertura
              "whitespace-nowrap overflow-hidden",
              activeSessionId === session.id ? "bg-li/50" : "hover:bg-li",
            )}
            onClick={() => onSelect(session.id)}
          >
            <span className="flex-1 truncate text-sm font-medium pr-8">
              {session.title}
            </span>
            {/* <button
              className="absolute right-3 opacity-0 group-hover:opacity-100 px-2 py-1 hover:bg-aside rounded-full transition-all text-green-1/60 hover:text-green-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id, e);
              }}
              aria-label={`Opções para ${session.title}`}
            >
              <Image
                src="/assets/options.svg"
                alt=""
                width={3}
                height={5}
                className="shrink-0"
              />
            </button> */}
          </li>
        ))}
      </ul>
    </div>
  );
}
