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
import { CamadaPeriodo } from "./periodo";
import { CAMADAS_MAPA, MAPA_H, MAPA_W } from "./camadasMapa";
import { valorCurto } from "./MapaExtorsoes";

// v1.13: etiqueta em cima de cada predio seu - dinheiro acumulado (lojas e predios com renda,
// em verde) ou itens prontos (fabricas, em azul claro), como no mapa das Extorsoes.
export type EtiquetaPredio = { tipo: "dinheiro" | "itens"; valor: number };

const BASE = "/gangstar/cidade";
// v4.63.1: arte nova da cidade (muda o ?v para o celular nao usar a imagem antiga do cache)
const VERSAO_ARTE = "2";

export function MapaCidade({
  predios,
  etiquetas,
  onPredio,
  extra,
}: {
  predios: Record<string, PredioInstancia>;
  etiquetas: Record<string, EtiquetaPredio | null>;
  onPredio: (predioId: string) => void;
  extra?: React.ReactNode;
}) {
  const daTrasPraFrente = [...CAMADAS_MAPA].reverse();
  const [nomes, setNomes] = useState(false);

  return (
    <div className="gs-mapa-wrap">
      <BotaoOlho visivel={nomes} alternar={() => setNomes((v) => !v)} />
      {extra && <div className="gs-mapa-cantos">{extra}</div>}
      <svg viewBox={`0 0 ${MAPA_W} ${MAPA_H}`} className="gs-mapa-svg" role="img" aria-label="Mapa da sua cidade">
        <image href={`${BASE}/cidade-base.webp?v=${VERSAO_ARTE}`} x={0} y={0} width={MAPA_W} height={MAPA_H} />

        {daTrasPraFrente.map((c) =>
          predios[c.id] ? (
            <image key={`predio-${c.id}`} href={`${BASE}/predio-${c.id}.webp?v=${VERSAO_ARTE}`} x={c.predio.x} y={c.predio.y} width={c.predio.w} height={c.predio.h} />
          ) : null,
        )}

        <CamadaPeriodo w={MAPA_W} h={MAPA_H} />

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
          const et = predios[c.id] ? etiquetas[c.id] : null;
          if (!et) return null;
          const itens = et.tipo === "itens";
          const texto = itens ? `📦 ${et.valor}` : valorCurto(et.valor);
          const larg = texto.length * 15 + 26;
          const cx = Math.max(larg / 2 + 4, Math.min(MAPA_W - larg / 2 - 4, c.predio.x + c.predio.w / 2));
          // no canto superior direito fica o botao do olho
          const cy = cx > MAPA_W - 230 && c.predio.y + 26 < 120 ? 120 : Math.max(26, c.predio.y + 26);
          const ativo = et.valor > 0;
          return (
            <g key={`et-${c.id}`} className={ativo ? "gs-mapa-valor gs-mapa-moeda" : "gs-mapa-valor"} pointerEvents="none">
              <rect
                x={cx - larg / 2}
                y={cy - 21}
                width={larg}
                height={40}
                rx={12}
                fill={itens ? "#0f2a3a" : "#123222"}
                stroke={itens ? "#5cc8ff" : "#4caf7a"}
                strokeWidth={4}
              />
              <text x={cx} y={cy + 9} textAnchor="middle" fontSize={26} fontWeight={700} fill={itens ? (ativo ? "#9fe3ff" : "#7fb3c9") : ativo ? "#7de8a3" : "#8fbfa0"}>
                {texto}
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
