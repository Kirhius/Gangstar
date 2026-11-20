"use client";

// Gangstar: aba "Extorsões" (rodapé). Domine estabelecimentos com o seu poder e eles
// passam a pagar proteção por hora; cada coleta tem risco de flagrante.
// v1.5: mapa do bairro com os estabelecimentos clicaveis (a lista continua embaixo).

import { useState } from "react";
import {
  ALERTA_COLETA_EXTORSAO,
  ALERTA_DOMINAR_EXTORSAO,
  EXTORSOES,
  GangstarSave,
  chancePrisaoExtorsao,
  coletarExtorsao,
  conquistarExtorsao,
  energiaConquistaExtorsao,
  extorsaoPendente,
  extorsaoPerdidaHoje,
  poderDeRoubo,
} from "@/lib/gangstar";
import { TituloComAjuda } from "../TituloComAjuda";
import { PopupResultado, type ResultadoPopup } from "../PopupResultado";
import { AvisoBuff } from "../AvisoBuff";
import { MapaExtorsoes, type EstadoAlvoExtorsao } from "../mapa/MapaExtorsoes";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function Extorsoes({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPopup | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const p = save.personagem;
  const poder = poderDeRoubo(save);

  const conquistar = (id: string) => {
    const def = EXTORSOES.find((e) => e.id === id);
    const r = conquistarExtorsao(save, id);
    setAberto(null);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    setResultado({ sucesso: true, titulo: `${def?.emoji ?? "💼"} Território dominado`, linhas: [`${def?.nome ?? "O estabelecimento"} agora paga proteção pra você.`] });
  };

  const coletar = (id: string) => {
    const def = EXTORSOES.find((e) => e.id === id);
    const r = coletarExtorsao(save, id);
    setAberto(null);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    if (r.resultado?.tipo === "coletou") {
      setResultado({ sucesso: true, titulo: `💰 ${def?.nome ?? "Extorsão"} pagou`, linhas: [`+${formatarDinheiro(r.resultado.valor)}`] });
    } else if (r.resultado?.tipo === "preso") {
      setResultado({
        sucesso: false,
        titulo: "🚔 Flagrante!",
        linhas: [`A polícia te pegou recolhendo em ${def?.nome ?? "um estabelecimento"}.`, `Perdeu ${formatarDinheiro(r.resultado.perdido)} e o ponto: dá para dominar de novo amanhã.`, `Preso por ${r.resultado.minutos} min.`],
      });
    }
  };

  const estados: Record<string, EstadoAlvoExtorsao> = {};
  for (const e of EXTORSOES) {
    const meu = !!save.extorsoes[e.id];
    estados[e.id] = {
      nome: e.nome,
      meu,
      bloqueado: poder < e.poderMin || extorsaoPerdidaHoje(save, e.id),
      perdida: extorsaoPerdidaHoje(save, e.id),
      pendente: meu ? extorsaoPendente(save, e.id) : 0,
    };
  }
  const def = aberto ? EXTORSOES.find((e) => e.id === aberto) : undefined;
  const defMeu = def ? !!save.extorsoes[def.id] : false;
  const defPendente = def ? extorsaoPendente(save, def.id) : 0;
  const defPerdida = def ? extorsaoPerdidaHoje(save, def.id) : false;
  const defFraco = def ? poder < def.poderMin : false;

  return (
    <div className="gs-pagina">
      <TituloComAjuda
        titulo="💼 Extorsões"
        ajuda={
          <p>
            Seu poder: <strong>{poder}</strong>. Domine estabelecimentos e eles pagam proteção por hora (acumula até 12h). Cada coleta tem{" "}
            {Math.round(chancePrisaoExtorsao(save) * 100)}% de chance de flagrante: você perde o valor daquela coleta e o estabelecimento (dá para dominar de novo só no dia seguinte), é preso e perde 100 de respeito. Cada coleta ou conquista custa ❤️1. A Federal fica de olho: dominar sobe o alerta em {ALERTA_DOMINAR_EXTORSAO}% e cada coleta em {ALERTA_COLETA_EXTORSAO}%.
          </p>
        }
      />
      {mensagem && <div className="gs-aviso">{mensagem}</div>}
      <MapaExtorsoes estados={estados} onLocal={setAberto} extra={<AvisoBuff save={save} tipos={["extorsao"]} noMapa />} />
      <div className="gs-lista">
        {EXTORSOES.map((e) => {
          const meu = !!save.extorsoes[e.id];
          const pendente = extorsaoPendente(save, e.id);
          const fraco = poder < e.poderMin;
          const perdida = extorsaoPerdidaHoje(save, e.id);
          return (
            <div key={e.id} className={`gs-card ${meu ? "gs-card-ativo" : fraco ? "gs-card-bloqueado" : ""}`}>
              <span className="gs-card-emoji">{!meu && fraco ? "🔒" : e.emoji}</span>
              <div className="gs-card-corpo">
                <strong>{e.nome}</strong>
                <span className="gs-card-sub">
                  {meu
                    ? `${formatarDinheiro(e.rendaPorHora)}/h · acumulado ${formatarDinheiro(pendente)}`
                    : perdida
                      ? "🚔 A polícia tomou esse ponto hoje. Dá para dominar de novo amanhã."
                      : `Poder ${e.poderMin} · rende ${formatarDinheiro(e.rendaPorHora)}/h · ⚡${energiaConquistaExtorsao()} · 🚨+${ALERTA_DOMINAR_EXTORSAO}%`}
                </span>
              </div>
              {meu ? (
                <button className="gs-btn-mini" disabled={pendente <= 0 || !!p.preso} onClick={() => coletar(e.id)}>
                  Coletar
                </button>
              ) : (
                <button className="gs-btn-mini" disabled={fraco || perdida || !!p.preso || p.energia < energiaConquistaExtorsao()} onClick={() => conquistar(e.id)}>
                  Dominar
                </button>
              )}
            </div>
          );
        })}
      </div>
      {def && (
        <div className="gs-popup-fundo" onClick={() => setAberto(null)}>
          <div className="gs-popup-painel" onClick={(ev) => ev.stopPropagation()}>
            <div className="gs-popup-topo">
              <h3 className="gs-h3" style={{ margin: 0 }}>
                {def.emoji} {def.nome}
              </h3>
              <button className="gs-popup-fechar" onClick={() => setAberto(null)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="gs-resultado-linhas">
              {defMeu ? (
                <>
                  <p className="gs-resultado-linha">✅ Território seu. Paga {formatarDinheiro(def.rendaPorHora)}/h (acumula até 12h).</p>
                  <p className="gs-resultado-linha">Acumulado: <strong>{formatarDinheiro(defPendente)}</strong></p>
                  <p className="gs-resultado-linha">Chance de flagrante na coleta: {Math.round(chancePrisaoExtorsao(save) * 100)}% · ❤️1 · 🚨+{ALERTA_COLETA_EXTORSAO}%</p>
                </>
              ) : (
                <>
                  <p className="gs-resultado-linha">
                    Poder necessário: <strong>{def.poderMin}</strong> (o seu: {poder}){defFraco ? " 🔒" : ""}
                  </p>
                  <p className="gs-resultado-linha">Rende {formatarDinheiro(def.rendaPorHora)}/h depois de dominado.</p>
                  <p className="gs-resultado-linha">Custo: ⚡{energiaConquistaExtorsao()} · ❤️1 · 🚨+{ALERTA_DOMINAR_EXTORSAO}%</p>
                </>
              )}
            </div>
            {defMeu ? (
              <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={defPendente <= 0 || !!p.preso} onClick={() => coletar(def.id)}>
                💰 Coletar {formatarDinheiro(defPendente)}
              </button>
            ) : (
              <button
                className="gs-btn gs-btn-principal gs-btn-bloco"
                disabled={defFraco || defPerdida || !!p.preso || p.energia < energiaConquistaExtorsao()}
                onClick={() => conquistar(def.id)}
              >
                {defPerdida ? "🚔 Perdido hoje · volte amanhã" : defFraco ? "🔒 Poder insuficiente" : "👊 Dominar"}
              </button>
            )}
          </div>
        </div>
      )}
      <PopupResultado resultado={resultado} aoFechar={() => setResultado(null)} />
    </div>
  );
}
