"use client";

// Gangstar: mapa ilustrado do Hub da cidade. Todos os predios ja estao prontos; cada
// um clicavel leva ao servico correspondente (hospital, banco, academia, escola,
// policia, comercio de armas e boate). Os demais predios sao so cenario por enquanto.
// v4.58: etiquetas de nome (botao de olho) e o botao do Mercador quando ele aparece.

import { useState, type ReactNode } from "react";
import { CamadaPeriodo } from "./periodo";
import { BotaoOlho, TagsMapa } from "./TagsMapa";

export type LocalHub = "hospital" | "banco" | "academia" | "escola" | "policia" | "mercado" | "boates" | "bolsa" | "lavanderia";

const W = 976;
const H = 1076;

// v1.6: nova arte do Hub (banco e hospital no topo, bolsa entre eles, escola e academia
// no meio, delegacia e comercio de armas embaixo, lavanderia e boate na frente).
// Ordem importa: os ultimos ficam por cima (predios da frente).
const ALVOS: { id: LocalHub; nome: string; poligono: [number, number][] }[] = [
  { id: "banco", nome: "Banco", poligono: [[115, 0], [375, 0], [375, 195], [255, 245], [115, 190]] },
  { id: "hospital", nome: "Hospital", poligono: [[665, 0], [976, 0], [976, 200], [900, 245], [800, 230], [665, 170]] },
  { id: "bolsa", nome: "Bolsa de Valores", poligono: [[450, 250], [520, 205], [560, 120], [600, 120], [640, 205], [710, 250], [710, 340], [620, 400], [540, 395], [450, 345]] },
  { id: "escola", nome: "Escola", poligono: [[0, 330], [100, 285], [230, 290], [360, 360], [360, 450], [240, 520], [110, 600], [0, 600]] },
  { id: "academia", nome: "Academia", poligono: [[750, 370], [860, 300], [976, 330], [976, 500], [870, 565], [750, 520]] },
  { id: "mercado", nome: "Comércio de armas", poligono: [[305, 600], [455, 505], [635, 560], [635, 690], [520, 760], [440, 785], [305, 710]] },
  { id: "policia", nome: "Delegacia", poligono: [[10, 760], [120, 690], [200, 650], [320, 690], [355, 740], [355, 830], [250, 870], [160, 920], [10, 880]] },
  { id: "boates", nome: "Boate", poligono: [[605, 840], [780, 740], [840, 690], [960, 735], [960, 900], [790, 1000], [700, 1010], [605, 960]] },
  { id: "lavanderia", nome: "Lavanderia", poligono: [[305, 935], [430, 860], [550, 910], [550, 1050], [500, 1076], [320, 1076], [305, 1020]] },
];

export function MapaHub({ onLocal, extra }: { onLocal: (local: LocalHub) => void; extra?: ReactNode }) {
  const [nomes, setNomes] = useState(false);
  return (
    <div className="gs-mapa-wrap">
      <BotaoOlho visivel={nomes} alternar={() => setNomes((v) => !v)} />
      {extra}
      <svg viewBox={`0 0 ${W} ${H}`} className="gs-mapa-svg" role="img" aria-label="Mapa do centro da cidade">
        <image href="/gangstar/hub/cidade-hub-v2.webp" x={0} y={0} width={W} height={H} />
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
