"use client";

// Gangstar: aba "Missoes" - missoes diarias (v1.11), historia em capitulos (um objetivo de
// cada vez para o jogador seguir) e conquistas com recompensa em dinheiro.

import { useState } from "react";
import {
  CONQUISTAS,
  ESCOLHA_HISTORIA,
  GangstarSave,
  TOTAL_CAPITULOS,
  caminhoHistoria,
  capituloAtual,
  capituloCompleto,
  capituloPedeEscolha,
  capitulosDoJogador,
  resgatarCapitulo,
  resgatarConquista,
  bonusDiariasDisponivel,
  missoesDiarias,
} from "@/lib/gangstar";
import { MissoesDiarias } from "../MissoesDiarias";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function Missoes({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [aba, setAba] = useState<"diarias" | "historia" | "conquistas">("diarias");
  const diariaProntas = missoesDiarias(save).some((m) => !m.resgatada && m.progresso >= m.alvo) || bonusDiariasDisponivel(save);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const cap = capituloAtual(save);
  const numero = save.historia.capitulo + 1;
  const completo = capituloCompleto(save);
  const pedeEscolha = capituloPedeEscolha(save);
  const caminho = caminhoHistoria(save);
  const lista = capitulosDoJogador(save);
  const feitas = save.conquistas.length;

  const rodar = (r: { save: GangstarSave; erro?: string }, ok: string) => {
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    setMensagem(ok);
    aoAtualizar(r.save);
  };

  return (
    <div className="gs-pagina">
      <h2 className="gs-h2">📜 Missões</h2>
      <div className="gs-sub-abas">
        <button className={`gs-sub-aba ${aba === "diarias" ? "gs-sub-aba-ativa" : ""}`} onClick={() => setAba("diarias")}>
          DIÁRIAS {diariaProntas && "•"}
        </button>
        <button className={`gs-sub-aba ${aba === "historia" ? "gs-sub-aba-ativa" : ""}`} onClick={() => setAba("historia")}>
          HISTÓRIA {completo && "•"}
        </button>
        <button className={`gs-sub-aba ${aba === "conquistas" ? "gs-sub-aba-ativa" : ""}`} onClick={() => setAba("conquistas")}>
          CONQUISTAS {feitas}/{CONQUISTAS.length}
        </button>
      </div>
      {mensagem && <div className="gs-aviso">{mensagem}</div>}

      {aba === "diarias" && <MissoesDiarias save={save} aoAtualizar={aoAtualizar} aoMensagem={setMensagem} />}

      {aba === "historia" && !cap && (
        <div className="gs-capitulo gs-capitulo-fim">
          <span className="gs-capitulo-num">FIM</span>
          <strong>{caminho === "guerra" ? "🩸 O Rei Sangrento" : "🤵 O Padrinho"}</strong>
          <p>
            {caminho === "guerra"
              ? "Você escolheu a guerra e os Corvos não existem mais. A cidade te teme."
              : "Você escolheu a aliança e virou a voz que todas as famílias obedecem."}{" "}
            Todos os {TOTAL_CAPITULOS} capítulos concluídos. Novos capítulos chegam nas próximas atualizações.
          </p>
        </div>
      )}

      {aba === "historia" && cap && (
        <>
          <div className="gs-capitulo">
            <span className="gs-capitulo-num">
              CAPÍTULO {numero} DE {TOTAL_CAPITULOS}
              {caminho && ` · ${caminho === "alianca" ? "🤝 ALIANÇA" : "⚔️ GUERRA"}`}
            </span>
            <strong>{cap.titulo}</strong>
            <p>{cap.texto}</p>
            <div className="gs-objetivos">
              {cap.objetivos.map((o) => {
                const prog = Math.min(o.alvo, o.progresso(save));
                const ok = prog >= o.alvo;
                return (
                  <div key={o.texto} className={`gs-objetivo ${ok ? "gs-objetivo-ok" : ""}`}>
                    <span className="gs-objetivo-check">{ok ? "✅" : "⬜"}</span>
                    <div className="gs-objetivo-corpo">
                      <span>{o.texto}</span>
                      <div className="gs-barra-fundo">
                        <div className="gs-barra-preenchida" style={{ background: "#ffb020", width: `${(prog / o.alvo) * 100}%` }} />
                      </div>
                    </div>
                    <small>
                      {prog}/{o.alvo}
                    </small>
                  </div>
                );
              })}
            </div>
            <div className="gs-capitulo-premio">
              Recompensa: 💰 {formatarDinheiro(cap.recompensa.dinheiro)} · ✨ {cap.recompensa.xp} XP · ⭐ {cap.recompensa.respeito}
            </div>
            {pedeEscolha ? (
              <div className="gs-escolha-historia">
                <strong>{ESCOLHA_HISTORIA.pergunta}</strong>
                {ESCOLHA_HISTORIA.opcoes.map((o) => (
                  <button
                    key={o.id}
                    className={`gs-btn gs-btn-bloco ${o.id === "guerra" ? "gs-btn-perigo" : "gs-btn-principal"}`}
                    disabled={!completo}
                    onClick={() => rodar(resgatarCapitulo(save, o.id), `${o.titulo}: o seu caminho está escolhido. Não tem volta.`)}
                  >
                    {o.titulo}
                    <small>{o.texto}</small>
                  </button>
                ))}
                <p className="gs-dica">A escolha muda os próximos capítulos e o final da história. Não dá para voltar atrás.</p>
              </div>
            ) : (
              <button
                className="gs-btn gs-btn-principal gs-btn-bloco"
                disabled={!completo}
                onClick={() => rodar(resgatarCapitulo(save), `🎉 Capítulo "${cap.titulo}" concluído!`)}
              >
                {completo ? "Concluir capítulo" : "Complete os objetivos"}
              </button>
            )}
          </div>
          <div className="gs-capitulos-lista">
            {lista.map((c, i) => (
              <span key={c?.titulo ?? `oculto-${i}`} className={i < save.historia.capitulo ? "gs-cap-feito" : i === save.historia.capitulo ? "gs-cap-atual" : ""}>
                {i < save.historia.capitulo ? "✅" : i === save.historia.capitulo ? "▶️" : "🔒"} {i + 1}. {c?.titulo ?? "??? (depende da sua escolha)"}
              </span>
            ))}
          </div>
        </>
      )}

      {aba === "conquistas" && (
        <div className="gs-lista">
          {CONQUISTAS.map((c) => {
            const resgatada = save.conquistas.includes(c.id);
            const pronta = !resgatada && c.feito(save);
            return (
              <div key={c.id} className={`gs-card ${resgatada ? "gs-card-ativo" : !pronta ? "gs-card-bloqueado" : ""}`}>
                <span className="gs-card-emoji">{c.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{c.nome}</strong>
                  <span className="gs-card-sub">
                    {c.descricao} · {formatarDinheiro(c.recompensa)}
                  </span>
                </div>
                {resgatada ? (
                  <span className="gs-tag">Feita</span>
                ) : (
                  <button className="gs-btn-mini" disabled={!pronta} onClick={() => rodar(resgatarConquista(save, c.id), `${c.emoji} Conquista: ${c.nome}! +${formatarDinheiro(c.recompensa)}`)}>
                    {pronta ? "Resgatar" : "🔒"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
