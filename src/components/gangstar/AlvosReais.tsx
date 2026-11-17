"use client";

// Gangstar: jogadores reais na Emboscada. O ataque vai para o servidor, que sorteia o
// resultado uma vez so; este aparelho aplica o lado do atacante do mesmo registro.

import { useEffect, useState } from "react";
import { GangstarSave, poderEmboscada } from "@/lib/gangstar";
import { aplicarAtaque, atacarJogador, atualizarJogadores, listaJogadores, ouvirJogadores } from "@/lib/multiplayer";
import { ENERGIA_PVP, NIVEL_PVP, RECARGA_MESMO_ALVO_H, chancePvp } from "@/lib/pvp";
import { useConta } from "./conta";
import type { ResultadoPopup } from "./PopupResultado";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function AlvosReais({
  save,
  aoAtualizar,
  aoResultado,
}: {
  save: GangstarSave;
  aoAtualizar: (s: GangstarSave) => void;
  aoResultado: (r: ResultadoPopup) => void;
}) {
  const conta = useConta();
  const [, forcar] = useState(0);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => ouvirJogadores(() => forcar((n) => n + 1)), []);
  useEffect(() => {
    atualizarJogadores();
  }, []);
  if (!conta) return null;

  const p = save.personagem;
  const meuPoder = poderEmboscada(save);
  const alvos = listaJogadores().filter((j) => j.nivel >= NIVEL_PVP);

  const atacar = async (id: string, nome: string) => {
    setMsg(null);
    setOcupado(id);
    const r = await atacarJogador(id);
    setOcupado(null);
    if (r.erro || !r.ataque) return setMsg(`⚠️ ${r.erro}`);
    const a = r.ataque;
    aoAtualizar(aplicarAtaque(save, a, conta.userId));
    const e = a.efeito_atacante;
    aoResultado({
      sucesso: a.venceu,
      titulo: a.venceu ? `💥 Você venceu ${nome}!` : `🛡️ ${nome} se defendeu!`,
      linhas: [
        ...(e.dinheiro ? [`💰 +${formatarDinheiro(e.dinheiro)}`] : []),
        ...(e.sujo ? [`🩸 +${formatarDinheiro(e.sujo)} (sujo)`] : []),
        `⭐ ${e.respeito > 0 ? "+" : ""}${e.respeito} respeito`,
        `❤️ ${e.vida} vida · ⚡ ${e.energia} energia`,
        ...(e.xp ? [`✨ +${e.xp} XP`] : []),
        `Chance era de ${Math.round(a.chance * 100)}%. ${nome} já recebeu o mesmo resultado no aparelho dele.`,
      ],
    });
    atualizarJogadores();
  };

  return (
    <div className="gs-alvos-reais">
      <h3 className="gs-h3">⚔️ Jogadores reais</h3>
      <p className="gs-p-intro">
        Ataque outros jogadores (nível {NIVEL_PVP}+). Custa ⚡{ENERGIA_PVP}. Vencendo, você leva 20% do dinheiro sujo dele (ou 12% do limpo, se ele não tiver sujo), tudo como dinheiro sujo. O mesmo alvo só a cada {RECARGA_MESMO_ALVO_H}h.
      </p>
      {msg && <div className="gs-aviso">{msg}</div>}
      {alvos.length === 0 ? (
        <p className="gs-dica">Nenhum outro jogador no nível {NIVEL_PVP}+ ainda. Chame os amigos!</p>
      ) : (
        <div className="gs-lista">
          {alvos.map((j) => {
            const protegido = !!j.protegido_ate && new Date(j.protegido_ate).getTime() > Date.now();
            const chance = Math.round(chancePvp(meuPoder, Number(j.poder)) * 100);
            return (
              <div key={j.id} className={`gs-card gs-card-real ${protegido ? "gs-card-bloqueado" : ""}`}>
                <span className="gs-card-emoji">👤</span>
                <div className="gs-card-corpo">
                  <strong>
                    {j.nome}
                    {j.gangue ? ` · ${j.gangue}` : ""}
                  </strong>
                  <span className="gs-card-sub">
                    Nível {j.nivel} · poder {Number(j.poder)} · {Number(j.respeito).toLocaleString("pt-BR")} de respeito
                  </span>
                  <span className={`gs-card-sub ${chance >= 50 ? "gs-ok" : "gs-risco"}`}>{protegido ? "🛡️ Protegido por enquanto" : `Chance de vitória: ${chance}%`}</span>
                </div>
                <button
                  className="gs-btn-mini gs-btn-mini-perigo"
                  disabled={protegido || !!ocupado || !!p.preso || p.energia < ENERGIA_PVP || p.vida <= 15 || p.nivel < NIVEL_PVP}
                  onClick={() => atacar(j.id, j.nome)}
                >
                  {ocupado === j.id ? "…" : "Atacar"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
