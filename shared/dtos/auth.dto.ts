//transformar o schema do Zod em uma Classe.

import { createZodDto } from "nestjs-zod";
import { UserRegister, UserLogIn } from "../auth.schema";
// O createZodDto cria uma classe a partir do Schema Zod
export class UserRegisterDto extends createZodDto(UserRegister) {}
export class UserLogInDto extends createZodDto(UserLogIn) {}
