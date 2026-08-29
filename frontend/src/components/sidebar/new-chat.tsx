"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NewChatProps {
  isCollapsed?: boolean;
  onClick: () => void;
}

export function NewChat({ isCollapsed, onClick }: NewChatProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      className={cn(
        "flex w-50 items-center justify-start p-2 gap-2 pb-15 rounded-4xl cursor-pointer transition hover:opacity-65",
        isCollapsed && "h-10 w-9",
      )}
      aria-label="Iniciar novo chat"
    >
      <Image
        src="/assets/pencil.svg"
        alt=""
        width={21}
        height={21}
        className="shrink-0"
      />
      {!isCollapsed && (
        <span className="whitespace-nowrap font-poppins font-light overflow-hidden">
          Novo chat
        </span>
      )}
    </Button>
  );
}
