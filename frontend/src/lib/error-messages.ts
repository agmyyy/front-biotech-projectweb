/**
 * Utilitário centralizado para converter erros da aplicação em mensagens
 * amigáveis e específicas ao campo que o usuário está preenchendo.
 *
 * Retorna um objeto com as chaves dos campos afetados (email, senha, nome)
 * e/ou uma chave "geral" para erros que não pertencem a um campo específico.
 *
 * Uso:
 *   const { email, senha, geral } = getFriendlyMessage("login", err);
 */

type FieldError = {
  email?: string;
  senha?: string;
  nome?: string;
  geral?: string;
};

export type ActionKey = "login" | "cadastro";

export function getFriendlyMessage(
  action: ActionKey,
  err: unknown,
): FieldError {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  const fieldError: FieldError = {};

  // =========================================================================
  // LOGIN
  // =========================================================================
  if (action === "login") {
    // E-mail não cadastrado
    if (
      lower.includes("e-mail não encontrado") ||
      lower.includes("email nao encontrado") ||
      lower.includes("não cadastrado") ||
      lower.includes("nao cadastrado") ||
      lower.includes("usuário não encontrado") ||
      lower.includes("usuario nao encontrado")
    ) {
      fieldError.email =
        "Não encontramos uma conta com este e-mail. Verifique o e-mail digitado ou cadastre-se.";
      return fieldError;
    }

    // Senha incorreta
    if (
      lower.includes("senha incorreta") ||
      (lower.includes("incorret") && lower.includes("senha"))
    ) {
      fieldError.senha =
        "Senha incorreta. Verifique sua senha e tente novamente.";
      return fieldError;
    }

    // Credenciais inválidas (ambas)
    if (
      lower.includes("credenciais") ||
      lower.includes("inválido") ||
      lower.includes("invalido") ||
      lower.includes("incorret") ||
      lower.includes("401") ||
      lower.includes("unauthorized")
    ) {
      fieldError.geral =
        "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
      return fieldError;
    }

    // Sessão expirada / token
    if (
      lower.includes("sessão expirada") ||
      lower.includes("sessao expirada") ||
      lower.includes("token") ||
      lower.includes("403") ||
      lower.includes("forbidden")
    ) {
      fieldError.geral =
        "Sua sessão expirou. Faça login novamente para continuar.";
      return fieldError;
    }

    // Erro de rede
    if (
      lower.includes("rede") ||
      lower.includes("network") ||
      lower.includes("fetch") ||
      lower.includes("conn") ||
      lower.includes("timeout")
    ) {
      fieldError.geral =
        "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
      return fieldError;
    }

    // Erro 500 / interno
    if (lower.includes("500") || lower.includes("erro interno")) {
      fieldError.geral =
        "Não foi possível fazer login no momento. Tente novamente em instantes.";
      return fieldError;
    }

    fieldError.geral =
      "Ocorreu um erro ao tentar fazer login. Tente novamente mais tarde.";
    return fieldError;
  }

  // =========================================================================
  // CADASTRO
  // =========================================================================
  if (action === "cadastro") {
    // E-mail já em uso
    if (
      lower.includes("já existe") ||
      lower.includes("ja existe") ||
      lower.includes("already exists") ||
      lower.includes("e-mail já está em uso") ||
      lower.includes("email ja esta em uso") ||
      lower.includes("e-mail já cadastrado") ||
      lower.includes("email ja cadastrado") ||
      lower.includes("409") ||
      lower.includes("conflict")
    ) {
      fieldError.email =
        "Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.";
      return fieldError;
    }

    // Senha fraca (não atende aos requisitos de segurança)
    if (
      lower.includes("senha") &&
      (lower.includes("maiuscula") ||
        lower.includes("minúscula") ||
        lower.includes("minuscula") ||
        lower.includes("número") ||
        lower.includes("numero") ||
        lower.includes("caractere especial") ||
        lower.includes("8 caracteres"))
    ) {
      fieldError.senha =
        "Sua senha precisa conter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula, um número e um caractere especial.";
      return fieldError;
    }

    // Nome inválido
    if (
      lower.includes("nome muito curto") ||
      lower.includes("nome muito longo") ||
      lower.includes("apenas letras") ||
      (lower.includes("nome") &&
        (lower.includes("obrigatório") || lower.includes("obrigatorio")))
    ) {
      fieldError.nome =
        "O nome deve conter apenas letras e ter entre 2 e 60 caracteres.";
      return fieldError;
    }

    // E-mail inválido
    if (
      lower.includes("e-mail inválido") ||
      lower.includes("email invalido") ||
      lower.includes("400") ||
      lower.includes("bad request")
    ) {
      fieldError.email =
        "Verifique o e-mail informado e tente novamente.";
      return fieldError;
    }

    // Sessão expirada / token
    if (
      lower.includes("sessão expirada") ||
      lower.includes("sessao expirada") ||
      lower.includes("token") ||
      lower.includes("403") ||
      lower.includes("forbidden")
    ) {
      fieldError.geral =
        "Sua sessão expirou. Faça login novamente para continuar.";
      return fieldError;
    }

    // Erro de rede
    if (
      lower.includes("rede") ||
      lower.includes("network") ||
      lower.includes("fetch") ||
      lower.includes("conn") ||
      lower.includes("timeout")
    ) {
      fieldError.geral =
        "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
      return fieldError;
    }

    // Erro 500 / interno
    if (lower.includes("500") || lower.includes("erro interno")) {
      fieldError.geral =
        "Não foi possível criar sua conta no momento. Tente novamente em instantes.";
      return fieldError;
    }

    fieldError.geral =
      "Ocorreu um erro ao criar sua conta. Tente novamente mais tarde.";
    return fieldError;
  }

  // Fallback para ações desconhecidas
  fieldError.geral = "Ocorreu um erro inesperado. Tente novamente mais tarde.";
  return fieldError;
}
