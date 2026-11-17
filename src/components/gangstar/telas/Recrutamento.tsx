"use client";

// Gangstar: Ponto de Recrutamento (o coreto do mapa). Tres abas para contratar bandidos
// para a gangue - Assaltante, Piloto de fuga e Contrabandista. Cada um soma poder e uma
// vantagem, mas traz um risco (comissao, morte em guerra/fuga, traicao).

import { useState } from "react";
import {
  CLASSES_BANDIDO,
  GangstarSave,
  MAX_BANDIDOS_POR_CLASSE,
  candidatosBandidos,
  contratarBandido,
  custoBonusLealdade,
  dispensarBandido,
  minutosParaNovosCandidatos,
  pagarBonusBandido,
  resumoBandidos,
  type ClasseBandido,
  NIVEL_MAX_BANDIDO,
  xpParaProximoNivelBandido,
  saldoAceitandoSujo,
} from "@/lib/gangstar";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function quandoFoi(ms: number): string {
  const min = Math.floor((Date.now() - ms) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

export function Recrutamento({ save, aoAtualizar, aoVoltar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void; aoVoltar: () => void }) {
  const [aba, setAba] = useState<ClasseBandido>("assaltante");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const def = CLASSES_BANDIDO.find((c) => c.id === aba)!;
  const meus = save.bandidos.filter((b) => b.classe === aba);
  const candidatos = candidatosBandidos(save, aba);
  const resumo = resumoBandidos(save);
  const lotado = meus.length >= MAX_BANDIDOS_POR_CLASSE;

  const rodar = (r: { save: GangstarSave; erro?: string }, ok?: string) => {
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    setMensagem(ok ?? null);
    aoAtualizar(r.save);
  };

  return (
    <div className="gs-pagina">
      <button className="gs-link-voltar" onClick={aoVoltar}>
        ← Voltar ao mapa
      </button>
      <h2 className="gs-h2">🎯 Recrutamento</h2>
      <p className="gs-p-intro">
        Contrate bandidos para a <strong>{save.personagem.gangue}</strong>. Juntos eles somam {resumo.poderTotal} de poder na guerra de gangues, e são a sua equipe nos roubos em equipe (assaltante = atirador, piloto = motorista, contrabandista = hacker e negociador).
      </p>

      <div className="gs-resumo-bandidos">
        <div>🔫 +{resumo.poderRoubo} poder nos roubos</div>
        <div>🏎️ −{resumo.reducaoPrisao}% chance de prisão</div>
        <div>📦 +{resumo.bonusColeta}% nas coletas</div>
        <div>💸 {resumo.comissao}% de comissão por roubo</div>
      </div>

      <div className="gs-sub-abas gs-sub-abas-bandidos">
        {CLASSES_BANDIDO.map((c) => (
          <button
            key={c.id}
            className={`gs-sub-aba ${aba === c.id ? "gs-sub-aba-ativa" : ""}`}
            onClick={() => {
              setAba(c.id);
              setMensagem(null);
            }}
          >
            {c.emoji} {c.nome.toUpperCase()}
          </button>
        ))}
      </div>

      {mensagem && <div className="gs-aviso">{mensagem}</div>}

      <div className="gs-card gs-classe-bandido">
        <span className="gs-card-emoji">{def.emoji}</span>
        <div className="gs-card-corpo">
          <strong>{def.nome}</strong>
          <span className="gs-card-sub">✅ {def.vantagem}</span>
          <span className="gs-card-sub gs-risco">⚠️ {def.risco}</span>
        </div>
      </div>

      <h3 className="gs-h3">
        Sua equipe ({meus.length}/{MAX_BANDIDOS_POR_CLASSE})
      </h3>
      {meus.length === 0 && <p className="gs-dica">Nenhum {def.nome.toLowerCase()} na gangue ainda.</p>}
      <div className="gs-lista">
        {meus.map((b) => (
          <div key={b.id} className="gs-card gs-card-ativo">
            <span className="gs-card-emoji">{def.emoji}</span>
            <div className="gs-card-corpo">
              <strong>
                {b.nome} · N{b.nivel}
              </strong>
              <span className="gs-card-sub">
                Poder {b.poder} · lealdade <span className={b.lealdade < 50 ? "gs-risco" : ""}>{b.lealdade}%</span>
              </span>
              {b.nivel < NIVEL_MAX_BANDIDO ? (
                <div className="gs-xp-bandido" title="XP ganho nos roubos em equipe">
                  <div style={{ width: `${Math.min(100, ((b.xp ?? 0) / xpParaProximoNivelBandido(b.nivel)) * 100)}%` }} />
                  <span>
                    XP {b.xp ?? 0}/{xpParaProximoNivelBandido(b.nivel)}
                  </span>
                </div>
              ) : (
                <span className="gs-card-sub gs-ok">Nível máximo</span>
              )}
            </div>
            <div className="gs-botoes-coluna">
              <button className="gs-btn-mini" disabled={b.lealdade >= 100 || saldoAceitandoSujo(save.personagem) < custoBonusLealdade(b)} onClick={() => rodar(pagarBonusBandido(save, b.id), `💵 ${b.nome} ficou mais leal.`)}>
                Bônus {formatarDinheiro(custoBonusLealdade(b))}
              </button>
              <button className="gs-btn-mini gs-btn-mini-perigo" onClick={() => rodar({ save: dispensarBandido(save, b.id) }, `${b.nome} foi dispensado.`)}>
                Dispensar
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 className="gs-h3">Disponíveis para contratar</h3>
      <p className="gs-dica">Novos candidatos em {minutosParaNovosCandidatos()} min. Candidatos melhores aparecem conforme seu nível sobe.</p>
      <div className="gs-lista">
        {candidatos.map((c) => (
          <div key={c.id} className="gs-card">
            <span className="gs-card-emoji">{def.emoji}</span>
            <div className="gs-card-corpo">
              <strong>
                {c.nome} · N{c.nivel}
              </strong>
              <span className="gs-card-sub">
                Poder {c.poder}
                {c.comissao > 0 && ` · comissão ${Math.round(c.comissao * 100)}%`}
              </span>
            </div>
            <button className="gs-btn-mini" disabled={lotado || saldoAceitandoSujo(save.personagem) < c.custo} onClick={() => rodar(contratarBandido(save, c), `🤝 ${c.nome} entrou para a gangue!`)}>
              {lotado ? "Lotado" : formatarDinheiro(c.custo)}
            </button>
          </div>
        ))}
        {candidatos.length === 0 && <p className="gs-dica">Você já contratou todos desta rodada.</p>}
      </div>

      {save.registroGangue.length > 0 && (
        <>
          <h3 className="gs-h3">Ocorrências</h3>
          <div className="gs-lista gs-registro-gangue">
            {save.registroGangue.slice(0, 10).map((o, i) => (
              <p key={i} className="gs-registro-linha">
                <span>{o.texto}</span> <small>{quandoFoi(o.quando)}</small>
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
