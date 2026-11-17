"use client";

// Gangstar: etiquetas com o nome dos predios sobre os mapas ilustrados, e o botao de
// "olho" que mostra/esconde as etiquetas (escondidas por padrao).

export interface TagMapa {
  id: string;
  texto: string;
  poligono: [number, number][];
  destaque?: boolean;
}

export function TagsMapa({ tags, larguraMapa }: { tags: TagMapa[]; larguraMapa: number }) {
  const fonte = Math.round(larguraMapa * 0.026);
  return (
    <g className="gs-mapa-tags" pointerEvents="none">
      {tags.map((t) => {
        const xs = t.poligono.map((p) => p[0]);
        const ys = t.poligono.map((p) => p[1]);
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
        const topo = Math.max(fonte * 1.2, Math.min(...ys) + fonte * 0.4);
        const largura = t.texto.length * fonte * 0.58 + fonte * 1.1;
        // nao ficar embaixo do botao de olho (canto superior direito)
        const limiteDireito = topo < fonte * 4 ? larguraMapa * 0.86 : larguraMapa - 6;
        const x = Math.min(limiteDireito - largura / 2, Math.max(largura / 2 + 6, cx));
        return (
          <g key={t.id} transform={`translate(${x} ${topo})`}>
            <rect x={-largura / 2} y={-fonte * 0.95} width={largura} height={fonte * 1.5} rx={fonte * 0.35} className={t.destaque ? "gs-tag-mapa-fundo gs-tag-mapa-meu" : "gs-tag-mapa-fundo"} />
            <text x={0} y={fonte * 0.12} textAnchor="middle" fontSize={fonte} className="gs-tag-mapa-texto">
              {t.texto}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function BotaoOlho({ visivel, alternar }: { visivel: boolean; alternar: () => void }) {
  return (
    <button className={`gs-mapa-olho ${visivel ? "gs-mapa-olho-ativo" : ""}`} onClick={alternar} aria-label={visivel ? "Esconder nomes dos prédios" : "Mostrar nomes dos prédios"} title={visivel ? "Esconder nomes" : "Mostrar nomes"}>
      {visivel ? "🙈" : "👁️"}
    </button>
  );
}
