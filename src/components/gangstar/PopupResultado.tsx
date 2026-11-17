"use client";

// Gangstar: popup central com o resultado de uma acao (sucesso ou falha).

export type ResultadoPopup = { sucesso: boolean; titulo: string; linhas: string[] };

export function PopupResultado({ resultado, aoFechar }: { resultado: ResultadoPopup | null; aoFechar: () => void }) {
  if (!resultado) return null;
  return (
    <div className="gs-popup-fundo" onClick={aoFechar}>
      <div className={`gs-popup-painel gs-popup-resultado ${resultado.sucesso ? "gs-popup-resultado-ok" : "gs-popup-resultado-falha"}`} onClick={(e) => e.stopPropagation()}>
        <div className="gs-popup-topo">
          <h3 className="gs-h3" style={{ margin: 0 }}>
            {resultado.titulo}
          </h3>
          <button className="gs-popup-fechar" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="gs-resultado-linhas">
          {resultado.linhas.map((linha, i) => (
            <p key={i} className="gs-resultado-linha">
              {linha}
            </p>
          ))}
        </div>
        <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </div>
  );
}
