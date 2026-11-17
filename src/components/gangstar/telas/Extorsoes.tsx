"use client";

// Gangstar: aba "Extorsões" (rodapé). Domine estabelecimentos com o seu poder e eles
// passam a pagar proteção por hora; cada coleta tem risco de flagrante.

import { useState } from "react";
import {
  EXTORSOES,
  GangstarSave,
  chancePrisaoExtorsao,
  coletarExtorsao,
  conquistarExtorsao,
  energiaConquistaExtorsao,
  extorsaoPendente,
  poderDeRoubo,
} from "@/lib/gangstar";
import { PopupResultado, type ResultadoPopup } from "../PopupResultado";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function Extorsoes({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPopup | null>(null);
  const p = save.personagem;
  const poder = poderDeRoubo(save);

  const conquistar = (id: string) => {
    const def = EXTORSOES.find((e) => e.id === id);
    const r = conquistarExtorsao(save, id);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    setResultado({ sucesso: true, titulo: `${def?.emoji ?? "💼"} Território dominado`, linhas: [`${def?.nome ?? "O estabelecimento"} agora paga proteção pra você.`] });
  };

  const coletar = (id: string) => {
    const def = EXTORSOES.find((e) => e.id === id);
    const r = coletarExtorsao(save, id);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    if (r.resultado?.tipo === "coletou") {
      setResultado({ sucesso: true, titulo: `💰 ${def?.nome ?? "Extorsão"} pagou`, linhas: [`+${formatarDinheiro(r.resultado.valor)}`] });
    } else if (r.resultado?.tipo === "preso") {
      setResultado({
        sucesso: false,
        titulo: "🚔 Flagrante!",
        linhas: [`A polícia te pegou recolhendo em ${def?.nome ?? "um estabelecimento"}.`, `Perdeu ${formatarDinheiro(r.resultado.perdido)}.`, `Preso por ${r.resultado.minutos} min.`],
      });
    }
  };

  return (
    <div className="gs-pagina">
      <h2 className="gs-h2">💼 Extorsões</h2>
      <p className="gs-p-intro">
        Seu poder: <strong>{poder}</strong>. Domine estabelecimentos e eles pagam proteção por hora (acumula até 12h). Cada coleta tem{" "}
        {Math.round(chancePrisaoExtorsao(save) * 100)}% de chance de flagrante: você perde o valor, é preso e perde 100 de respeito. Cada coleta ou conquista custa ❤️1.
      </p>
      {mensagem && <div className="gs-aviso">{mensagem}</div>}
      <div className="gs-lista">
        {EXTORSOES.map((e) => {
          const meu = !!save.extorsoes[e.id];
          const pendente = extorsaoPendente(save, e.id);
          const fraco = poder < e.poderMin;
          return (
            <div key={e.id} className={`gs-card ${meu ? "gs-card-ativo" : fraco ? "gs-card-bloqueado" : ""}`}>
              <span className="gs-card-emoji">{!meu && fraco ? "🔒" : e.emoji}</span>
              <div className="gs-card-corpo">
                <strong>{e.nome}</strong>
                <span className="gs-card-sub">
                  {meu
                    ? `${formatarDinheiro(e.rendaPorHora)}/h · acumulado ${formatarDinheiro(pendente)}`
                    : `Poder ${e.poderMin} · rende ${formatarDinheiro(e.rendaPorHora)}/h · ⚡${energiaConquistaExtorsao()}`}
                </span>
              </div>
              {meu ? (
                <button className="gs-btn-mini" disabled={pendente <= 0 || !!p.preso} onClick={() => coletar(e.id)}>
                  Coletar
                </button>
              ) : (
                <button className="gs-btn-mini" disabled={fraco || !!p.preso || p.energia < energiaConquistaExtorsao()} onClick={() => conquistar(e.id)}>
                  Dominar
                </button>
              )}
            </div>
          );
        })}
      </div>
      <PopupResultado resultado={resultado} aoFechar={() => setResultado(null)} />
    </div>
  );
}
