"use client";

// Gangstar: login para o multiplayer (Google ou e-mail e senha).

import { useState } from "react";
import { criarConta, entrarComEmail, entrarComGoogle } from "@/lib/multiplayer";

export function TelaLogin() {
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async () => {
    setMsg(null);
    setOk(null);
    if (!email.includes("@")) return setMsg("Digite um e-mail válido.");
    if (senha.length < 6) return setMsg("A senha precisa ter pelo menos 6 caracteres.");
    setOcupado(true);
    if (modo === "entrar") {
      const erro = await entrarComEmail(email.trim(), senha);
      if (erro) setMsg(erro);
    } else {
      const r = await criarConta(email.trim(), senha);
      if (r.erro) setMsg(r.erro);
      else if (r.confirmar) setOk("Conta criada! Enviamos um link para o seu e-mail — confirme e depois entre aqui.");
    }
    setOcupado(false);
  };

  return (
    <section className="gs-tela">
      <div className="gs-banner" aria-hidden="true" />
      <div className="gs-grade" aria-hidden="true" />
      <div className="gs-conteudo gs-login">
        <h1 className="gs-titulo">
          GANG<span className="gs-titulo-dest">STAR</span>
        </h1>
        <p className="gs-subtitulo">Entre para jogar com a cidade toda</p>

        <button
          className="gs-btn gs-btn-google"
          disabled={ocupado}
          onClick={async () => {
            setMsg(null);
            const erro = await entrarComGoogle();
            if (erro) setMsg(erro);
          }}
        >
          <span className="gs-google-g" aria-hidden="true">
            G
          </span>
          Entrar com Google
        </button>

        <div className="gs-login-ou">
          <span>ou com e-mail</span>
        </div>

        <div className="gs-campo gs-campo-claro">
          <input className="gs-input" type="email" inputMode="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="gs-campo gs-campo-claro">
          <input
            className="gs-input"
            type="password"
            autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            placeholder="senha (mínimo 6)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && enviar()}
          />
        </div>
        {msg && <div className="gs-aviso">{msg}</div>}
        {ok && <div className="gs-aviso gs-aviso-ok">{ok}</div>}
        <button className="gs-btn gs-btn-principal" disabled={ocupado} onClick={enviar}>
          {ocupado ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>
        <button
          className="gs-btn-link gs-login-trocar"
          onClick={() => {
            setModo(modo === "entrar" ? "criar" : "entrar");
            setMsg(null);
            setOk(null);
          }}
        >
          {modo === "entrar" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
        <small className="gs-dica">Seu império fica salvo na nuvem: jogue no celular ou no computador com a mesma conta.</small>
      </div>
    </section>
  );
}
