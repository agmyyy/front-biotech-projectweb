import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRegisterSchema, UserLoginSchema } from 'shared';
import { Request, Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  buildAuthCookieOptions,
  extractTokenFromCookie,
} from './auth-cookie';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body(new ZodValidationPipe(UserRegisterSchema)) body: { name: string; email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.register(body);
    this.setAuthCookie(res, token);
    return { user };
  }

  @Post('login')
  async login(
    @Body(new ZodValidationPipe(UserLoginSchema)) body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, token } = await this.authService.login(body);
    this.setAuthCookie(res, token);
    return { user };
  }

  // Revoga as sessões ativas do usuário e remove o cookie mesmo se o token já estiver inválido
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.revokeToken(extractTokenFromCookie(req));
    res.clearCookie(AUTH_COOKIE_NAME, buildAuthCookieOptions(this.isProduction()));
    return { message: 'Sessão encerrada em todos os dispositivos' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.getProfile(user.id);
  }

  // A expiração do cookie usa o exp do próprio token, assim cookie e JWT nunca divergem
  private setAuthCookie(res: Response, token: string) {
    const { exp } = this.jwtService.decode<{ exp: number }>(token);
    res.cookie(AUTH_COOKIE_NAME, token, {
      ...buildAuthCookieOptions(this.isProduction()),
      expires: new Date(exp * 1000),
    });
  }

  // Em produção o cookie só trafega por HTTPS (flag Secure)
  private isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
