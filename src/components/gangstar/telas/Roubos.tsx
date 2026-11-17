"use client";

// Gangstar: aba "Roubos" - golpes solo (progressivos por nível) e missões em equipe
// com os bandidos do Ponto de Recrutamento (v4.61). O resultado de cada tentativa
// aparece num popup central, não mais como aviso no topo da página.

import { useState } from "react";
import {
  CLASSES_BANDIDO,
  VIDA_ROUBO_EQUIPE,
  vidaDoRoubo,
  exigenciasMissao,
  poderEquipe,
  type ClasseBandido,
  GangstarSave,
  MISSOES_EQUIPE,
  ROUBOS,
  chanceSucesso,
  poderDeRoubo,
  tentarMissaoEquipe,
  tentarRoubo,
} from "@/lib/gangstar";
import { RARIDADES } from "@/lib/gangstarItens";

const classeBandido = (c: ClasseBandido) => CLASSES_BANDIDO.find((x) => x.id === c)!;

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

type ResultadoPopup = { sucesso: boolean; titulo: string; linhas: string[] };

export function Roubos({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPopup | null>(null);
  const [missaoAberta, setMissaoAberta] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const p = save.personagem;
  const poder = poderDeRoubo(save);

  const tentar = (id: string) => {
    const roubo = ROUBOS.find((r) => r.id === id);
    const { save: novo, resultado: r, erro } = tentarRoubo(save, id);
    if (erro) {
      setMensagem(`⚠️ ${erro}`);
      return;
    }
    aoAtualizar(novo);
    if (r?.tipo === "sucesso") {
      setResultado({
        sucesso: true,
        titulo: `✅ ${roubo?.nome ?? "Roubo"} — sucesso!`,
        linhas: [`💰 +${formatarDinheiro(r.dinheiro)}`, ...(r.comissao ? [`💸 Comissão dos assaltantes: ${formatarDinheiro(r.comissao)}`] : []), `⭐ +${r.respeito} respeito`, `✨ +${r.xp} xp`],
      });
    } else if (r?.tipo === "falha-fugiu") {
      setResultado({ sucesso: false, titulo: `💨 ${roubo?.nome ?? "Roubo"} — você fugiu`, linhas: ["Não deu pra completar, mas você escapou de mãos vazias.", ...(r.ocorrencias ?? [])] });
    } else if (r?.tipo === "falha-preso") {
      setResultado({
        sucesso: false,
        titulo: `🚔 ${roubo?.nome ?? "Roubo"} — você foi pego!`,
        linhas: [`Preso por ${r.minutos} min`, `Fiança: ${formatarDinheiro(r.fianca)}`, ...(r.ocorrencias ?? [])],
      });
    }
  };

  const abrirMissao = (id: string) => {
    setMissaoAberta(missaoAberta === id ? null : id);
    setSelecionados([]);
  };

  const alternarMembro = (id: string) => {
    setSelecionados((atual) => (atual.includes(id) ? atual.filter((m) => m !== id) : [...atual, id]));
  };

  const tentarEquipe = (id: string) => {
    const missao = MISSOES_EQUIPE.find((m) => m.id === id);
    const { save: novo, resultado: r, erro, raro } = tentarMissaoEquipe(save, id, selecionados);
    if (erro) {
      setMensagem(`⚠️ ${erro}`);
      return;
    }
    aoAtualizar(novo);
    setMissaoAberta(null);
    setSelecionados([]);
    if (r?.tipo === "sucesso") {
      setResultado({
        sucesso: true,
        titulo: `✅ ${missao?.nome ?? "Missão"} — concluída!`,
        linhas: [
          `💰 +${formatarDinheiro(r.dinheiro)}`,
          `⭐ +${r.respeito} respeito`,
          `✨ +${r.xp} xp`,
          ...novo.bandidos
            .filter((b) => selecionados.includes(b.id))
            .map((b) => ({ b, antes: save.bandidos.find((x) => x.id === b.id) }))
            .filter(({ b, antes }) => antes && b.nivel > antes.nivel)
            .map(({ b, antes }) => `⬆️ ${b.nome} subiu para o nível ${b.nivel} (poder ${antes!.poder} → ${b.poder})`),
          ...(raro ? [`💎 ITEM RARO: ${raro.emoji} ${raro.nome} (${RARIDADES[raro.raridade ?? "comum"].nome}) — ${raro.descricao}. Equipe no Perfil!`] : []),
        ],
      });
    } else if (r?.tipo === "falha-fugiu") {
      setResultado({ sucesso: false, titulo: `💨 ${missao?.nome ?? "Missão"} — a equipe fugiu`, linhas: ["Não deu pra completar, mas todos escaparam."] });
    } else if (r?.tipo === "falha-preso") {
      setResultado({
        sucesso: false,
        titulo: `🚔 ${missao?.nome ?? "Missão"} — vocês foram pegos!`,
        linhas: [`Preso por ${r.minutos} min`, `Fiança: ${formatarDinheiro(r.fianca)}`],
      });
    }
  };

  return (
    <div className="gs-pagina">
      <h2 className="gs-h2">🎯 Roubos</h2>
      <p className="gs-p-intro">Seu poder atual: {poder}</p>

      {p.preso && <div className="gs-aviso">🚔 Você está preso — vá à aba Cidade para pagar fiança ou esperar.</div>}
      {mensagem && <div className="gs-aviso gs-aviso-msg">{mensagem}</div>}

      <h3 className="gs-h3">Solo</h3>
      <div className="gs-lista">
        {ROUBOS.map((r) => {
          const bloqueado = p.nivel < r.nivelMin;
          const chance = Math.round(chanceSucesso(save, r) * 100);
          const semEnergia = p.energia < r.energiaCusto;
          return (
            <div key={r.id} className={`gs-card gs-roubo ${bloqueado ? "gs-card-bloqueado" : ""}`}>
              <span className="gs-card-emoji">{bloqueado ? "🔒" : r.emoji}</span>
              <div className="gs-card-corpo">
                <strong>{r.nome}</strong>
                <span className="gs-card-sub">
                  {bloqueado
                    ? `Nível ${r.nivelMin} necessário`
                    : `⚡${r.energiaCusto} · ${vidaDoRoubo(r.id) ? `❤️-${vidaDoRoubo(r.id)} · ` : ""}${formatarDinheiro(r.dinheiroMin)}–${formatarDinheiro(r.dinheiroMax)} · ${chance}% de sucesso`}
                </span>
              </div>
              {!bloqueado && (
                <button className="gs-btn-mini" disabled={!!p.preso || semEnergia} onClick={() => tentar(r.id)}>
                  Tentar
                </button>
              )}
            </div>
          );
        })}
      </div>

      <h3 className="gs-h3">Em equipe</h3>
      <p className="gs-p-intro">Missões maiores com a sua equipe de bandidos (contratados no Ponto de Recrutamento). 💎 Só aqui caem itens raros para o slot Especial.</p>
      <div className="gs-lista">
        {MISSOES_EQUIPE.map((m) => {
          const bloqueado = p.nivel < m.nivelMin;
          const semEnergia = p.energia < m.energiaCusto;
          const aberta = missaoAberta === m.id;
          return (
            <div key={m.id} className="gs-lista-item-expandivel">
              <div className={`gs-card gs-roubo ${bloqueado ? "gs-card-bloqueado" : ""}`}>
                <span className="gs-card-emoji">{bloqueado ? "🔒" : m.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{m.nome}</strong>
                  <span className="gs-card-sub">
                    {bloqueado
                      ? `Nível ${m.nivelMin} necessário`
                      : `⚡${m.energiaCusto} · ❤️-${VIDA_ROUBO_EQUIPE} · ${formatarDinheiro(m.dinheiroMin)}–${formatarDinheiro(m.dinheiroMax)} · requer ${exigenciasMissao(m)
                          .map((c) => classeBandido(c).emoji)
                          .join(" ")}`}
                  </span>
                </div>
                {!bloqueado && (
                  <button className="gs-btn-mini" disabled={!!p.preso || semEnergia} onClick={() => abrirMissao(m.id)}>
                    {aberta ? "Fechar" : "Montar equipe"}
                  </button>
                )}
              </div>
              {aberta && (
                <div className="gs-painel-equipe">
                  {save.bandidos.length === 0 ? (
                    <p className="gs-dica">Você ainda não tem bandidos. Contrate no Ponto de Recrutamento (o coreto da sua cidade).</p>
                  ) : (
                    <>
                      <p className="gs-dica">
                        Escolha os bandidos (precisa cobrir: {exigenciasMissao(m).map((c) => classeBandido(c).nome).join(", ")}). Poder da equipe:{" "}
                        <strong>{poderEquipe(save, save.bandidos.filter((b) => selecionados.includes(b.id)))}</strong> · dificuldade {m.dificuldade}.
                      </p>
                      <div className="gs-lista">
                        {save.bandidos.map((b) => (
                          <label key={b.id} className={`gs-card gs-membro-selecionavel ${selecionados.includes(b.id) ? "gs-card-ativo" : ""}`}>
                            <input type="checkbox" checked={selecionados.includes(b.id)} onChange={() => alternarMembro(b.id)} />
                            <span className="gs-card-emoji">{classeBandido(b.classe).emoji}</span>
                            <div className="gs-card-corpo">
                              <strong>
                                {b.nome} · N{b.nivel}
                              </strong>
                              <span className="gs-card-sub">
                                {classeBandido(b.classe).nome} · poder {b.poder} · lealdade {b.lealdade}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                      <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => tentarEquipe(m.id)}>
                        Executar missão
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {resultado && (
        <div className="gs-popup-fundo" onClick={() => setResultado(null)}>
          <div className={`gs-popup-painel gs-popup-resultado ${resultado.sucesso ? "gs-popup-resultado-ok" : "gs-popup-resultado-falha"}`} onClick={(e) => e.stopPropagation()}>
            <div className="gs-popup-topo">
              <h3 className="gs-h3" style={{ margin: 0 }}>
                {resultado.titulo}
              </h3>
              <button className="gs-popup-fechar" onClick={() => setResultado(null)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="gs-resultado-linhas">
              {resultado.linhas.map((linha, i) => (
                <p key={i} className="gs-resultado-linha">
                  {linha}
                </p>
              ))}
            </div>
            <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => setResultado(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
