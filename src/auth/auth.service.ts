import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);
const users: any[] = [];

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signUp(email: string, password: string) {
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      throw new BadRequestException('Email em uso');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = await scrypt(password, salt, 32) as Buffer;
    const saltAndHash = `${salt}.${hash.toString('hex')}`;

    const user = {
      id: Math.floor(Math.random() * 1000),
      email,
      password: saltAndHash,
    };
    
    users.push(user);

    const payload = { email: user.email, sub: user.id };
    const token = this.jwtService.sign(payload);

    return {
      userId: user.id,
      email: user.email,
      access_token: token,
    };
  }
}