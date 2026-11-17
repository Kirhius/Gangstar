"use client";

// Gangstar: aba "Gangue" - nome da sua gang, ranking PvE (a equipe agora vem do Ponto de Recrutamento)
// e guerra de território contra as gangues rivais de IA (Fase 3).

import { useState } from "react";
import {
  GangstarSave,
  atacarZona,
  custoCriarGangue,
  definirGangue,
  eventoAtualView,
  rankingGangues,
  territoriosView,
} from "@/lib/gangstar";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function tempoRestante(ms: number): string {
  const horas = Math.floor(ms / 3600000);
  const min = Math.floor((ms % 3600000) / 60000);
  return horas > 0 ? `${horas}h ${min}m` : `${min}m`;
}

type Visao = "ranking" | "territorio";

export function Gangue({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [visao, setVisao] = useState<Visao>("ranking");
  const [nome, setNome] = useState(save.personagem.gangue ?? "");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const p = save.personagem;

  const rodar = (resultado: { save: GangstarSave; erro?: string }, mensagemSucesso?: string) => {
    if (resultado.erro) {
      setMensagem(`⚠️ ${resultado.erro}`);
      return;
    }
    setMensagem(mensagemSucesso ?? null);
    aoAtualizar(resultado.save);
  };

  const salvarNome = () => rodar(definirGangue(save, nome), save.personagem.gangue ? undefined : "🏴 Gangue criada!");
  const atacar = (zonaId: string) => {
    const { save: novo, resultado, erro } = atacarZona(save, zonaId);
    if (erro) {
      setMensagem(`⚠️ ${erro}`);
      return;
    }
    aoAtualizar(novo);
    const baixas = resultado?.ocorrencias?.length ? ` ${resultado.ocorrencias.join(" ")}` : "";
    if (resultado?.tipo === "sucesso") setMensagem(`🚩 Zona conquistada! +${resultado.respeito} respeito.${baixas}`);
    else if (resultado?.tipo === "falha-preso") setMensagem(`🚔 Você foi pego! Preso por ${resultado.minutos} min (fiança ${formatarDinheiro(resultado.fianca)}).${baixas}`);
    else setMensagem(`💨 O ataque falhou, mas você escapou.${baixas}`);
  };

  const ranking = rankingGangues(save);
  const posicao = ranking.findIndex((r) => r.voce) + 1;
  const evento = eventoAtualView(save);
  const zonas = territoriosView(save);
  const zonasDoJogador = zonas.filter((z) => z.ehJogador).length;

  return (
    <div className="gs-pagina">
      <h2 className="gs-h2">🏴 Gangue</h2>

      {evento && (
        <div className="gs-aviso gs-aviso-evento">
          {evento.def.emoji} <strong>{evento.def.nome}</strong> — {evento.def.descricao} (termina em {tempoRestante(evento.expiraEm - Date.now())})
        </div>
      )}
      {mensagem && <div className="gs-aviso gs-aviso-msg">{mensagem}</div>}

      <div className="gs-campo">
        <label className="gs-label" htmlFor="gs-nome-gangue">
          Nome da sua gangue
        </label>
        <div className="gs-linha-campo">
          <input id="gs-nome-gangue" className="gs-input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Coroa Negra" maxLength={24} />
          <button className="gs-btn-mini" onClick={salvarNome}>
            Salvar
          </button>
        </div>
        {!save.personagem.gangue && <p className="gs-dica">Criar uma gangue custa {formatarDinheiro(custoCriarGangue())}.</p>}
      </div>

      <div className="gs-sub-abas">
        <button className={`gs-sub-aba ${visao === "ranking" ? "gs-sub-aba-ativa" : ""}`} onClick={() => setVisao("ranking")}>
          🏆 Ranking
        </button>
        <button className={`gs-sub-aba ${visao === "territorio" ? "gs-sub-aba-ativa" : ""}`} onClick={() => setVisao("territorio")}>
          🗺️ Território ({zonasDoJogador}/{zonas.length})
        </button>
      </div>

      {visao === "ranking" && (
        <>
          <h3 className="gs-h3">Ranking de respeito (PvE)</h3>
          <p className="gs-p-intro">
            Você está em {posicao}º lugar de {ranking.length}.
          </p>
          <div className="gs-lista">
            {ranking.map((r, i) => (
              <div key={r.nome} className={`gs-card gs-ranking-item ${r.voce ? "gs-card-ativo" : ""}`}>
                <span className="gs-card-emoji">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`}</span>
                <div className="gs-card-corpo">
                  <strong>{r.nome}</strong>
                  <span className="gs-card-sub">{r.respeito} de respeito</span>
                </div>
              </div>
            ))}
          </div>

        </>
      )}


      {visao === "territorio" && (
        <>
          <h3 className="gs-h3">Guerra de território</h3>
          <p className="gs-p-intro">Ataque zonas de gangues rivais para ganhar bônus permanentes — mas elas podem tentar retomar.</p>
          <div className="gs-lista">
            {zonas.map((z) => (
              <div key={z.zona.id} className={`gs-card ${z.ehJogador ? "gs-card-ativo" : ""}`}>
                <span className="gs-card-emoji">{z.ehJogador ? "🚩" : "🏴"}</span>
                <div className="gs-card-corpo">
                  <strong>{z.zona.nome}</strong>
                  <span className="gs-card-sub">
                    {z.ehJogador
                      ? `Sua zona · ${z.zona.bonusTipo === "desconto-mercado" ? "desconto no mercado negro" : "produção extra"} +${Math.round(z.zona.bonusValor * 100)}%`
                      : `${z.donoNome} · força ${z.forcaDefesa}`}
                  </span>
                </div>
                {!z.ehJogador && (
                  <button className="gs-btn-mini" disabled={!!p.preso || p.energia < 25} onClick={() => atacar(z.zona.id)}>
                    Atacar ⚡25
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
