"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarLogin, setLembrarLogin] = useState(false);
  const [erro, setErro] = useState("");


  const isEmailValido = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");

    if (!isEmailValido(email)) {
      setErro("Por favor, insira um formato de e-mail válido.");
      return;
    }

    if (email === "erro@4wbiotech.com") {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    console.log("Tentando fazer login...", { email, password, lembrarLogin });
  };

  return (
    <main className="login-container">
      <div className="left-side">
        <h1>Continue suas descobertas!</h1>
        <p>O mundo precisa da sua próxima inovação...</p>
      </div>

      <div className="right-side">
        <div className="logo-container">
          <Image src="/logo.png" alt="Logo 4WBiotech" width={168} height={63.85} />
        </div>

        <form className="login-form" onSubmit={handleLogin}>

          <div className="input-group">
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

          <div className="input-group">
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

          {/*Checkbox e o Link Redirecionamento */}
          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={lembrarLogin}
                onChange={(e) => setLembrarLogin(e.target.checked)}
              />
              Lembrar-me
            </label>

            <Link href="/redefinir-senha" style={{ color: "#333", textDecoration: "none", fontSize: "14px" }}>
              Esqueceu a senha?
            </Link>
          </div>

          {erro && <p className="error-message">{erro}</p>}

          <button className="btn-primary" type="submit">Entrar</button>
        </form>

        <div style={{ marginTop: '20px' }}>
          <Link href="/cadastro" className="register-link" style={{ color: "#2C4235", textDecoration: "none" }}>
            Não tem uma conta? Cadastre-se
          </Link>
        </div>
      </div>
    </main>
  );
}