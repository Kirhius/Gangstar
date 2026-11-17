"use client";

// Botao "Instalar app" da tela inicial. Some quando o jogo ja esta instalado.

import { useEffect, useState } from "react";
import { ehIphone, instalarAgora, jaInstalado, ouvirInstalacao, podeInstalarDireto } from "./instalar";

export function BotaoInstalar() {
  const [, forcar] = useState(0);
  const [ajuda, setAjuda] = useState(false);
  useEffect(() => ouvirInstalacao(() => forcar((n) => n + 1)), []);

  if (jaInstalado()) return null;
  const direto = podeInstalarDireto();
  const iphone = ehIphone();
  if (!direto && !iphone) return null;

  return (
    <>
      <button
        className="gs-btn gs-btn-instalar"
        onClick={() => {
          if (direto) instalarAgora();
          else setAjuda(true);
        }}
      >
        📲 Instalar app
      </button>
      {ajuda && (
        <div className="gs-popup-fundo" onClick={() => setAjuda(false)}>
          <div className="gs-popup-painel" onClick={(e) => e.stopPropagation()}>
            <div className="gs-popup-topo">
              <h3 className="gs-h3" style={{ margin: 0 }}>
                📲 Instalar no iPhone
              </h3>
              <button className="gs-popup-fechar" onClick={() => setAjuda(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <ol className="gs-passos-instalar">
              <li>
                Abra este site no <strong>Safari</strong>.
              </li>
              <li>
                Toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima).
              </li>
              <li>
                Escolha <strong>Adicionar à Tela de Início</strong> e confirme.
              </li>
            </ol>
            <p className="gs-dica">O Gangstar vira um ícone na sua tela e abre em tela cheia, como um app.</p>
          </div>
        </div>
      )}
    </>
  );
}
