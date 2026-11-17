"use client";

// Raiz do app: abre direto no Gangstar e registra o service worker (funciona offline).

import { useEffect, useState } from "react";
import { GangstarInicio } from "./gangstar/GangstarInicio";

export function Jogo() {
  // so renderiza no navegador: o jogo le o save do localStorage
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    setPronto(true);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);
  if (!pronto) return <div className="gs-carregando" />;
  return <GangstarInicio />;
}
