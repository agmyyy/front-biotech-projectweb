"use client";

import { Loader } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchLoading() {
  return (
    <div className="flex w-full items-center justify-center animate-in fade-in duration-100">
      <Loader
        className="h-4 w-4 animate-spin text-green-1 shrink-0"
        aria-hidden="true"
      />
    </div>
  );
}
