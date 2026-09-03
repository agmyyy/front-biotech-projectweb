import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes utilitárias do Tailwind de forma condicional,
 * resolvendo conflitos de especificidade automaticamente.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata uma data ou string válida para o padrão brasileiro com horário.
 * @example formatDate("2026-06-19T15:00:00Z") -> "19/06/2026 12:00"
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Cria uma versão com debounce da função fornecida, adiando sua execução
 * até que se passem 'wait' milissegundos desde a última invocação.
 * * @template T Tipo da função original para inferência de parâmetros.
 * @param func Função a ser executada após o tempo de espera.
 * @param wait Tempo de espera em milissegundos.
 * @returns Nova função controlada por timeout.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}
