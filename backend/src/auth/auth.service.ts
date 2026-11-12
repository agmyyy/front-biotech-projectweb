import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  HttpException,
  InternalServerErrorException,
} from "@nestjs/common";
import { prisma } from "../lib/prisma";
import { JwtService } from "@nestjs/jwt";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { logAuthAudit, AuthAuditContext } from "../common/logger/auth-audit";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

// scrypt em versão Promise, para usar com async/await
const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
  options?: { N: number; r: number; p: number },
) => Promise<Buffer>;

const SCRYPT_KEY_LENGTH = 64;
// Parâmetros fixados explicitamente: os defaults do Node podem mudar entre versões
// e quebrariam a validação de senhas já gravadas
const SCRYPT_PARAMS: { N: number; r: number; p: number } = { N: 16384, r: 8, p: 1 };
// Limite superior do N aceito no hash, para não estourar memória no login
const SCRYPT_MAX_N = 1 << 20;
const DEFAULT_SESSION_TITLE = "Nova conversa";
const TITLE_MAX_LENGTH = 200;
const VALID_ROLES = ["user", "assistant"];
const RATING_MIN = 1;
const RATING_MAX = 5;

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  //CADASTRO
  async register(data: RegisterInput, context: AuthAuditContext = {}) {
    const email = this.normalizeEmail(data.email);
    // Hash antes de salvar: o banco nunca recebe a senha em texto puro
    const passwordHash = await this.hashPassword(data.password);

    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: data.name,
          email,
          password: passwordHash,
        },
        select: {
          id: true,
          name: true,
          email: true,
          sessionVersion: true,
        },
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("E-mail já está em uso");
      }
      this.mapDatabaseError(error, "Erro ao cadastrar usuário");
    }

    const token = this.generateToken(user);

    logAuthAudit("register", { userId: user.id, email: user.email }, context);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }
  //LOGIN
  async login(data: LoginInput, context: AuthAuditContext = {}) {
    const email = this.normalizeEmail(data.email);

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao buscar usuário");
    }

    if (!user) {
      // Gera um hash mesmo sem usuário, para o tempo de resposta não revelar quais e-mails existem
      await this.hashPassword(data.password);
      logAuthAudit("login_failed", { email, reason: "user_not_found" }, context);
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const isPasswordValid = await this.verifyPassword(
      data.password,
      user.password,
    );
    if (!isPasswordValid) {
      logAuthAudit("login_failed", { email, reason: "invalid_password" }, context);
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const token = this.generateToken(user);

    logAuthAudit("login_success", { userId: user.id, email: user.email }, context);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    };
  }
  //BUSCA OS DADOS DO USER
  async getProfile(userId: string) {
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao buscar perfil");
    }

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    return user;
  }

  // CRIA UMA SESSÃO Q IRÁ CONTER OS CHATS
  async createSession(userId: string, title?: string) {
    try {
      return await prisma.session.create({
        data: {
          title: this.buildTitle(title ?? ""),
          userId,
        },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao criar sessão");
    }
  }
  //IDENTIFICA A SESSÃO PELO ID DO USER
  async findSessionsByUser(userId: string) {
    try {
      return await prisma.session.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao listar sessões");
    }
  }

  // Messages

  // Cria a mensagem e, na primeira mensagem do usuário, usa o texto como título da sessão
  async createMessage(
    userId: string,
    sessionId: string,
    content: string,
    role: string,
  ) {
    if (!VALID_ROLES.includes(role)) {
      throw new BadRequestException("Role inválida");
    }

    await this.findOwnedSession(userId, sessionId);

    try {
      return await prisma.$transaction(async (tx) => {
        const session = await tx.session.findUnique({
          where: { id: sessionId },
          select: { title: true },
        });

        const shouldSetTitle =
          role === "user" && session?.title === DEFAULT_SESSION_TITLE;

        // updatedAt é atualizado mesmo sem mudar o título, para a listagem refletir a atividade
        await tx.session.update({
          where: { id: sessionId },
          data: {
            updatedAt: new Date(),
            ...(shouldSetTitle ? { title: this.buildTitle(content) } : {}),
          },
        });

        return tx.message.create({
          data: {
            content,
            role,
            sessionId,
          },
        });
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao criar mensagem");
    }
  }
  async findMessagesBySession(userId: string, sessionId: string) {
    await this.findOwnedSession(userId, sessionId);

    try {
      return await prisma.message.findMany({
        where: { sessionId },
        include: {
          rating: true, // Traz a avaliação junto com a mensagem
        },
        orderBy: { createdAt: "asc" },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao listar mensagens");
    }
  }

  // Rating
  async createRating(userId: string, score: number, messageId: string) {
    if (!Number.isInteger(score) || score < RATING_MIN || score > RATING_MAX) {
      throw new BadRequestException(
        `A nota deve ser um número inteiro entre ${RATING_MIN} e ${RATING_MAX}`,
      );
    }

    const message = await this.findOwnedMessage(userId, messageId);

    // Só mensagens do assistente podem ser avaliadas, conforme o schema
    if (message.role !== "assistant") {
      throw new BadRequestException(
        "Apenas mensagens do assistente podem ser avaliadas",
      );
    }

    try {
      return await prisma.rating.create({
        data: {
          score,
          messageId,
        },
      });
    } catch (error) {
      // messageId é @unique: uma mensagem só pode ter uma avaliação
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("Esta mensagem já foi avaliada");
      }
      this.mapDatabaseError(error, "Erro ao criar avaliação");
    }
  }

  // Busca a sessão com as mensagens e suas avaliações, após checar a posse
  async findSessionById(userId: string, sessionId: string) {
    await this.findOwnedSession(userId, sessionId);

    try {
      return await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            include: { rating: true },
          },
        },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao buscar sessão");
    }
  }

  async updateSessionTitle(userId: string, sessionId: string, title: string) {
    await this.findOwnedSession(userId, sessionId);

    try {
      return await prisma.session.update({
        where: { id: sessionId },
        data: { title: this.buildTitle(title) },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao atualizar sessão");
    }
  }

  // A exclusão em cascata do schema remove mensagens e avaliações junto com a sessão
  async deleteSession(userId: string, sessionId: string) {
    await this.findOwnedSession(userId, sessionId);

    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao excluir sessão");
    }
  }

  // Verifica se a sessão existe e pertence ao usuário; senão responde 404 para não revelar sessões alheias
  async findOwnedSession(userId: string, sessionId: string) {
    let session;
    try {
      session = await prisma.session.findFirst({
        where: { id: sessionId, userId },
        select: { id: true },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao buscar sessão");
    }

    if (!session) {
      throw new NotFoundException("Sessão não encontrada");
    }

    return session;
  }

  // Verifica se a mensagem pertence a uma sessão do usuário
  async findOwnedMessage(userId: string, messageId: string) {
    let message;
    try {
      message = await prisma.message.findFirst({
        where: { id: messageId, session: { userId } },
        select: {
          id: true,
          role: true,
          content: true,
          sessionId: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao buscar mensagem");
    }

    if (!message) {
      throw new NotFoundException("Mensagem não encontrada");
    }

    return message;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }

  // Limita o título ao tamanho máximo e usa um padrão quando o texto está vazio
  private buildTitle(text: string) {
    return text.trim().slice(0, TITLE_MAX_LENGTH) || DEFAULT_SESSION_TITLE;
  }

  // Gera "scrypt$N$r$p$salt$hash"; os parâmetros ficam no próprio hash para validar senhas antigas
  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const { N, r, p } = SCRYPT_PARAMS;
    const derivedKey = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH, { N, r, p });
    return `scrypt$${N}$${r}$${p}$${salt}$${derivedKey.toString("hex")}`;
  }

  // Recalcula o hash com o salt salvo e compara em tempo constante, evitando ataques de tempo
  private async verifyPassword(password: string, storedHash: string) {
    const parsed = this.parsePasswordHash(storedHash);
    if (!parsed) {
      return false;
    }

    const { salt, hashHex, params } = parsed;
    const storedKey = Buffer.from(hashHex, "hex");
    if (storedKey.length === 0) {
      return false;
    }

    const derivedKey = await scryptAsync(password, salt, storedKey.length, params);
    return timingSafeEqual(storedKey, derivedKey);
  }

  // Aceita o formato versionado e o antigo "salt:hash", que usava os defaults do Node
  private parsePasswordHash(
    storedHash: string,
  ): { salt: string; hashHex: string; params: { N: number; r: number; p: number } } | null {
    if (storedHash.startsWith("scrypt$")) {
      const [, nPart, rPart, pPart, salt, hashHex] = storedHash.split("$");
      const N = Number(nPart);
      const r = Number(rPart);
      const p = Number(pPart);
      if (!salt || !hashHex || !Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
        return null;
      }
      // Teto de memória: evita que um valor absurdo vindo do banco estoure a RAM no login
      if (N < 2 || N > SCRYPT_MAX_N || r < 1 || p < 1) {
        return null;
      }
      return { salt, hashHex, params: { N, r, p } };
    }

    const [salt, hashHex] = storedHash.split(":");
    if (!salt || !hashHex) {
      return null;
    }
    return { salt, hashHex, params: SCRYPT_PARAMS };
  }

  // Erro do Prisma com código P2002 indica violação de campo @unique
  private isUniqueViolation(error: unknown) {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    );
  }

  // Erros de negócio (HttpException) passam sem alteração; o resto vira erro 500 genérico.
  // Sempre lança: o retorno `never` garante, em tempo de compilação, que nenhum call site
  // esqueça o tratamento do erro (antes, um `await` sem `throw` falharia em silêncio)
  private mapDatabaseError(error: unknown, message: string): never {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(message);
  }

  // A versão no token permite revogar todas as sessões ativas de um usuário
  private generateToken(user: { id: string; sessionVersion: number }) {
    return this.jwtService.sign({ sub: user.id, ver: user.sessionVersion });
  }

  // Invalida em todos os dispositivos os tokens que carregam a versão atual
  async revokeToken(token: string | null, context: AuthAuditContext = {}) {
    if (!token) {
      return;
    }

    let payload: { sub: string; ver?: number };
    try {
      payload = await this.jwtService.verifyAsync<{ sub: string; ver?: number }>(token, {
        ignoreExpiration: true,
      });
    } catch {
      // Tokens ausentes, expirados ou inválidos já não podem autorizar requisições
      return;
    }

    if (!payload.sub) {
      return;
    }

    try {
      await prisma.user.updateMany({
        where: {
          id: payload.sub,
          sessionVersion: payload.ver ?? 0,
        },
        data: { sessionVersion: { increment: 1 } },
      });
    } catch (error) {
      this.mapDatabaseError(error, "Erro ao encerrar sessões");
    }

    logAuthAudit("logout", { userId: payload.sub }, context);
  }
}
