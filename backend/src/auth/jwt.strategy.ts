import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { prisma } from "../lib/prisma";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) {
      throw new Error("JWT_SECRET não está definido nas variáveis de ambiente");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Confere no banco se o usuário do token ainda existe, para barrar contas excluídas
  async validate(payload: { sub: string; email: string }) {
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    } catch {
      throw new InternalServerErrorException("Erro ao validar usuário");
    }

    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    return user;
  }
}
