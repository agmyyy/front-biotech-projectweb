"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { toast } from "sonner";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.register({ name: nome, email, password });
      toast.success("Conta criada com sucesso!");
      router.push("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta";
      setError(message);
      toast.error(message);
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

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Continuar"}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
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