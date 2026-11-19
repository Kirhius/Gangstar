"use client";

// Gangstar: mapa ilustrado do bairro das extorsoes. Cada estabelecimento e clicavel;
// os dominados ficam com contorno verde e o valor acumulado em cima (v1.12),
// os que ainda pedem mais poder mostram um cadeado.

import { useState } from "react";
import { CamadaPeriodo } from "./periodo";
import { BotaoOlho, TagsMapa } from "./TagsMapa";

const W = 976;
const H = 1076;

// Ordem importa: os ultimos ficam por cima (predios da frente).
export const ALVOS_EXTORSAO: { id: string; poligono: [number, number][] }[] = [
  { id: "banca", poligono: [[140, 135], [230, 60], [300, 75], [385, 130], [385, 215], [300, 255], [230, 250], [140, 200]] },
  { id: "padaria", poligono: [[700, 0], [976, 0], [976, 175], [930, 215], [820, 225], [700, 160]] },
  { id: "lava-jato", poligono: [[425, 250], [580, 165], [720, 235], [720, 350], [600, 420], [430, 360]] },
  { id: "oficina", poligono: [[0, 420], [130, 340], [250, 335], [365, 395], [365, 520], [250, 600], [120, 650], [0, 600]] },
  { id: "cassino", poligono: [[760, 330], [900, 240], [976, 255], [976, 500], [860, 575], [760, 520]] },
  { id: "posto", poligono: [[300, 620], [515, 490], [665, 545], [665, 650], [580, 700], [480, 790], [310, 700]] },
  { id: "cambio", poligono: [[5, 775], [100, 720], [215, 770], [215, 880], [120, 940], [5, 880]] },
  { id: "bar", poligono: [[160, 705], [250, 655], [370, 705], [370, 820], [280, 870], [165, 820]] },
  { id: "supermercado", poligono: [[610, 800], [830, 680], [960, 740], [960, 890], [760, 1030], [610, 960]] },
  { id: "acougue", poligono: [[305, 915], [415, 855], [550, 905], [550, 1040], [480, 1076], [320, 1076], [305, 1000]] },
];

export interface EstadoAlvoExtorsao {
  nome: string;
  meu: boolean;
  bloqueado: boolean;
  pendente: number; // valor acumulado para coletar
}

// "R$ 850", "R$ 12,5 mil"
export function valorCurto(v: number): string {
  if (v >= 1000000) return `R$ ${(v / 1000000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (v >= 10000) return `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.floor(v).toLocaleString("pt-BR")}`;
}

function centro(pol: [number, number][]): [number, number] {
  const xs = pol.map((p) => p[0]);
  const ys = pol.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}

export function MapaExtorsoes({ estados, onLocal }: { estados: Record<string, EstadoAlvoExtorsao>; onLocal: (id: string) => void }) {
  const [nomes, setNomes] = useState(false);
  return (
    <div className="gs-mapa-wrap">
      <BotaoOlho visivel={nomes} alternar={() => setNomes((v) => !v)} />
      <svg viewBox={`0 0 ${W} ${H}`} className="gs-mapa-svg" role="img" aria-label="Mapa do bairro das extorsões">
        <image href="/gangstar/extorsoes/bairro.webp" x={0} y={0} width={W} height={H} />
        <CamadaPeriodo w={W} h={H} />
        {ALVOS_EXTORSAO.map((a) => {
          const e = estados[a.id];
          if (!e) return null;
          return (
            <polygon
              key={a.id}
              className={`gs-mapa-alvo ${e.meu ? "gs-mapa-alvo-dominado" : ""}`}
              points={a.poligono.map((p) => p.join(",")).join(" ")}
              role="button"
              tabIndex={0}
              aria-label={e.nome}
              onClick={() => onLocal(a.id)}
              onKeyDown={(ev) => (ev.key === "Enter" || ev.key === " ") && onLocal(a.id)}
            >
              <title>{e.nome}</title>
            </polygon>
          );
        })}
        {ALVOS_EXTORSAO.map((a) => {
          const e = estados[a.id];
          if (!e) return null;
          const [cx, cy] = centro(a.poligono);
          if (e.meu) {
            // valor acumulado em cima do predio (atualiza sozinho a cada tick do jogo)
            const texto = valorCurto(e.pendente);
            const larg = texto.length * 17 + 30;
            const topo = Math.max(30, Math.min(...a.poligono.map((p) => p[1])) + 6);
            const x = Math.max(larg / 2 + 4, Math.min(W - larg / 2 - 4, cx));
            // no canto superior direito fica o botao do olho: desce um pouco o valor
            const topoFinal = x > W - 260 && topo < 130 ? 130 : topo;
            return (
              <g key={`m-${a.id}`} className={e.pendente > 0 ? "gs-mapa-valor gs-mapa-moeda" : "gs-mapa-valor"} pointerEvents="none">
                <rect x={x - larg / 2} y={topoFinal - 24} width={larg} height={46} rx={14} fill="#123222" stroke="#4caf7a" strokeWidth={4} />
                <text x={x} y={topoFinal + 10} textAnchor="middle" fontSize={30} fontWeight={700} fill={e.pendente > 0 ? "#7de8a3" : "#8fbfa0"}>
                  {texto}
                </text>
              </g>
            );
          }
          if (!e.meu && e.bloqueado) {
            return (
              <g key={`c-${a.id}`} pointerEvents="none">
                <circle cx={cx} cy={cy} r={24} fill="rgba(21,10,36,0.82)" stroke="#5a4a72" strokeWidth={3} />
                <text x={cx} y={cy + 10} textAnchor="middle" fontSize={26}>
                  🔒
                </text>
              </g>
            );
          }
          return null;
        })}
        {nomes && (
          <TagsMapa
            larguraMapa={W}
            tags={ALVOS_EXTORSAO.filter((a) => estados[a.id]).map((a) => ({ id: a.id, texto: estados[a.id].nome, poligono: a.poligono, destaque: estados[a.id].meu }))}
          />
        )}
      </svg>
    </div>
  );
}
