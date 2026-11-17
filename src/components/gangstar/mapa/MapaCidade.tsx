"use client";

// Gangstar: mapa da "Minha Cidade" (v6). A cidade e uma ilustracao fixa com 11 predios
// abandonados a venda. Cada predio tem uma funcao propria; quando voce compra, a
// versao construida dele e desenhada por cima (camadas recortadas das duas ilustracoes:
// cidade abandonada x cidade construida), da parte de tras para a frente da cena.
// Sem nomes escritos em cima dos predios: tocar abre o popup de comprar/gerenciar.
// v4.56: nova arte da cidade abandonada (predios em ruinas com placas de "vende-se").
// v4.63.1: arte propria (Royal Tower, Grand Palace, Apothecary, Elite Club...), mesmas posicoes.

import { useState } from "react";
import { PREDIOS, PREDIOS_CIDADE, type PredioInstancia } from "@/lib/gangstar";
import { BotaoOlho, TagsMapa } from "./TagsMapa";
import { CAMADAS_MAPA, MAPA_H, MAPA_W } from "./camadasMapa";

const BASE = "/gangstar/cidade";
// v4.63.1: arte nova da cidade (muda o ?v para o celular nao usar a imagem antiga do cache)
const VERSAO_ARTE = "2";

export function MapaCidade({
  predios,
  pendentes,
  onPredio,
}: {
  predios: Record<string, PredioInstancia>;
  pendentes: Record<string, boolean>;
  onPredio: (predioId: string) => void;
}) {
  const daTrasPraFrente = [...CAMADAS_MAPA].reverse();
  const [nomes, setNomes] = useState(false);

  return (
    <div className="gs-mapa-wrap">
      <BotaoOlho visivel={nomes} alternar={() => setNomes((v) => !v)} />
      <svg viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} className="gs-mapa-svg" role="img" aria-label="Mapa da sua cidade">
        <image href={`${BASE}/cidade-base.webp?v=${VERSAO_ARTE}`} x={0} y={0} width={MAPA_W} height={MAPA_H} />

        {daTrasPraFrente.map((c) =>
          predios[c.id] ? (
            <image key={`predio-${c.id}`} href={`${BASE}/predio-${c.id}.webp?v=${VERSAO_ARTE}`} x={c.predio.x} y={c.predio.y} width={c.predio.w} height={c.predio.h} />
          ) : null,
        )}

        {daTrasPraFrente.map((c) => {
          const construido = !!predios[c.id];
          const poligono = c.poligono;
          const slot = PREDIOS_CIDADE.find((p) => p.id === c.id);
          const nome = slot ? PREDIOS[slot.tipo].nome : c.id;
          return (
            <polygon
              key={`alvo-${c.id}`}
              className={`gs-mapa-alvo ${construido ? "gs-mapa-alvo-meu" : ""}`}
              points={poligono.map((p) => p.join(",")).join(" ")}
              role="button"
              tabIndex={0}
              aria-label={construido ? nome : `Prédio abandonado à venda (${nome})`}
              onClick={() => onPredio(c.id)}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onPredio(c.id)}
            />
          );
        })}

        {CAMADAS_MAPA.map((c) => {
          if (!predios[c.id] || !pendentes[c.id]) return null;
          const cx = c.predio.x + c.predio.w / 2;
          const cy = c.predio.y + 26;
          return (
            <g key={`moeda-${c.id}`} className="gs-mapa-moeda" pointerEvents="none">
              <circle cx={cx} cy={cy} r={22} fill="#1a3a24" stroke="#4caf7a" strokeWidth={5} />
              <text x={cx} y={cy + 10} textAnchor="middle" fontSize={28} fontWeight={700} fill="#7de8a3">
                $
              </text>
            </g>
          );
        })}
        {nomes && (
          <TagsMapa
            larguraMapa={MAPA_W}
            tags={CAMADAS_MAPA.map((c) => {
              const slot = PREDIOS_CIDADE.find((p) => p.id === c.id);
              return { id: c.id, texto: slot ? PREDIOS[slot.tipo].nome : c.id, poligono: c.poligono, destaque: !!predios[c.id] };
            })}
          />
        )}
      </svg>
    </div>
  );
}
