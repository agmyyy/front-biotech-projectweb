import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MockService } from '../database/mock.service';

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(
    private mockService: MockService,
    private jwtService: JwtService,
  ) {}

  async register(data: RegisterInput) {
    const existing = this.mockService.findUserByEmail(data.email);
    if (existing) {
      throw new ConflictException('E-mail já está em uso');
    }

    const user = this.mockService.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    const user = this.mockService.findUserByEmail(data.email);
    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    if (user.password !== data.password) {
      throw new UnauthorizedException('E-mail ou senha incorretos');
    }

    const token = this.generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = this.mockService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }

  private generateToken(user: { id: string; email: string; name: string }) {
    const payload = { sub: user.id, email: user.email, name: user.name };
    return this.jwtService.sign(payload);
  }
}
