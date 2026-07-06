"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Propriedades customizadas para o componente Input, estendendo os atributos nativos do HTML.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Componente de Input de texto controlado e customizado.
 * Gerencia automaticamente os vínculos de acessibilidade entre `label`, `input` e mensagens de `error` (A11y).
 * Suporta o encaminhamento de referências (`forwardRef`) para total compatibilidade com ecossistemas de formulários.
 * * @example
 * <Input
 * label="E-mail"
 * type="email"
 * placeholder="seu@email.com"
 * error={errors.email?.message}
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-green-1 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex w-full rounded-2xl border bg-main px-4 py-2.5 text-green-1 placeholder:text-green-1/50 focus:outline-none focus:ring-2 focus:ring-green-1/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
            error && "border-red-500 focus:ring-red-500/50",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-red-500"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
