import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { UserRegisterSchema, UserLoginSchema } from 'shared';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body(new ZodValidationPipe(UserRegisterSchema)) body: { name: string; email: string; password: string }) {
    return this.authService.register(body);
  }

  @Post('login')
  login(@Body(new ZodValidationPipe(UserLoginSchema)) body: { email: string; password: string }) {
    return this.authService.login(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.authService.getProfile(user.id);
  }
}
