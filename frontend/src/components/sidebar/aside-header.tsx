"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { User } from "@shared/schemas/auth.schema";

interface AsideHeaderProps {
  isCollapsed?: boolean;
  user?: User | null;
}

export function AsideHeader({ isCollapsed, user }: AsideHeaderProps) {
  const firstName = user?.name ? user.name.split(" ")[0] : "user";

  return (
    <header
      className={cn("flex w-full gap-4 mb-8", isCollapsed && "justify-left")}
    >
      <div className="flex items-center justify-center w-10 h-10 bg-green-2 rounded-full shrink-0">
        <Image
          src="/assets/logo4w.svg"
          alt="4W Biotech Logo"
          width={28}
          height={18}
          priority
        />
      </div>
      {!isCollapsed && (
        <span className=" self-center whitespace-nowrap overflow-hidden text-lg font-medium">
          Olá, {firstName}!
        </span>
      )}
    </header>
  );
}
