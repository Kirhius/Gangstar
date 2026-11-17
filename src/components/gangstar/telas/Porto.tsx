"use client";

// Gangstar: aba "Porto" - o mapa ilustrado do porto com os contratos de envio como
// botoes dentro do mapa. Cada contrato pede 3 itens; a carga vai de navio (leva horas)
// e pode ser apreendida pela Policia Federal. Itens de qualidade maior pagam mais.

import { useEffect, useState } from "react";
import {
  GangstarSave,
  contratoConcluido,
  contratosPorto,
  enviarContratoPorto,
  minutosNovosContratos,
  notaQualidade,
  pilhasDoItem,
  qtdItem,
  resolverNavios,
  type ContratoPorto,
} from "@/lib/gangstar";
import { itemPorId } from "@/lib/gangstarItens";
import { PopupResultado, type ResultadoPopup } from "../PopupResultado";
import { TituloComAjuda } from "../TituloComAjuda";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function tempo(ms: number): string {
  const min = Math.max(0, Math.ceil(ms / 60000));
  return min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}` : `${min} min`;
}

// posicoes (% da imagem) dos 3 contratos: armazem, cais do navio e alfandega
const POSICOES = [
  { left: 24, top: 50 },
  { left: 66, top: 33 },
  { left: 70, top: 79 },
];

export function Porto({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPopup | null>(null);
  const [aberto, setAberto] = useState<ContratoPorto | null>(null);
  const [agora, setAgora] = useState(() => Date.now());
  const contratos = contratosPorto(save);
  const navios = save.porto.navios ?? [];

  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), 15000);
    return () => clearInterval(t);
  }, []);

  // navios que chegaram: recebe o pagamento (ou a noticia da apreensao)
  useEffect(() => {
    const r = resolverNavios(save, agora);
    if (!r.chegadas.length) return;
    aoAtualizar(r.save);
    setResultado({
      sucesso: r.chegadas.some((c) => !c.apreendido),
      titulo: "⚓ Navios chegaram",
      linhas: r.chegadas.map((c) =>
        c.apreendido
          ? `🚨 ${c.navio.emoji} ${c.navio.destino}: a Polícia Federal apreendeu a carga!`
          : `✅ ${c.navio.emoji} ${c.navio.destino}: +${formatarDinheiro(c.navio.recompensa)} · ⭐ +${c.navio.respeito}`,
      ),
    });
  }, [agora, save, aoAtualizar]);

  const enviar = (c: ContratoPorto) => {
    const r = enviarContratoPorto(save, c.id);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    setAberto(null);
    if (r.navio) {
      setResultado({
        sucesso: true,
        titulo: "🚢 Navio zarpou!",
        linhas: [
          `${r.navio.emoji} Destino: ${r.navio.destino}`,
          `Chega em ${tempo(r.navio.chegada - Date.now())} · paga ${formatarDinheiro(r.navio.recompensa)}`,
          `🚨 Risco de apreensão pela PF: ${Math.round(r.navio.risco * 100)}%`,
        ],
      });
    }
  };

  const min = minutosNovosContratos();
  return (
    <div className="gs-pagina">
      <TituloComAjuda
        titulo="⚓ Porto"
        ajuda={
          <>
            <p>Toque num contrato no mapa para ver o pedido. Cada um pede 3 itens das suas fábricas.</p>
            <p>A carga vai de navio: leva de 1 a 4 horas, e na chegada a Polícia Federal pode apreender tudo (pilotos de fuga na gangue diminuem o risco).</p>
            <p>Itens com nota de qualidade melhor (C, B, A, S, SS) pagam mais. Novos contratos a cada 6 horas.</p>
          </>
        }
      />
      {mensagem && <div className="gs-aviso">{mensagem}</div>}

      <div className="gs-porto-mapa">
        <img src="/gangstar/porto/porto.webp" alt="Mapa do porto" width={880} height={1196} />
        <div className="gs-porto-navios">
          {navios.map((n) => (
            <span key={n.id} className="gs-porto-navio" title={`${n.destino}`}>
              🚢 {n.emoji} {n.chegada <= agora ? "chegou!" : tempo(n.chegada - agora)}
            </span>
          ))}
        </div>
        {contratos.map((c, i) => {
          const feito = contratoConcluido(save, c.id);
          const pronto = c.itens.every((x) => qtdItem(save, x.id) >= x.qtd);
          return (
            <button
              key={c.id}
              className={`gs-porto-contrato ${feito ? "gs-porto-feito" : pronto ? "gs-porto-pronto" : ""}`}
              style={{ left: `${POSICOES[i].left}%`, top: `${POSICOES[i].top}%` }}
              onClick={() => {
                setMensagem(null);
                setAberto(c);
              }}
            >
              <span>{feito ? "✅" : "📦"}</span>
              <strong>
                {c.emoji} {c.destino}
              </strong>
              <small>{feito ? "Enviado" : formatarDinheiro(c.recompensa)}</small>
            </button>
          );
        })}
        <span className="gs-porto-relogio">🕒 novos em {Math.floor(min / 60)}h{String(min % 60).padStart(2, "0")}</span>
      </div>

      {aberto && (
        <div className="gs-popup-fundo" onClick={() => setAberto(null)}>
          <div className="gs-popup-painel" onClick={(e) => e.stopPropagation()}>
            <div className="gs-popup-topo">
              <h3 className="gs-h3" style={{ margin: 0 }}>
                {aberto.emoji} {aberto.destino}
              </h3>
              <button className="gs-popup-fechar" onClick={() => setAberto(null)} aria-label="Fechar">
                ✕
              </button>
            </div>
            {mensagem && <div className="gs-aviso">{mensagem}</div>}
            <div className="gs-lista">
              {aberto.itens.map((x) => {
                const item = itemPorId(x.id);
                const tem = qtdItem(save, x.id);
                const melhor = pilhasDoItem(save, x.id).slice(-1)[0];
                return (
                  <div key={x.id} className={`gs-card ${tem >= x.qtd ? "gs-card-ativo" : ""}`}>
                    <span className="gs-card-emoji">{item?.emoji}</span>
                    <div className="gs-card-corpo">
                      <strong>
                        {item?.nome} · {Math.min(tem, x.qtd)}/{x.qtd}
                      </strong>
                      <span className={`gs-card-sub ${tem >= x.qtd ? "gs-ok" : "gs-risco"}`}>
                        {tem >= x.qtd ? `Você tem ${tem}${melhor ? ` (melhor nota ${notaQualidade(melhor.q)})` : ""}` : `Faltam ${x.qtd - tem}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="gs-p-intro">
              Paga a partir de {formatarDinheiro(aberto.recompensa)} (mais com itens de qualidade) · ⭐ +{aberto.respeito}. Os melhores itens vão primeiro.
            </p>
            <button
              className="gs-btn gs-btn-principal gs-btn-bloco"
              disabled={contratoConcluido(save, aberto.id) || !aberto.itens.every((x) => qtdItem(save, x.id) >= x.qtd)}
              onClick={() => enviar(aberto)}
            >
              {contratoConcluido(save, aberto.id) ? "Já enviado" : "Embarcar no navio"}
            </button>
          </div>
        </div>
      )}
      <PopupResultado resultado={resultado} aoFechar={() => setResultado(null)} />
    </div>
  );
}
