import {
  UserRegisterSchema,
  UserLoginSchema,
  UserSchema,
} from "../schemas/auth.schema";

describe("UserRegisterSchema", () => {
  it("aceita um registro válido e normaliza o e-mail", () => {
    const result = UserRegisterSchema.safeParse({
      name: "Maria Silva",
      email: "  MARIA@Exemplo.COM ",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      // E-mail sempre chega trimado e em minúsculas, independentemente do input
      expect(result.data.email).toBe("maria@exemplo.com");
    }
  });

  it("transforma o nome para Title Case", () => {
    const result = UserRegisterSchema.safeParse({
      name: "joão da silva",
      email: "joao@email.com",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("João Da Silva");
    }
  });

  it("rejeita e-mail inválido", () => {
    const result = UserRegisterSchema.safeParse({
      name: "Maria Silva",
      email: "email-invalido",
      password: "senha12345",
    });

    expect(result.success).toBe(false);
  });

  it("rejeita senha com menos de 8 caracteres", () => {
    const result = UserRegisterSchema.safeParse({
      name: "Maria Silva",
      email: "maria@email.com",
      password: "1234567",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "A senha deve ter no mínimo 8 caracteres.",
      );
    }
  });

  it("rejeita nome com números", () => {
    const result = UserRegisterSchema.safeParse({
      name: "Maria123",
      email: "maria@email.com",
      password: "senha12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe(
        "O nome deve conter apenas letras",
      );
    }
  });

  it("rejeita nome muito curto", () => {
    const result = UserRegisterSchema.safeParse({
      name: "A",
      email: "maria@email.com",
      password: "senha12345",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Nome muito curto.");
    }
  });

  it("rejeita campos ausentes com mensagem em pt-BR", () => {
    const result = UserRegisterSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain("O nome é obrigatório.");
      expect(messages).toContain("O e-mail é obrigatório.");
      expect(messages).toContain("A senha é obrigatória.");
    }
  });
});

describe("UserLoginSchema", () => {
  it("aceita um login válido", () => {
    const result = UserLoginSchema.safeParse({
      email: "maria@email.com",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
  });

  it("normaliza o e-mail no login", () => {
    const result = UserLoginSchema.safeParse({
      email: " MARIA@Email.com ",
      password: "senha12345",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("maria@email.com");
    }
  });

  it("rejeita campos extras por ser um schema strict", () => {
    const result = UserLoginSchema.safeParse({
      email: "maria@email.com",
      password: "senha12345",
      admin: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("admin");
    }
  });
});

describe("UserSchema", () => {
  it("aceita um usuário válido", () => {
    const result = UserSchema.safeParse({
      id: "1",
      name: "Maria Silva",
      email: "maria@email.com",
    });

    expect(result.success).toBe(true);
  });

  it("aceita usuário com avatar opcional", () => {
    const result = UserSchema.safeParse({
      id: "1",
      name: "Maria Silva",
      email: "maria@email.com",
      avatarUrl: "https://example.com/avatar.png",
    });

    expect(result.success).toBe(true);
  });

  it("rejeita usuário sem id", () => {
    const result = UserSchema.safeParse({
      name: "Maria Silva",
      email: "maria@email.com",
    });

    expect(result.success).toBe(false);
  });
});
