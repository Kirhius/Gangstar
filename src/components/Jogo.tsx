"use client";

// Raiz do app: tela de carregamento (capa + frase de crime aleatoria), depois o Gangstar.
// Tambem registra o service worker (funciona offline).

import { useEffect, useState } from "react";
import { GangstarInicio } from "./gangstar/GangstarInicio";
import "./gangstar/instalar";

const FRASES = [
  "Na rua, respeito não se pede. Se toma.",
  "Quem não tem gangue, tem dívida.",
  "Todo império começa com uma carteira roubada.",
  "O cofre sempre abre para quem tem paciência.",
  "Dinheiro sujo também paga o aluguel.",
  "A polícia dorme às três. A gente não.",
  "Lealdade é cara. Traição sai mais cara ainda.",
  "No porto, ninguém viu nada.",
  "A casa sempre ganha. A não ser que a casa seja sua.",
  "Primeiro a quadra. Depois o bairro. Depois a cidade.",
  "Quem manda na boate manda na noite.",
  "Fiança é só o preço de mais uma lição.",
  "Capo que dorme acorda sem território.",
  "Toda grande fortuna esconde um grande segredo.",
  "Na Bolsa ou no beco, o jogo é o mesmo: comprar barato.",
];

const TEMPO_MINIMO = 1600;

export function Jogo() {
  const [pronto, setPronto] = useState(false);
  const [frase, setFrase] = useState("");
  useEffect(() => {
    setFrase(FRASES[Math.floor(Math.random() * FRASES.length)]);
    const t = setTimeout(() => setPronto(true), TEMPO_MINIMO);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => clearTimeout(t);
  }, []);
  if (!pronto) {
    return (
      <div className="gs-splash" role="status" aria-label="Carregando o Gangstar">
        <div className="gs-splash-capa" aria-hidden="true" />
        <div className="gs-splash-conteudo">
          <p className="gs-splash-frase">{frase && `“${frase}”`}</p>
          <div className="gs-splash-barra">
            <div />
          </div>
          <small>Carregando o império…</small>
        </div>
      </div>
    );
  }
  return <GangstarInicio />;
}
