import { Logger } from "@nestjs/common";

// Eventos de autenticação auditados no servidor
export type AuthAuditEvent =
  | "register"
  | "login_success"
  | "login_failed"
  | "logout";

// Dados estruturados do evento; proibido incluir senha, hash ou token aqui
export type AuthAuditDetails = {
  userId?: string;
  email?: string;
  reason?: string;
};

export type AuthAuditContext = {
  ip?: string;
};

// Logger dedicado: facilita filtrar eventos de autenticação nos logs do servidor
const authAuditLogger = new Logger("AuthAudit");

// Registra um evento de autenticação em JSON estruturado com timestamp.
// Em produção, encaminhe estes logs para o coletor central da aplicação.
export function logAuthAudit(
  event: AuthAuditEvent,
  details: AuthAuditDetails = {},
  context: AuthAuditContext = {},
): void {
  authAuditLogger.log(
    JSON.stringify({
      event,
      ...details,
      ip: context.ip ?? "unknown",
      at: new Date().toISOString(),
    }),
  );
}
