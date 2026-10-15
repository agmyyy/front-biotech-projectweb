"use client";

import { useEffect, useRef, useState } from "react";
import { DropdownMenu } from "radix-ui";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types";

interface ChatListProps {
  isCollapsed?: boolean;
  sessions: ChatSession[];
  activeSessionId?: string;
  onSelect: (sessionId: string) => void;
  onRequestDelete: (sessionId: string, e: React.MouseEvent) => void;
  onRequestRename: (
    sessionId: string,
    title: string,
  ) => Promise<boolean> | boolean | void;
}

export function ChatList({
  isCollapsed,
  sessions,
  activeSessionId,
  onSelect,
  onRequestDelete,
  onRequestRename,
}: ChatListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  if (sessions.length === 0) return null;

  const startRename = (session: ChatSession) => {
    submittedRef.current = false;
    setEditingId(session.id);
    setDraftTitle(session.title);
  };

  const cancelRename = () => {
    submittedRef.current = false;
    setEditingId(null);
  };

  const submitRename = async (session: ChatSession) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === session.title) {
      setEditingId(null);
      return;
    }
    const ok = await onRequestRename(session.id, trimmed);
    // Mantém edição aberta se falhou (ok === false), fecha nos demais casos
    if (ok !== false) setEditingId(null);
    else submittedRef.current = false;
  };

  return (
    <div
      className={cn(
        "flex-1 min-h-6 pr-2 overflow-y-auto transition-al duration-300 custom-scrollbar ease-in-out",
        isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100",
      )}
    >
      <ul className="w-full space-y-1 max-h-120 overflow-y-auto custom-scrollbar pr-5">
        {sessions.map((session) => {
          const isEditing = editingId === session.id;
          return (
            <li
              key={session.id}
              className={cn(
                "group relative flex items-center gap-2 py-2 pl-4 pr-2 w-full rounded-full cursor-pointer overflow-hidden",
                activeSessionId === session.id ? "bg-li/50" : "hover:bg-li",
              )}
              onClick={() => {
                if (isEditing) return;
                onSelect(session.id);
              }}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={draftTitle}
                  maxLength={60}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === "Enter") void submitRename(session);
                    if (e.key === "Escape") cancelRename();
                  }}
                  onBlur={() => void submitRename(session)}
                  aria-label={`Renomear ${session.title}`}
                  className="flex-1 min-w-0 rounded-full bg-main border border-li px-3 py-1 text-sm font-medium text-green-1 placeholder:text-green-1/40 outline-none focus:border-green-2"
                />
              ) : (
                <span className="flex-1 truncate text-sm font-medium pr-8">
                  {session.title}
                </span>
              )}

              {!isEditing && (
                <DropdownMenu.Root modal={false}>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      aria-label={`Opções de ${session.title}`}
                      title={`Opções de ${session.title}`}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        "absolute right-2 flex items-center justify-center size-6 rounded-full transition-all duration-200 cursor-pointer",
                        "text-green-1/60 hover:text-green-1 hover:bg-aside",
                        "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus:opacity-100 max-md:opacity-60",
                        "data-[state=open]:opacity-100",
                      )}
                    >
                      <MoreVertical size={16} strokeWidth={2} />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      side="bottom"
                      align="end"
                      sideOffset={4}
                      avoidCollisions
                      onClick={(e) => e.stopPropagation()}
                      className="w-60 rounded-2xl border border-li bg-main p-2 shadow-xl z-[100]"
                    >
                      <DropdownMenu.Item
                        onSelect={() => startRename(session)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-green-1 hover:bg-li focus:bg-li outline-none transition-colors cursor-pointer"
                      >
                        <Pencil size={18} strokeWidth={1.8} aria-hidden />
                        Renomear
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        onSelect={() => {
                          // O handler de exclusão espera um MouseEvent do React
                          // apenas para stopPropagation; aqui o menu já fecha
                          // sozinho, então um stub é suficiente.
                          const stub = {
                            stopPropagation: () => {},
                          } as React.MouseEvent;
                          onRequestDelete(session.id, stub);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-normal text-green-1 hover:bg-li focus:bg-li outline-none transition-colors cursor-pointer"
                      >
                        <Trash2 size={18} strokeWidth={1.8} aria-hidden />
                        Excluir
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
