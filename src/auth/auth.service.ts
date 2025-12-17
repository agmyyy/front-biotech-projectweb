import { BadRequestException, Injectable } from '@nestjs/common';
// pra crptografar a senha, importar randomBytes
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
const scrypt = promisify(_scrypt);
const users : any [] = [];

@Injectable()
export class AuthService {
  async signUp (email: string, password:string){
    const existingUser = users.find(user => user.email === email);
    if (existingUser){
      throw new BadRequestException('Email em uso');
    }

    const salt = randomBytes(8).toString('hex');
    const hash = await scrypt(password, salt, 32) as Buffer;

    const saltAndHash = `${salt}.${hash.toString('hex')}`;

    const user = {
      email, 
      password: saltAndHash,
    };
    users.push(user);
    console.log('Signed up', user);
    const { password: _, ...result } = user;
    return result;


  }
  
}
