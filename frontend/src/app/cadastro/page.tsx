"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { toast } from "sonner";
import { getFriendlyMessage } from "@/lib/error-messages";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorNome, setErrorNome] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorSenha, setErrorSenha] = useState("");
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorNome("");
    setErrorEmail("");
    setErrorSenha("");

    try {
      const response = await authService.register({ name: nome, email, password });
      if (response.user) {
        localStorage.setItem("biotech_user", JSON.stringify(response.user));
      }
      toast.success("Conta criada com sucesso!");
      router.push("/dashboard");
    } catch (err) {
      const { nome: msgNome, email: msgEmail, senha: msgSenha, geral } =
        getFriendlyMessage("cadastro", err);
      if (msgNome) setErrorNome(msgNome);
      if (msgEmail) setErrorEmail(msgEmail);
      if (msgSenha) setErrorSenha(msgSenha);
      if (geral) {
        setErrorNome(geral);
        setErrorEmail(geral);
        setErrorSenha(geral);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      {/* Lado Esquerdo */}
      <div className="left-side">
        <h1>Crie sua conta!</h1>
        <p>Dê o primeiro passo para a sua próxima grande inovação...</p>
      </div>

      {/* Lado Direito */}
      <div className="right-side">
        <div className="logo-container">
          <Image src="/logo.png" alt="Logo 4WBiotech" width={168} height={63.85} />
        </div>

        <form className="login-form" onSubmit={handleCadastro}>

          {/* Grupo: Nome Completo */}
          <div className="field-group">
            <label className="input-label">
              <Image src="/icone-usuario.svg" alt="Usuário" width={16} height={16} />
              Nome Completo
            </label>
            <div className="input-wrapper">
              <input
                className="input-field-clean"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          </div>

          {/* Grupo: E-mail */}
          <div className="field-group">
            <label className="input-label">
              <Image src="/icone-email.svg" alt="Email" width={16} height={16} />
              E-mail
            </label>
            <div className="input-wrapper">
              <input
                className="input-field-clean"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Grupo: Senha */}
          <div className="field-group">
            <label className="input-label">
              <Image src="/icone-senha.svg" alt="Senha" width={16} height={16} />
              Senha
            </label>
            <div className="input-wrapper">
              <input
                className="input-field-clean"
                type={mostrarSenha ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Image
                src="/icone-olho.svg"
                alt="Mostrar Senha"
                width={20}
                height={20}
                className="input-icon-eye"
                onClick={() => setMostrarSenha(!mostrarSenha)}
              />
            </div>
          </div>

          {errorNome && <p className="text-red-500 text-sm">{errorNome}</p>}
          {errorEmail && <p className="text-red-500 text-sm">{errorEmail}</p>}
          {errorSenha && <p className="text-red-500 text-sm">{errorSenha}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Continuar"}
          </button>
        </form>

        <p className="register-link">
          <Link href="/login" style={{ color: "#2C4235", textDecoration: "none" }}>
            Já tem uma conta? Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}