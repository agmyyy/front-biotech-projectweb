import type { Request } from "express";
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  extractTokenFromCookie,
} from "./auth-cookie";

// Monta um request falso apenas com o cabeçalho Cookie, como o Express entrega
function createRequestWithCookie(cookie?: string) {
  return { headers: { cookie } } as unknown as Request;
}

describe("buildAuthCookieOptions", () => {
  it("marca httpOnly e sameSite lax por segurança", () => {
    const options = buildAuthCookieOptions(false);

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  it("só habilita secure em produção (HTTPS)", () => {
    expect(buildAuthCookieOptions(true).secure).toBe(true);
    expect(buildAuthCookieOptions(false).secure).toBe(false);
  });
});

describe("extractTokenFromCookie", () => {
  it("retorna null quando não há cabeçalho Cookie", () => {
    expect(extractTokenFromCookie(createRequestWithCookie())).toBeNull();
  });

  it("retorna null quando o cookie do token não existe", () => {
    const request = createRequestWithCookie("outro_cookie=valor");
    expect(extractTokenFromCookie(request)).toBeNull();
  });

  it("extrai o token do cookie correto", () => {
    const request = createRequestWithCookie(`${AUTH_COOKIE_NAME}=jwt.a.b`);
    expect(extractTokenFromCookie(request)).toBe("jwt.a.b");
  });

  it("encontra o token mesmo com outros cookies no cabeçalho", () => {
    const request = createRequestWithCookie(
      `a=1; ${AUTH_COOKIE_NAME}=token-secreto; b=2`,
    );
    expect(extractTokenFromCookie(request)).toBe("token-secreto");
  });

  it("preserva ponto-e-vírgula codificado no valor do token", () => {
    // O split é por ";", então só o separador real divide os cookies
    const request = createRequestWithCookie(`${AUTH_COOKIE_NAME}=abc;def`);
    expect(extractTokenFromCookie(request)).toBe("abc");
  });

  it("retorna null para cookie com valor vazio", () => {
    const request = createRequestWithCookie(`${AUTH_COOKIE_NAME}=`);
    expect(extractTokenFromCookie(request)).toBeNull();
  });

  it("tolera espaços ao redor do cabeçalho", () => {
    const request = createRequestWithCookie(
      `  ${AUTH_COOKIE_NAME}=token  `,
    );
    expect(extractTokenFromCookie(request)).toBe("token");
  });
});
