"use client";

import { useState, FormEvent } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (text: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  inputRef,
  disabled = false,
  placeholder = "Faça uma pesquisa...",
}: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !disabled) {
      onSearch(inputValue);
      setInputValue("");
    }
  };

  return (
    <div className="mt-auto pb-2 shrink-0 w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full">
        <input
          ref={inputRef}
          placeholder={placeholder}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={disabled}
          className={cn(
            "flex w-full border border-green-1/50 rounded-3xl shadow-md px-4 py-3 placeholder:text-green-1/50",
            "focus:outline-none focus:ring-2 focus:ring-green-1/50 focus:border-transparent",
            "transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          aria-label="Campo de pesquisa"
        />
      </form>
    </div>
  );
}
