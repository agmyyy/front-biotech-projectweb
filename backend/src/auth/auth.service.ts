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
) => Promise<Buffer>;

const SCRYPT_KEY_LENGTH = 64;
const DEFAULT_SESSION_TITLE = "Nova conversa";
const TITLE_MAX_LENGTH = 60;
const VALID_ROLES = ["user", "assistant"];
const RATING_MIN = 1;
const RATING_MAX = 5;

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  //CADASTRO
  async register(data: RegisterInput) {
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
        },
      });
    } catch (error) {
      // O @unique do e-mail no banco é a barreira real contra duplicidade, inclusive em requisições simultâneas
      if (this.isUniqueViolation(error)) {
        throw new ConflictException("E-mail já está em uso");
      }
      throw this.mapDatabaseError(error, "Erro ao cadastrar usuário");
    }

    const token = this.generateToken(user);

    return {
      user,
      token,
    };
  }
  //LOGIN
  async login(data: LoginInput) {
    const email = this.normalizeEmail(data.email);

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      throw this.mapDatabaseError(error, "Erro ao buscar usuário");
    }

    if (!user) {
      // Gera um hash mesmo sem usuário, para o tempo de resposta não revelar quais e-mails existem
      await this.hashPassword(data.password);
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const isPasswordValid = await this.verifyPassword(
      data.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const token = this.generateToken(user);

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
      throw this.mapDatabaseError(error, "Erro ao buscar perfil");
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
      throw this.mapDatabaseError(error, "Erro ao criar sessão");
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
      throw this.mapDatabaseError(error, "Erro ao listar sessões");
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
      throw this.mapDatabaseError(error, "Erro ao criar mensagem");
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
      throw this.mapDatabaseError(error, "Erro ao listar mensagens");
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
      throw this.mapDatabaseError(error, "Erro ao criar avaliação");
    }
  }

  async findRatingByMessage(userId: string, messageId: string) {
    await this.findOwnedMessage(userId, messageId);

    try {
      return await prisma.rating.findUnique({
        where: { messageId },
      });
    } catch (error) {
      throw this.mapDatabaseError(error, "Erro ao buscar avaliação");
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
      throw this.mapDatabaseError(error, "Erro ao buscar sessão");
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
      throw this.mapDatabaseError(error, "Erro ao atualizar sessão");
    }
  }

  // A exclusão em cascata do schema remove mensagens e avaliações junto com a sessão
  async deleteSession(userId: string, sessionId: string) {
    await this.findOwnedSession(userId, sessionId);

    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch (error) {
      throw this.mapDatabaseError(error, "Erro ao excluir sessão");
    }
  }

  async deleteMessage(userId: string, messageId: string) {
    await this.findOwnedMessage(userId, messageId);

    try {
      await prisma.message.delete({ where: { id: messageId } });
    } catch (error) {
      throw this.mapDatabaseError(error, "Erro ao excluir mensagem");
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
      throw this.mapDatabaseError(error, "Erro ao buscar sessão");
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
      throw this.mapDatabaseError(error, "Erro ao buscar mensagem");
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

  // Gera "salt:hash" em hexadecimal; o salt aleatório impede que senhas iguais tenham o mesmo hash
  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, SCRYPT_KEY_LENGTH);
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  // Recalcula o hash com o salt salvo e compara em tempo constante, evitando ataques de tempo
  private async verifyPassword(password: string, storedHash: string) {
    const [salt, hashHex] = storedHash.split(":");
    if (!salt || !hashHex) {
      return false;
    }

    const storedKey = Buffer.from(hashHex, "hex");
    const derivedKey = await scryptAsync(password, salt, storedKey.length);
    return timingSafeEqual(storedKey, derivedKey);
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

  // Erros de negócio (HttpException) passam sem alteração; o resto vira erro 500 genérico
  private mapDatabaseError(error: unknown, message: string) {
    if (error instanceof HttpException) {
      return error;
    }
    return new InternalServerErrorException(message);
  }

  private generateToken(user: { id: string; email: string; name: string }) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    return this.jwtService.sign(payload);
  }
}
