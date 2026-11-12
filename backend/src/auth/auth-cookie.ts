import type { CookieOptions, Request } from "express";

// Nome do cookie que guarda o JWT; o middleware do Next.js lê o cookie com este mesmo nome
export const AUTH_COOKIE_NAME = "biotech_token";

// Opções de segurança do cookie: HttpOnly impede leitura por JavaScript
export function buildAuthCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  };
}

// Extrai o JWT do cabeçalho Cookie diretamente, dispensando o pacote
export function extractTokenFromCookie(request: Request): string | null {
  const header = request.headers.cookie;
  if (!header) {
    return null;
  }

  for (const part of header.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === AUTH_COOKIE_NAME) {
      return valueParts.join("=") || null;
    }
  }

  return null;
}
