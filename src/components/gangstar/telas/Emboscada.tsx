"use client";

// Gangstar: aba "Emboscada" - arme emboscadas contra gangsters de IA para roubar
// dinheiro e itens. Novos alvos (com nomes novos) toda segunda-feira; cada um custa de 40 a
// 60 de vida para atacar e so pode ser emboscado uma vez por semana.

import { useState } from "react";
import {
  GangstarSave,
  alvoAtacado,
  alvosEmboscada,
  chanceEmboscada,
  emboscar,
  energiaEmboscada,
  tempoNovosAlvos,
  poderEmboscada,
  poderEmboscadaGrupo,
  GOLPES,
  GOLPES_CAPO,
  batalhaCapo,
  capoDaSemana,
  capoDerrotado,
  energiaCapo,
  golpearCapo,
  iniciarBatalhaCapo,
  capoJaEnfrentadoHoje,
  rankingDanoCapo,
  vidaCapo,
  type GolpeId,
  notaQualidade,
  type ResultadoEmboscada,
} from "@/lib/gangstar";
import { itemPorId } from "@/lib/gangstarItens";
import { AlvosReais } from "../AlvosReais";
import { RankingEmboscada } from "../RankingEmboscada";
import { AvisoBuff } from "../AvisoBuff";
import { PopupResultado, type ResultadoPopup } from "../PopupResultado";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function Emboscada({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPopup | null>(null);
  const p = save.personagem;
  const alvos = alvosEmboscada(save);
  const [grupo, setGrupo] = useState(false);
  const emGrupo = grupo && save.bandidos.length > 0;
  const capo = capoDaSemana(save);
  const capoCaiu = capoDerrotado(save);
  const capoHoje = capoJaEnfrentadoHoje(save);
  const batalha = batalhaCapo(save);
  const hpBase = vidaCapo(save);
  // durante a batalha a barra ja desconta o dano das rodadas feitas
  const hpCapo = { max: hpBase.max, atual: Math.max(0, hpBase.atual - (batalhaCapo(save)?.dano ?? 0)) };
  const ranking = rankingDanoCapo(save);
  const [verRanking, setVerRanking] = useState(false);

  const mostrar = (nome: string, res: ResultadoEmboscada | undefined) => {
    if (res?.tipo === "sucesso") {
      setResultado({
        sucesso: true,
        titulo: `🗡️ Emboscada em ${nome} deu certo!`,
        linhas: [
          `💰 +${formatarDinheiro(res.dinheiro)}`,
          ...(res.parteGangue ? [`🤝 Parte da gangue: ${formatarDinheiro(res.parteGangue)}`] : []),
          ...(res.saque ? [`🎁 Saque: ${res.saque.emoji} ${res.saque.nome}`] : []),
          `⭐ +${res.respeito} respeito`,
          `✨ +${res.xp} xp`,
        ],
      });
    } else if (res?.tipo === "falha") {
      setResultado({ sucesso: false, titulo: `💥 ${nome} reagiu!`, linhas: [`Você perdeu ${res.dano} de vida e fugiu.`, ...(res.ocorrencias ?? [])] });
    } else if (res?.tipo === "falha-preso") {
      setResultado({ sucesso: false, titulo: "🚔 A polícia chegou!", linhas: [`Você perdeu ${res.dano} de vida.`, `Preso por ${res.minutos} min (fiança ${formatarDinheiro(res.fianca)}).`, ...(res.ocorrencias ?? [])] });
    }
  };

  const atacar = (id: string) => {
    const alvo = alvos.find((a) => a.id === id);
    const r = emboscar(save, id, emGrupo);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    mostrar(alvo?.nome ?? "o alvo", r.resultado);
  };

  const enfrentarCapo = () => {
    const r = iniciarBatalhaCapo(save, emGrupo);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
  };

  const golpear = (g: GolpeId) => {
    const r = golpearCapo(save, g);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    const f = r.fim;
    if (!f) return;
    setResultado({
      sucesso: f.derrotou,
      titulo: f.derrotou ? `💀 ${capo.nome} caiu!` : `⚔️ Fim da batalha contra ${capo.nome}`,
      linhas: [
        `💥 Você causou ${f.dano} de dano`,
        ...(f.vidaPerdida ? [`❤️ Perdeu ${f.vidaPerdida} de vida`] : []),
        ...(f.dinheiro ? [`💰 +${formatarDinheiro(f.dinheiro)}${f.bonusRanking ? " (+50% por liderar o ranking)" : ""}`] : []),
        ...(f.saque ? [`🎁 Saque: ${f.saque.emoji} ${f.saque.nome} (nota ${notaQualidade(capo.qualidade)})`] : []),
        `⭐ +${f.respeito} respeito`,
        `✨ +${f.xp} xp`,
        ...(f.derrotou ? [] : ["O dano fica acumulado: volte com mais energia para derrubar o capo."]),
        ...f.ocorrencias,
      ],
    });
  };

  return (
    <div className="gs-pagina">
      <h2 className="gs-h2">🗡️ Emboscada</h2>
      <AvisoBuff save={save} tipos={["emboscada", "poder"]} />
      <p className="gs-p-intro">
        Seu poder de ataque: <strong>{emGrupo ? poderEmboscadaGrupo(save) : poderEmboscada(save)}</strong> (você + armas + colete + gangue). Cada emboscada gasta ⚡{energiaEmboscada()} e de ❤️40 a ❤️60 (alvo mais forte custa mais). Cada alvo cai uma vez por semana; novos alvos em{" "}
        {tempoNovosAlvos()}.
      </p>
      <div className="gs-capo-painel">
        <div className="gs-card gs-capo">
          <span className="gs-card-emoji">{capoCaiu ? "💀" : capo.emoji}</span>
          <div className="gs-card-corpo">
            <strong>Capo da semana: {capo.nome}</strong>
            <span className="gs-card-sub">
              Poder {capo.poder} · {formatarDinheiro(capo.dinheiro)} + saque garantido {capo.saque.emoji} {capo.saque.nome} (nota {notaQualidade(capo.qualidade)})
            </span>
            <div className="gs-capo-vida">
              <div className="gs-capo-vida-cheia" style={{ width: `${(hpCapo.atual / hpCapo.max) * 100}%` }} />
              <span>
                ❤️ {hpCapo.atual.toLocaleString("pt-BR")} / {hpCapo.max.toLocaleString("pt-BR")}
              </span>
            </div>
            <span className={`gs-card-sub ${capoCaiu ? "gs-ok" : ""}`}>
              {capoCaiu
                ? "Derrotado! Um novo capo chega na segunda-feira."
                : capoHoje
                  ? "Você já enfrentou o capo hoje (sozinho ou com a gangue). Volte amanhã."
                  : `Uma batalha por dia, de 3 rodadas · ⚡${energiaCapo()} · exige 40 de vida. O dano acumula na semana.`}
            </span>
          </div>
          {!batalha && (
            <button className="gs-btn-mini gs-btn-mini-perigo" disabled={capoCaiu || capoHoje || !!p.preso || p.energia < energiaCapo() || p.vida < 40} onClick={enfrentarCapo}>
              {capoCaiu ? "Caiu" : capoHoje ? "Amanhã" : "Enfrentar"}
            </button>
          )}
        </div>

        {batalha && (
          <div className="gs-batalha-capo">
            <div className="gs-batalha-topo">
              <strong>Rodada {batalha.rodada + 1} de 3</strong>
              <span>Dano nesta batalha: {batalha.dano}</span>
            </div>
            <div className="gs-golpe-capo">
              {GOLPES_CAPO[batalha.rodada].emoji} O capo prepara: <strong>{GOLPES_CAPO[batalha.rodada].nome}</strong> — {GOLPES_CAPO[batalha.rodada].descricao}
              {batalha.fintou && <em> Você fintou: seu próximo ataque causa o dobro!</em>}
            </div>
            <div className="gs-golpes">
              {(Object.keys(GOLPES) as GolpeId[]).map((g) => (
                <button key={g} className="gs-golpe" disabled={g === "granada" && batalha.granadaUsada} onClick={() => golpear(g)}>
                  <span>{GOLPES[g].emoji}</span>
                  <strong>{GOLPES[g].nome}</strong>
                  <small>{g === "granada" && batalha.granadaUsada ? "já usada" : GOLPES[g].descricao}</small>
                </button>
              ))}
            </div>
            {batalha.log.length > 0 && (
              <div className="gs-batalha-log">
                {batalha.log.map((l, i) => (
                  <span key={i}>{l}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <button className="gs-btn-link" onClick={() => setVerRanking(!verRanking)}>
          🏆 Ranking de dano da semana {verRanking ? "▲" : "▼"}
        </button>
        {verRanking && (
          <div className="gs-placar-torneio">
            {ranking.map((r, i) => (
              <span key={r.nome} className={r.voce ? "gs-placar-voce" : ""}>
                {i + 1}º {r.nome} — {r.dano.toLocaleString("pt-BR")}
              </span>
            ))}
            <small className="gs-dica">Quem lidera o ranking ao derrubar o capo ganha +50% do dinheiro.</small>
          </div>
        )}
      </div>

      <label className={`gs-toggle-grupo ${save.bandidos.length === 0 ? "gs-card-bloqueado" : ""}`}>
        <input type="checkbox" checked={emGrupo} disabled={save.bandidos.length === 0} onChange={(e) => setGrupo(e.target.checked)} />
        <span>
          🪖 Emboscada em grupo ({save.bandidos.length} bandidos) — poder {poderEmboscadaGrupo(save)}. A gangue fica com 20% do dinheiro e cada bandido tem 8% de chance de morrer se der errado.
        </span>
      </label>

      <AlvosReais save={save} aoAtualizar={aoAtualizar} aoResultado={setResultado} />

      <h3 className="gs-h3">🗡️ Alvos de IA</h3>
      <RankingEmboscada save={save} aoAtualizar={aoAtualizar} />
      {p.vida <= 40 && <div className="gs-aviso">❤️ Você está muito ferido para emboscar (os alvos custam de 40 a 60 de vida). Cure-se no Hospital ou use um medicamento.</div>}
      {mensagem && <div className="gs-aviso">{mensagem}</div>}
      <div className="gs-lista">
        {alvos.map((a) => {
          const feito = alvoAtacado(save, a.id);
          const chance = Math.round(chanceEmboscada(save, a, emGrupo) * 100);
          const saque = itemPorId(a.saque);
          return (
            <div key={a.id} className={`gs-card ${feito ? "gs-card-bloqueado" : ""}`}>
              <span className="gs-card-emoji">{a.emoji}</span>
              <div className="gs-card-corpo">
                <strong>{a.nome}</strong>
                <span className="gs-card-sub">
                  Poder {a.poder} · ❤️{a.vida} · leva até {formatarDinheiro(a.dinheiro)}
                  {saque ? ` · pode ter ${saque.emoji}` : ""}
                </span>
                <span className={`gs-card-sub ${chance < 40 ? "gs-risco" : "gs-ok"}`}>{chance}% de chance</span>
              </div>
              <button className="gs-btn-mini" disabled={feito || !!p.preso || p.energia < energiaEmboscada() || p.vida <= a.vida} onClick={() => atacar(a.id)}>
                {feito ? "Feito" : "Emboscar"}
              </button>
            </div>
          );
        })}
      </div>
      <PopupResultado resultado={resultado} aoFechar={() => setResultado(null)} />
    </div>
  );
}
