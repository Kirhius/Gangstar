"use client";

// Gangstar: cardapio da boate (Hub e a sua boate da Minha Cidade).
// Tres secoes: Bebidas (consumir), Drogas e remedios (usar) e Garotas (contratar).
// No Hub voce compra e consome na hora, mais caro que o normal; na sua boate voce
// consome o que estiver na prateleira e as garotas saem 30% mais baratas.

import { useState } from "react";
import {
  GAROTAS,
  GangstarSave,
  VICIO_PERIGO,
  consumirItemBoate,
  consumirNaBoate,
  contratarGarota,
  custoGarota,
  custoLiberarGarota,
  garotaLiberada,
  liberarGarota,
  estoqueBoatePorSecao,
  itensSecaoBoate,
  precoNaBoate,
  type SecaoBoate,
  saldoAceitandoSujo,
} from "@/lib/gangstar";
import type { ItemDef } from "@/lib/gangstarItens";
import { NotaQualidade } from "./NotaQualidade";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

const SECOES: { id: SecaoBoate; emoji: string; nome: string; sub: string }[] = [
  { id: "bebidas", emoji: "🍸", nome: "Bebidas", sub: "energia" },
  { id: "drogas", emoji: "💊", nome: "Drogas", sub: "energia e vida" },
  { id: "garotas", emoji: "💃", nome: "Garotas", sub: "força e vida" },
];

const MSG_OVERDOSE = "🚑 Overdose! Você foi levado ao hospital: 10 minutos internado, R$ 1.000 de taxa e −20 de respeito.";

function efeitos(i: { energia?: number; forca?: number; vida?: number; vicio?: number }): string {
  const partes: string[] = [];
  if (i.forca) partes.push(`💪+${i.forca} força`);
  if (i.energia) partes.push(`⚡+${i.energia}`);
  if (i.vida) partes.push(`❤️+${i.vida}`);
  if (i.vicio) partes.push(`🌀+${i.vicio}`);
  return partes.join(" · ");
}

export function BoateMenu({
  save,
  aoAtualizar,
  lojaId,
}: {
  save: GangstarSave;
  aoAtualizar: (s: GangstarSave) => void;
  lojaId?: string; // informado = sua boate (consome da prateleira)
}) {
  const [secao, setSecao] = useState<SecaoBoate | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const p = save.personagem;
  const propria = !!lojaId;

  const rodar = (r: { save: GangstarSave; erro?: string; overdose?: boolean }, ok: string) => {
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    setMensagem(r.overdose ? MSG_OVERDOSE : ok);
    aoAtualizar(r.save);
  };
  const verbo = (item: ItemDef) => (item.categoria === "bebida" ? "Consumir" : "Usar");

  return (
    <div className="gs-boate-menu">
      <div className="gs-boate-status">
        <span>⚡ {p.energia}/{p.energiaMax}</span>
        <span>❤️ {p.vida}/{p.vidaMax}</span>
        <span className={p.vicio >= VICIO_PERIGO ? "gs-risco" : ""}>🌀 {p.vicio}/100</span>
      </div>
      <div className="gs-boate-secoes">
        {SECOES.map((sc) => (
          <button
            key={sc.id}
            className={`gs-boate-secao ${secao === sc.id ? "gs-boate-secao-ativa" : ""}`}
            onClick={() => {
              setSecao(secao === sc.id ? null : sc.id);
              setMensagem(null);
            }}
          >
            <span>{sc.emoji}</span>
            <strong>{sc.nome}</strong>
            <small>{sc.sub}</small>
          </button>
        ))}
      </div>
      {mensagem && <div className="gs-aviso">{mensagem}</div>}
      {p.vicio >= VICIO_PERIGO && secao && secao !== "garotas" && (
        <p className="gs-dica gs-risco">⚠️ Vício alto: cada consumo pode dar overdose.</p>
      )}

      {(secao === "bebidas" || secao === "drogas") && !propria && (
        <div className="gs-lista">
          {itensSecaoBoate(secao).map((item) => {
            const preco = precoNaBoate(save, item);
            return (
              <div key={item.id} className="gs-card">
                <span className="gs-card-emoji">{item.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{item.nome}</strong>
                  <span className="gs-card-sub">{efeitos(item)}</span>
                </div>
                <button
                  className="gs-btn-mini gs-btn-boate"
                  disabled={!!p.preso || saldoAceitandoSujo(p) < preco}
                  onClick={() => rodar(consumirItemBoate(save, item.id), `${item.emoji} ${item.nome}: ${efeitos(item)}`)}
                >
                  {verbo(item)}
                  <small>{formatarDinheiro(preco)}</small>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {(secao === "bebidas" || secao === "drogas") && propria && (() => {
        const pilhas = estoqueBoatePorSecao(save, lojaId!, secao);
        if (!pilhas.length) return <p className="gs-dica">Nada disso na prateleira. Abasteça com itens das suas fábricas logo abaixo.</p>;
        return (
          <div className="gs-lista">
            {pilhas.map((x) => (
              <div key={x.chave} className="gs-card">
                <span className="gs-card-emoji">{x.item.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>
                    {x.item.nome} ×{x.qtd}
                    <NotaQualidade q={x.q} />
                  </strong>
                  <span className="gs-card-sub">{efeitos(x.item)} · da sua prateleira</span>
                </div>
                <button className="gs-btn-mini gs-btn-boate" disabled={!!p.preso} onClick={() => rodar(consumirNaBoate(save, lojaId!, x.chave), `${x.item.emoji} ${x.item.nome}: ${efeitos(x.item)}`)}>
                  {verbo(x.item)}
                </button>
              </div>
            ))}
          </div>
        );
      })()}

      {secao === "garotas" && (
        <div className="gs-lista">
          {GAROTAS.map((g) => {
            const custo = custoGarota(save, g, propria);
            // v1.15: na sua boate cada garota e liberada uma vez (3x o preco) e depois sai pela metade
            const bloqueada = propria && !garotaLiberada(save, g.id);
            const custoLiberar = custoLiberarGarota(save, g);
            return (
              <div key={g.id} className="gs-card">
                <span className="gs-card-emoji">{g.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{g.nome}</strong>
                  <span className="gs-card-sub">
                    {g.descricao} {efeitos(g)}
                  </span>
                </div>
                {bloqueada ? (
                  <button
                    className="gs-btn-mini gs-btn-boate"
                    disabled={saldoAceitandoSujo(p) < custoLiberar}
                    onClick={() => rodar(liberarGarota(save, g.id), `🔓 ${g.emoji} ${g.nome} agora trabalha na sua boate.`)}
                  >
                    🔓 Liberar
                    <small>{formatarDinheiro(custoLiberar)}</small>
                  </button>
                ) : (
                  <button className="gs-btn-mini gs-btn-boate" disabled={!!p.preso || saldoAceitandoSujo(p) < custo} onClick={() => rodar(contratarGarota(save, g.id, propria), `${g.emoji} ${g.nome}: ${efeitos(g)}`)}>
                    Contratar
                    <small>{formatarDinheiro(custo)}</small>
                  </button>
                )}
              </div>
            );
          })}
          {propria && (
            <p className="gs-dica">Na sua boate cada garota precisa ser liberada uma vez (o triplo do preço daqui). Depois de liberada, ela sai pela metade.</p>
          )}
        </div>
      )}
    </div>
  );
}
