"use client";

// Gangstar: Lavanderia do Hub. Lava dinheiro sujo na hora, sem precisar de predio:
// taxa de 40%, limite por dia (cresce com o nivel) e o dobro de alerta da Federal.
// v1.9.2: ilustracao em faixa 3:1 no topo; texto e botoes embaixo.

import { IlustracaoLavanderia } from "../IlustracaoServico";
import { useState } from "react";
import {
  GangstarSave,
  SUSPEITA_BATIDA,
  TAXA_LAVANDERIA,
  lavadoHojeLavanderia,
  lavarNaLavanderia,
  limiteLavanderia,
  restanteLavanderia,
  sujo,
  suspeitaAtual,
} from "@/lib/gangstar";

function reais(v: number): string {
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}

export function Lavanderia({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [valor, setValor] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const p = save.personagem;
  const resta = restanteLavanderia(save);
  const alerta = suspeitaAtual(save);
  const digitado = Number(valor.replace(/\D/g, "")) || 0;
  const previa = digitado || Math.min(sujo(p), resta);

  const lavar = () => {
    const r = lavarNaLavanderia(save, valor ? digitado : null);
    if (r.erro) return setMsg(`⚠️ ${r.erro}`);
    setValor("");
    aoAtualizar(r.save);
    if (r.batida) {
      setMsg(`🚔 Batida fiscal! A Federal apreendeu ${reais(r.batida.perdeu)} de dinheiro sujo.${r.batida.preso ? " Você foi preso." : ""}`);
    } else {
      setMsg(`🧺 Lavou ${reais(r.valor ?? 0)} e recebeu ${reais(r.limpo ?? 0)} limpos.`);
    }
  };

  return (
    <div className="gs-lista">
      <IlustracaoLavanderia />
      <p className="gs-p-intro">
        O dono não faz perguntas: entrega dinheiro limpo na hora, sem você precisar de fachada. Mas fica com {Math.round(TAXA_LAVANDERIA * 100)}%, tem limite por dia e a
        Federal fica de olho (o alerta sobe o dobro das fachadas).
      </p>

      <div className="gs-loja-resumo">
        <span>🩸 Sujo: {reais(sujo(p))}</span>
        <span>
          📅 Hoje: {reais(lavadoHojeLavanderia(save))} de {reais(limiteLavanderia(save))}
        </span>
        <span className={alerta > SUSPEITA_BATIDA ? "gs-risco" : ""}>🚨 Alerta {Math.round(alerta)}%</span>
      </div>
      {msg && <div className="gs-aviso">{msg}</div>}

      {resta <= 0 ? (
        <div className="gs-aviso">Limite de hoje atingido. Volte amanhã ou lave nas suas fachadas (Boate, Hotel e lojas), que cobram bem menos.</div>
      ) : (
        <>
          <div className="gs-bolsa-ordem">
            <label>
              <span>Quanto lavar (vazio = o máximo, até {reais(resta)})</span>
              <input inputMode="numeric" placeholder="vazio = máximo" value={valor} onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))} />
            </label>
            <button className="gs-btn gs-btn-principal" disabled={sujo(p) <= 0 || !!p.preso} onClick={lavar}>
              Lavar
            </button>
          </div>
          {previa > 0 && (
            <p className="gs-dica">
              {reais(previa)} sujos viram {reais(Math.floor(previa * (1 - TAXA_LAVANDERIA)))} limpos na hora.
            </p>
          )}
        </>
      )}
      <p className="gs-dica">O limite sobe R$ 2.500 a cada nível. Contadores, advogado e o Livro-caixa duplo também reduzem o alerta aqui.</p>
    </div>
  );
}
