/**
 * @jest-environment node
 *
 * O NextRequest herda do global Request, que só existe no ambiente node
 * (o jsdom não o implementa). O middleware é puro servidor, sem DOM.
 */
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

// Cria uma requisição Next com ou sem cookie de autenticação
function createRequest(path: string, withToken = false): NextRequest {
  const headers = new Headers();
  if (withToken) {
    headers.set("cookie", "biotech_token=jwt-token-válido");
  }
  return new NextRequest(`http://localhost:3000${path}`, { headers });
}

describe("middleware de autenticação", () => {
  it("redireciona para /login quando não há token em rota privada", () => {
    const response = middleware(createRequest("/dashboard"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    const location = response.headers.get("location");
    expect(location).toContain("/login");
    // Preserva o destino para o login redirecionar após autenticar
    expect(location).toContain("redirect=%2Fdashboard");
  });

  it("redireciona subrotas privadas preservando o caminho completo", () => {
    const response = middleware(createRequest("/chat/abc"));

    const location = response.headers.get("location");
    expect(location).toContain("redirect=%2Fchat%2Fabc");
  });

  it("permite /login sem token", () => {
    const response = middleware(createRequest("/login"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("permite /cadastro sem token", () => {
    const response = middleware(createRequest("/cadastro"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("permite rotas privadas quando o token existe", () => {
    const response = middleware(createRequest("/dashboard", true));

    expect(response.headers.get("location")).toBeNull();
  });

  it("ignora rotas de API", () => {
    const response = middleware(createRequest("/api/queries"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("ignora arquivos estáticos pelo prefixo /_next", () => {
    const response = middleware(createRequest("/_next/static/chunk.js"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("ignora arquivos estáticos pela extensão", () => {
    const response = middleware(createRequest("/assets/logo.svg"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("trata /login com subcaminho como rota pública", () => {
    const response = middleware(createRequest("/login/expirado"));

    expect(response.headers.get("location")).toBeNull();
  });
});
