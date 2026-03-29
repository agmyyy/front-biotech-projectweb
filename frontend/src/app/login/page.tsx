"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Código para chamar o NestJS no futuro
    console.log("Tentando fazer login com os dados:");
    console.log("Email:", email);
    console.log("Senha:", password);
  }

  return (
      <main className="login-container">
        {/* Lado Esquerdo */}
        <div className="left-side">
          <h1>Continue suas descobertas!</h1>
          <p>O mundo precisa da sua próxima inovação...</p>
        </div>

        {/* Lado Direito */}
        <div className="right-side">
          <div className="logo-container">
            <Image
            src="/logo.png"
            alt="Logo 4WBiotech"
            width={168}
            height={63.85}
            />
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

  <p className="forgot-password">Esqueceu a senha?</p>
  <button className="btn-primary" type="submit">Entrar</button>
</form>

          <Link href="/cadastro" className="register-link" style={{ color: "#2C4235", textDecoration: "none" }}>
            Não tem uma conta? Cadastre-se
          </Link>
        </div>
      </main>
  );
}