import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { MockService } from '../database/mock.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private mockService: MockService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'fallback-secret',
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = this.mockService.findUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return { id: user.id, email: user.email, name: user.name };
  }
}
