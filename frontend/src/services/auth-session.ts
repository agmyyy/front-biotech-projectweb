const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const PUBLIC_ROUTES = ["/login", "/cadastro"];
let isHandlingUnauthorized = false;

// Finaliza a sessão no servidor antes de encaminhar a navegação para o login
export async function handleUnauthorizedSession() {
  if (typeof window === "undefined" || isHandlingUnauthorized) {
    return;
  }

  isHandlingUnauthorized = true;

  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    // A navegação continua para permitir nova tentativa de autenticação
  }

  try {
    localStorage.removeItem("biotech_user");
    localStorage.removeItem("biotech_token");
  } catch {
    // O armazenamento local pode estar desabilitado no navegador
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => window.location.pathname === route || window.location.pathname.startsWith(`${route}/`),
  );

  if (!isPublicRoute) {
    const redirect = `${window.location.pathname}${window.location.search}`;
    const loginUrl = new URL("/login", window.location.origin);
    loginUrl.searchParams.set("sessionExpired", "1");
    loginUrl.searchParams.set("redirect", redirect);
    window.location.assign(loginUrl.toString());
    return;
  }

  isHandlingUnauthorized = false;
}
