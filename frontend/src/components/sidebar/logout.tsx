"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth-service";

interface LogoutProps {
  isCollapsed?: boolean;
}

export function Logout({ isCollapsed }: LogoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  return (
    <footer className="mt-auto py-2 w-full flex">
      <button
        type="button"
        onClick={handleLogout}
        className={isCollapsed ? "w-full flex" : ""}
      >
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "flex items-center justify-start pl-1 gap-2 py-3 rounded-4xl cursor-pointer transition hover:opacity-65",
            isCollapsed ? "h-10 w-9" : "",
          )}
          aria-label="Sair da conta"
        >
          <div
            className={cn(
              "flex py-1 pl-1",
              isCollapsed ? "justify-left" : "justify-left gap-2",
            )}
          >
            <Image
              src="/assets/power.svg"
              alt=""
              width={21}
              height={21}
              className="shrink-0"
            />
            {!isCollapsed && (
              <span className="text-green-1 overflow-hidden">Sair</span>
            )}
          </div>
        </Button>
      </button>
    </footer>
  );
}
