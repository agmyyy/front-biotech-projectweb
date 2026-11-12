import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { prisma } from "../lib/prisma";
import { extractTokenFromCookie } from "./auth-cookie";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET não está definido nas variáveis de ambiente");
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractTokenFromCookie]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Confere existência e versão no banco para barrar contas excluídas e sessões revogadas
  async validate(payload: { sub: string; ver?: number }) {
    if (!payload.sub) {
      throw new UnauthorizedException("Token inválido");
    }

    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
          sessionVersion: true,
        },
      });
    } catch {
      throw new InternalServerErrorException("Erro ao validar usuário");
    }

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    // Tokens anteriores à migração não possuem ver e são tratados como versão zero
    if ((payload.ver ?? 0) !== user.sessionVersion) {
      throw new UnauthorizedException("Sessão revogada");
    }

    return user;
  }
}
