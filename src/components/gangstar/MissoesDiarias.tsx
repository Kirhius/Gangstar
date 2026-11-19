"use client";

// Gangstar: missoes diarias (3 por dia, trocam a meia-noite). Cada uma da XP e um item;
// completando as 3 ainda tem um bonus com o dobro de XP e um item nota A.

import { GangstarSave, bonusDiariasDisponivel, missoesDiarias, notaQualidade, resgatarBonusDiarias, resgatarDiaria } from "@/lib/gangstar";
import type { ItemDef } from "@/lib/gangstarItens";

function horasAteMeiaNoite(): string {
  const agora = new Date();
  const fim = new Date(agora);
  fim.setHours(24, 0, 0, 0);
  const min = Math.ceil((fim.getTime() - agora.getTime()) / 60000);
  return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}min` : `${min} min`;
}

export function MissoesDiarias({
  save,
  aoAtualizar,
  aoMensagem,
}: {
  save: GangstarSave;
  aoAtualizar: (s: GangstarSave) => void;
  aoMensagem: (m: string) => void;
}) {
  const missoes = missoesDiarias(save);
  const bonus = bonusDiariasDisponivel(save);
  const bonusFeito = !!save.diarias?.bonus && save.diarias.dia === new Date().toLocaleDateString("sv-SE");
  const todas = missoes.every((m) => m.resgatada);

  const rodar = (r: { save: GangstarSave; erro?: string; xp?: number; item?: ItemDef; q?: number }) => {
    if (r.erro) return aoMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    aoMensagem(`✅ +${r.xp} xp${r.item ? ` e ${r.item.emoji} ${r.item.nome} (nota ${notaQualidade(r.q ?? 1)})` : ""}`);
  };

  return (
    <div className="gs-lista">
      <p className="gs-p-intro">Três tarefas por dia. Cada uma dá XP e um item; completando as três ainda tem um bônus. Novas missões em {horasAteMeiaNoite()}.</p>
      {missoes.map((m) => {
        const pronta = m.progresso >= m.alvo;
        return (
          <div key={m.indice} className={`gs-card gs-diaria ${m.resgatada ? "gs-card-bloqueado" : ""}`}>
            <span className="gs-card-emoji">{m.emoji}</span>
            <div className="gs-card-corpo">
              <strong>{m.texto}</strong>
              <div className="gs-diaria-barra">
                <div style={{ width: `${(m.progresso / m.alvo) * 100}%` }} />
              </div>
              <span className="gs-card-sub">
                {m.alvo >= 1000 ? `R$ ${m.progresso.toLocaleString("pt-BR")} de R$ ${m.alvo.toLocaleString("pt-BR")}` : `${m.progresso}/${m.alvo}`} · ✨{m.xp} xp + 1 item
              </span>
            </div>
            <button className="gs-btn-mini" disabled={!pronta || m.resgatada} onClick={() => rodar(resgatarDiaria(save, m.indice))}>
              {m.resgatada ? "Feito" : "Resgatar"}
            </button>
          </div>
        );
      })}
      <div className={`gs-card gs-diaria-bonus ${bonusFeito ? "gs-card-bloqueado" : ""}`}>
        <span className="gs-card-emoji">🏅</span>
        <div className="gs-card-corpo">
          <strong>Bônus do dia</strong>
          <span className="gs-card-sub">Complete as 3 missões: o dobro de XP e um item nota A.</span>
        </div>
        <button className="gs-btn-mini" disabled={!bonus} onClick={() => rodar(resgatarBonusDiarias(save))}>
          {bonusFeito ? "Feito" : todas ? "Resgatar" : "🔒"}
        </button>
      </div>
    </div>
  );
}
