"use client";

// Gangstar: mapa ilustrado do Hub da cidade. Todos os predios ja estao prontos; cada
// um clicavel leva ao servico correspondente (hospital, banco, academia, escola,
// policia, mercado negro e boate). Os demais predios sao so cenario por enquanto.
// v4.58: etiquetas de nome (botao de olho) e o botao do Mercador quando ele aparece.

import { useState, type ReactNode } from "react";
import { CamadaPeriodo } from "./periodo";
import { BotaoOlho, TagsMapa } from "./TagsMapa";

export type LocalHub = "hospital" | "banco" | "academia" | "escola" | "policia" | "mercado" | "boates" | "bolsa" | "lavanderia";

const W = 976;
const H = 1089;

// Ordem importa: os ultimos ficam por cima (predios da frente).
const ALVOS: { id: LocalHub; nome: string; poligono: [number, number][] }[] = [
  { id: "hospital", nome: "Hospital", poligono: [[108, 0], [408, 0], [408, 195], [255, 278], [108, 215]] },
  { id: "banco", nome: "Banco", poligono: [[688, 0], [976, 0], [976, 215], [930, 235], [820, 195], [688, 160]] },
  { id: "escola", nome: "Escola", poligono: [[162, 385], [275, 326], [365, 378], [365, 510], [290, 550], [225, 545], [162, 440]] },
  { id: "academia", nome: "Academia", poligono: [[18, 460], [120, 405], [222, 455], [222, 600], [140, 650], [18, 600]] },
  // v4.63: o predio de vidro da esquina (4o a partir do canto inferior esquerdo)
  // v1.4: o pavilhao de vidro isolado no meio, entre o Hospital e o Banco
  { id: "lavanderia", nome: "Lavanderia", poligono: [[465, 265], [575, 228], [690, 262], [690, 345], [640, 390], [560, 400], [480, 385], [465, 330]] },
  { id: "bolsa", nome: "Bolsa de Valores", poligono: [[445, 535], [520, 478], [600, 505], [645, 535], [645, 660], [600, 690], [540, 700], [495, 690], [445, 645]] },
  { id: "mercado", nome: "Mercado Negro", poligono: [[750, 375], [855, 318], [965, 370], [965, 500], [870, 570], [750, 510]] },
  {
    id: "policia",
    nome: "Delegacia",
    poligono: [[12, 770], [110, 720], [155, 740], [155, 665], [250, 605], [330, 640], [400, 700], [400, 790], [330, 830], [250, 850], [250, 870], [130, 940], [12, 890]],
  },
  { id: "boates", nome: "Boate", poligono: [[605, 820], [700, 770], [760, 735], [840, 685], [976, 730], [976, 880], [820, 990], [710, 1010], [605, 950]] },
];

export function MapaHub({ onLocal, extra }: { onLocal: (local: LocalHub) => void; extra?: ReactNode }) {
  const [nomes, setNomes] = useState(false);
  return (
    <div className="gs-mapa-wrap">
      <BotaoOlho visivel={nomes} alternar={() => setNomes((v) => !v)} />
      {extra}
      <svg viewBox={`0 0 ${W} ${H}`} className="gs-mapa-svg" role="img" aria-label="Mapa do centro da cidade">
        <image href="/gangstar/hub/cidade-hub.webp" x={0} y={0} width={W} height={H} />
        <CamadaPeriodo w={W} h={H} />
        {ALVOS.map((a) => (
          <polygon
            key={a.id}
            className="gs-mapa-alvo"
            points={a.poligono.map((p) => p.join(",")).join(" ")}
            role="button"
            tabIndex={0}
            aria-label={a.nome}
            onClick={() => onLocal(a.id)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onLocal(a.id)}
          >
            <title>{a.nome}</title>
          </polygon>
        ))}
        {nomes && <TagsMapa larguraMapa={W} tags={ALVOS.map((a) => ({ id: a.id, texto: a.nome, poligono: a.poligono }))} />}
      </svg>
    </div>
  );
}
