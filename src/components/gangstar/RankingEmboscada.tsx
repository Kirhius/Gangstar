"use client";

// Gangstar: ranking semanal de emboscadas (v1.11). Pontos = poder dos alvos de IA vencidos
// na semana. Na segunda-feira o top 3 ganha titulo (uma semana), dinheiro e XP.

import { useState } from "react";
import { GangstarSave, TITULOS_EMBOSCADA, marcarRankingEmboscadaVisto, rankingEmboscadaSemana, tempoNovosAlvos, tituloEmboscadaAtual } from "@/lib/gangstar";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function RankingEmboscada({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [aberto, setAberto] = useState(false);
  const linhas = rankingEmboscadaSemana(save);
  const minha = linhas.findIndex((l) => l.voce) + 1;
  const titulo = tituloEmboscadaAtual(save);
  const ultimo = save.ultimoRankingEmboscada;
  const tituloUltimo = ultimo ? TITULOS_EMBOSCADA.find((t) => t.posicao === ultimo.posicao) : undefined;

  return (
    <div className="gs-ranking-emb">
      {ultimo && !ultimo.visto && (
        <div className={`gs-aviso ${tituloUltimo ? "gs-aviso-ok" : ""}`}>
          {tituloUltimo
            ? `${tituloUltimo.emoji} Semana passada você terminou em ${ultimo.posicao}º nas emboscadas: título "${tituloUltimo.titulo}", +${formatarDinheiro(ultimo.premio)} (sujo) e +${ultimo.xp} xp!`
            : `Semana passada você terminou em ${ultimo.posicao}º nas emboscadas (${ultimo.pontos} pontos). Top 3 ganha título e prêmio.`}
          <button className="gs-btn-link" onClick={() => aoAtualizar(marcarRankingEmboscadaVisto(save))}>
            OK
          </button>
        </div>
      )}
      <button className="gs-btn-link" onClick={() => setAberto(!aberto)}>
        📊 Ranking semanal de emboscadas · você está em {minha}º {titulo ? `· ${titulo.emoji} ${titulo.titulo}` : ""} {aberto ? "▲" : "▼"}
      </button>
      {aberto && (
        <div className="gs-placar-torneio">
          {linhas.map((l, i) => (
            <span key={`${l.nome}-${i}`} className={l.voce ? "gs-placar-voce" : ""}>
              {i < 3 ? TITULOS_EMBOSCADA[i].emoji : `${i + 1}º`} {l.nome}
              {l.voce ? " (você)" : ""} — {l.pontos.toLocaleString("pt-BR")} pts
            </span>
          ))}
          <small className="gs-dica">
            Pontos = poder dos alvos de IA que você venceu nesta semana. Fecha em {tempoNovosAlvos()}: 🥇 {formatarDinheiro(TITULOS_EMBOSCADA[0].premio)}, 🥈{" "}
            {formatarDinheiro(TITULOS_EMBOSCADA[1].premio)}, 🥉 {formatarDinheiro(TITULOS_EMBOSCADA[2].premio)} + XP e um título por uma semana.
          </small>
        </div>
      )}
    </div>
  );
}
