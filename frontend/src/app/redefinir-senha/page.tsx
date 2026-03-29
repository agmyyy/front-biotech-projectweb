"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function RedefinirSenha() {
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

const handleRedefinir = (e: React.FormEvent) => {
    e.preventDefault();

    if (senha.length < 8) {
      setErro("A senha deve ter no mínimo 8 caracteres.");
      setSucesso("");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas estão diferentes.");
      setSucesso("");
      return;
    }

    setErro("");
    setSucesso("Senha alterada com sucesso!");
  };

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
          <Image src="/logo.png" alt="Logo 4WBiotech" width={168} height={63.85} />
        </div>

        <form className="login-form" onSubmit={handleRedefinir}>

          {/*Nova Senha */}
          <div className="input-group">
            <label className="input-label">
              <Image src="/icone-senha.svg" alt="Senha" width={16} height={16} />
              Nova Senha
            </label>
            <div className="input-wrapper">
              <input
                className="input-field-clean"
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
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

          {/* Confirmar a Senha */}
          <div className="input-group">
            <label className="input-label">
              <Image src="/icone-senha.svg" alt="Senha" width={16} height={16} />
              Confirme a Senha
            </label>
            <div className="input-wrapper">
              <input
                className="input-field-clean"
                type={mostrarConfirmarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />
              <Image
                src="/icone-olho.svg"
                alt="Mostrar Senha"
                width={20}
                height={20}
                className="input-icon-eye"
                onClick={() => setMostrarConfirmarSenha(!mostrarConfirmarSenha)}
              />
            </div>
          </div>

          {/* Renderização condicional das mensagens */}
          {erro && <p className="error-message">{erro}</p>}
          {sucesso && <p className="success-message">{sucesso}</p>}

          <button className="btn-primary" type="submit">Continuar</button>
        </form>

        {/*Voltar para Login */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link href="/login" className="register-link" style={{ color: "#2C4235", textDecoration: "none" }}>
            Tudo certo? Fazer Login
          </Link>
        </div>

      </div>
    </main>
  );
}