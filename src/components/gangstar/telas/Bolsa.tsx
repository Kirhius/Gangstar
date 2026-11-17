"use client";

// Gangstar: Bolsa de valores do Hub (o predio de vidro da esquina). 20 empresas
// ficticias com preco que muda a cada 2 minutos. Libera no nivel 10.
// Caixa de compra/venda vazia = tudo (compra o maximo com o saldo / vende tudo).

import { useState } from "react";
import {
  EMPRESAS_BOLSA,
  GangstarSave,
  MS_TICK_BOLSA,
  NIVEL_BOLSA,
  TAXA_CORRETAGEM,
  comprarAcoes,
  historicoAcao,
  podeUsarBolsa,
  precoAcao,
  valorCarteira,
  variacaoAcao,
  venderAcoes,
  type EmpresaBolsa,
} from "@/lib/gangstar";

function formatarReais(v: number, casas = 2): string {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}`;
}

function pct(v: number): string {
  return `${v >= 0 ? "+" : ""}${(v * 100).toFixed(2).replace(".", ",")}%`;
}

// grafico de linha simples em SVG (ultimas 2 horas)
function Grafico({ valores }: { valores: number[] }) {
  const W = 320;
  const H = 140;
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const faixa = max - min || 1;
  const pts = valores.map((v, i) => [(i / (valores.length - 1)) * W, H - 8 - ((v - min) / faixa) * (H - 16)]);
  const linha = pts.map((p) => p.join(",")).join(" ");
  const subiu = valores[valores.length - 1] >= valores[0];
  const cor = subiu ? "#4cd07a" : "#ff5a5a";
  return (
    <div className="gs-bolsa-grafico">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Gráfico das últimas 2 horas">
        <polygon points={`0,${H} ${linha} ${W},${H}`} fill={cor} opacity={0.15} />
        <polyline points={linha} fill="none" stroke={cor} strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="gs-bolsa-eixo">
        <span>máx {formatarReais(max)}</span>
        <span>mín {formatarReais(min)}</span>
      </div>
      <small className="gs-bolsa-legenda">Últimas 2 horas · um ponto a cada 2 minutos</small>
    </div>
  );
}

export function Bolsa({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [aberta, setAberta] = useState<string | null>(null);
  const [qtdCompra, setQtdCompra] = useState("");
  const [qtdVenda, setQtdVenda] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const p = save.personagem;
  const carteira = valorCarteira(save);
  const proxima = Math.ceil((MS_TICK_BOLSA - (Date.now() % MS_TICK_BOLSA)) / 1000);

  if (!podeUsarBolsa(save)) {
    return (
      <div className="gs-card gs-card-bloqueado">
        <span className="gs-card-emoji">🔒</span>
        <div className="gs-card-corpo">
          <strong>Bolsa fechada para você</strong>
          <span className="gs-card-sub">
            A corretora só aceita clientes a partir do nível {NIVEL_BOLSA}. Você está no nível {p.nivel}.
          </span>
        </div>
      </div>
    );
  }

  const ler = (txt: string): number | null => {
    const limpo = txt.replace(/\D/g, "");
    return limpo ? Number(limpo) : null;
  };

  const negociar = (e: EmpresaBolsa, tipo: "comprar" | "vender") => {
    const qtd = ler(tipo === "comprar" ? qtdCompra : qtdVenda);
    if (tipo === "comprar") {
      const r = comprarAcoes(save, e.ticker, qtd);
      if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
      setMensagem(`✅ Comprou ${r.qtd!.toLocaleString("pt-BR")} ${e.ticker} por ${formatarReais(r.total!, 0)}.`);
      setQtdCompra("");
      aoAtualizar(r.save);
    } else {
      const r = venderAcoes(save, e.ticker, qtd);
      if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
      setMensagem(
        `💰 Vendeu ${r.qtd!.toLocaleString("pt-BR")} ${e.ticker} por ${formatarReais(r.total!, 0)} (${r.lucro! >= 0 ? "lucro" : "prejuízo"} de ${formatarReais(Math.abs(r.lucro!), 0)}).`,
      );
      setQtdVenda("");
      aoAtualizar(r.save);
    }
  };

  const empresa = aberta ? EMPRESAS_BOLSA.find((e) => e.ticker === aberta) : null;

  return (
    <div className="gs-bolsa">
      <div className="gs-bolsa-resumo">
        <div>
          <small>Em mãos</small>
          <strong className={p.dinheiro < 0 ? "gs-negativo" : ""}>{formatarReais(p.dinheiro, 0)}</strong>
        </div>
        <div>
          <small>Carteira</small>
          <strong>{formatarReais(carteira, 0)}</strong>
        </div>
        <div>
          <small>Próxima cotação</small>
          <strong>
            {Math.floor(proxima / 60)}:{String(proxima % 60).padStart(2, "0")}
          </strong>
        </div>
      </div>
      {mensagem && <div className="gs-aviso">{mensagem}</div>}

      <div className="gs-bolsa-lista">
        {EMPRESAS_BOLSA.map((e) => {
          const preco = precoAcao(e);
          const v = variacaoAcao(e);
          const pos = save.acoes?.[e.ticker];
          return (
            <button
              key={e.ticker}
              className="gs-bolsa-linha"
              onClick={() => {
                setAberta(e.ticker);
                setMensagem(null);
                setQtdCompra("");
                setQtdVenda("");
              }}
            >
              <span className="gs-bolsa-emoji">{e.emoji}</span>
              <span className="gs-bolsa-nome">
                <strong>{e.nome}</strong>
                <small>
                  {e.ticker}
                  {pos && ` · você tem ${pos.qtd.toLocaleString("pt-BR")}`}
                </small>
              </span>
              <span className="gs-bolsa-preco">
                <strong>{formatarReais(preco)}</strong>
                <small className={v >= 0 ? "gs-alta" : "gs-baixa"}>
                  {v >= 0 ? "▲" : "▼"} {pct(v)}
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <p className="gs-dica">Variação da última hora. Corretagem de {(TAXA_CORRETAGEM * 100).toFixed(1).replace(".", ",")}% em cada compra e venda.</p>

      {empresa && (() => {
        const preco = precoAcao(empresa);
        const pos = save.acoes?.[empresa.ticker];
        const valorPos = pos ? pos.qtd * preco : 0;
        const resultado = pos ? valorPos - pos.qtd * pos.precoMedio : 0;
        const maxCompra = Math.floor(Math.max(0, p.dinheiro) / (preco * (1 + TAXA_CORRETAGEM)));
        return (
          <div className="gs-popup-fundo" onClick={() => setAberta(null)}>
            <div className="gs-popup-painel" onClick={(ev) => ev.stopPropagation()}>
              <div className="gs-popup-topo">
                <h3 className="gs-h3" style={{ margin: 0 }}>
                  {empresa.emoji} {empresa.nome}
                </h3>
                <button className="gs-popup-fechar" onClick={() => setAberta(null)} aria-label="Fechar">
                  ✕
                </button>
              </div>
              <div className="gs-bolsa-cotacao">
                <strong>{formatarReais(preco)}</strong>
                <span className={variacaoAcao(empresa) >= 0 ? "gs-alta" : "gs-baixa"}>{pct(variacaoAcao(empresa))} na última hora</span>
              </div>
              <Grafico valores={historicoAcao(empresa)} />
              {mensagem && <div className="gs-aviso">{mensagem}</div>}

              {pos && (
                <div className="gs-bolsa-posicao">
                  <span>
                    Você tem <strong>{pos.qtd.toLocaleString("pt-BR")}</strong> ações · preço médio {formatarReais(pos.precoMedio)}
                  </span>
                  <span>
                    Vale {formatarReais(valorPos, 0)} ·{" "}
                    <strong className={resultado >= 0 ? "gs-alta" : "gs-baixa"}>
                      {resultado >= 0 ? "+" : "−"}
                      {formatarReais(Math.abs(resultado), 0)}
                    </strong>
                  </span>
                </div>
              )}

              <div className="gs-bolsa-ordem">
                <label>
                  <span>Comprar (máx. {maxCompra.toLocaleString("pt-BR")})</span>
                  <input inputMode="numeric" placeholder="vazio = tudo" value={qtdCompra} onChange={(ev) => setQtdCompra(ev.target.value.replace(/\D/g, ""))} />
                </label>
                <button className="gs-btn gs-btn-principal" disabled={maxCompra <= 0 || !!p.preso} onClick={() => negociar(empresa, "comprar")}>
                  Comprar
                </button>
              </div>
              <div className="gs-bolsa-ordem">
                <label>
                  <span>Vender (você tem {(pos?.qtd ?? 0).toLocaleString("pt-BR")})</span>
                  <input inputMode="numeric" placeholder="vazio = tudo" value={qtdVenda} onChange={(ev) => setQtdVenda(ev.target.value.replace(/\D/g, ""))} />
                </label>
                <button className="gs-btn gs-btn-perigo" disabled={!pos || !!p.preso} onClick={() => negociar(empresa, "vender")}>
                  Vender
                </button>
              </div>
              <p className="gs-dica">Deixe a caixa vazia para comprar o máximo que seu dinheiro em mãos paga, ou para vender todas as suas ações dessa empresa.</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
