import {Controller, Post, Body} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller ('auth')
export class AuthController {

    constructor(private readonly authService: AuthService){

    }

  @Post('signup') 
  signUp(@Body() body: any){
    const {email, password} = body;
    return this.authService.signUp(email, password);

  }
}