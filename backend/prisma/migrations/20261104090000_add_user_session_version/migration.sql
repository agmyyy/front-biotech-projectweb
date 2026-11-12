-- Adiciona a versão de sessão usada para revogar JWTs sem invalidar as contas
ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;
