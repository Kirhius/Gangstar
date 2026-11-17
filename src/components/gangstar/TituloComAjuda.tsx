"use client";

// Gangstar: titulo de tela com um botaozinho "?" que abre a explicacao num popup.

import { useState, type ReactNode } from "react";

export function TituloComAjuda({ titulo, ajuda, pequeno = false }: { titulo: ReactNode; ajuda: ReactNode; pequeno?: boolean }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <div className="gs-titulo-ajuda">
        {pequeno ? <h3 className="gs-h3">{titulo}</h3> : <h2 className="gs-h2">{titulo}</h2>}
        <button className="gs-btn-ajuda" onClick={() => setAberto(true)} aria-label="Ajuda">
          ?
        </button>
      </div>
      {aberto && (
        <div className="gs-popup-fundo" onClick={() => setAberto(false)}>
          <div className="gs-popup-painel" onClick={(e) => e.stopPropagation()}>
            <div className="gs-popup-topo">
              <h3 className="gs-h3" style={{ margin: 0 }}>
                {titulo}
              </h3>
              <button className="gs-popup-fechar" onClick={() => setAberto(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="gs-ajuda-texto">{ajuda}</div>
            <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => setAberto(false)}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
