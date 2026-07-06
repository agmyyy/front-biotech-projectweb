"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Componente de container principal para Cards.
 * Serve como base estrutural usando o padrão de componentes compostos.
 * * @example
 * <Card>
 * <CardHeader>
 * <CardTitle>Título do Card</CardTitle>
 * <CardDescription>Descrição opcional do conteúdo.</CardDescription>
 * </CardHeader>
 * <CardContent>
 * <p>Conteúdo principal aqui...</p>
 * </CardContent>
 * <CardFooter>
 * <Button>Ação</Button>
 * </CardFooter>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl bg-main text-green-1 shadow-sm border border-li",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * Título principal do Card. Renderiza nativamente uma tag `<h3>` semanticamente correta.
 */
export const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-xl font-semibold leading-none tracking-tight text-green-1",
      className,
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * Texto de apoio ou subtítulo. Aplica uma opacidade sutil (70%) na cor padrão do texto.
 */
export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-green-1/70", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * Área de conteúdo principal do Card.
 * Nota de layout: Possui `pt-0` para mitigar o espaçamento duplo quando usado abaixo do `CardHeader`.
 */
export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

/**
 * Rodapé do Card, geralmente alinhado para ações, botões ou metadados finais.
 */
export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";
