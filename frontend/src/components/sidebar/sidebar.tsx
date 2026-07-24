"use client";

import { motion } from "framer-motion";
import { ReactNode, Children, isValidElement, cloneElement } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { User } from "@shared/auth.schema";

interface SidebarChildProps {
  isCollapsed?: boolean;
  user?: User | null;
}

interface SidebarProps {
  children: ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  user?: User | null;
}

export function Sidebar({
  children,
  isCollapsed,
  onToggle,
  user,
}: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 90 : 300 }}
      transition={{
        type: "tween",
        duration: 0.2,
        ease: "easeInOut",
      }}
      className={cn(
        "flex flex-col h-screen bg-aside font-primary relative shrink-0 shadow-lg",
        "border-r border-li",
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex items-center justify-center rounded-full w-6 h-6 absolute -right-3 top-6 z-10 bg-green-2 cursor-pointer text-aside shadow-xl hover:scale-110 transition-transform",
          isCollapsed && "rotate-180",
        )}
        aria-label={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        aria-expanded={!isCollapsed}
      >
        <Image
          src="/assets/chevronn.svg"
          alt=""
          width={5}
          height={10}
          className={cn(
            "shrink-0 transition-transform duration-400",
            isCollapsed && "rotate-180",
          )}
        />
      </button>

      <div className="flex flex-col h-full w-full overflow-hidden pl-6 py-4">
        <div className="flex flex-col h-full w-full">
          {Children.map(children, (child) => {
            if (isValidElement<SidebarChildProps>(child)) {
              return cloneElement(child, { isCollapsed, user });
            }
            return child;
          })}
        </div>
      </div>
    </motion.aside>
  );
}
