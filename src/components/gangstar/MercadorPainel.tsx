"use client";

// Gangstar: painel do Mercador (evento que aparece em horarios aleatorios no Hub).
// Vende itens 25% abaixo do valor e compra os seus 30% acima.

import { useState } from "react";
import { GangstarSave, comprarDoMercador, mercadorAtual, ofertasMercador, parseChave, compradosDoMercador, precoVendaMercador, vendiveisAoMercador, venderAoMercador, saldoAceitandoSujo } from "@/lib/gangstar";
import { itemPorId, type ItemDef } from "@/lib/gangstarItens";
import { NotaQualidade } from "./NotaQualidade";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function MercadorPainel({ save, aoAtualizar, aoFechar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void; aoFechar: () => void }) {
  const [aba, setAba] = useState<"comprar" | "vender">("comprar");
  const [mensagem, setMensagem] = useState<string | null>(null);
  const visita = mercadorAtual();
  const rodar = (r: { save: GangstarSave; erro?: string }, ok: string) => {
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    setMensagem(ok);
    aoAtualizar(r.save);
  };
  const meus = Object.entries(save.inventario)
    .filter(([, q]) => q > 0)
    .map(([chave, qtd]) => ({ chave, qtd, q: parseChave(chave).q, item: itemPorId(parseChave(chave).id) }))
    .filter((m): m is { chave: string; qtd: number; q: number; item: ItemDef } => !!m.item)
    .sort((a, b) => a.item.nome.localeCompare(b.item.nome) || b.q - a.q);
  const restante = visita ? Math.max(0, Math.ceil((visita.fim - Date.now()) / 60000)) : 0;

  return (
    <div className="gs-popup-fundo" onClick={aoFechar}>
      <div className="gs-popup-painel gs-mercador-painel" onClick={(e) => e.stopPropagation()}>
        <div className="gs-popup-topo">
          <h3 className="gs-h3" style={{ margin: 0 }}>
            🧳 Mercador
          </h3>
          <button className="gs-popup-fechar" onClick={aoFechar} aria-label="Fechar">
            ✕
          </button>
        </div>
        {!visita ? (
          <p className="gs-p-intro">O Mercador já foi embora. Fique de olho no Hub: ele volta em horários aleatórios.</p>
        ) : (
          <>
            <p className="gs-p-intro">&quot;Preço de amigo, mas só por {restante} minutos...&quot;</p>
            <div className="gs-sub-abas">
              <button className={`gs-sub-aba ${aba === "comprar" ? "gs-sub-aba-ativa" : ""}`} onClick={() => setAba("comprar")}>
                COMPRAR
              </button>
              <button className={`gs-sub-aba ${aba === "vender" ? "gs-sub-aba-ativa" : ""}`} onClick={() => setAba("vender")}>
                VENDER
              </button>
            </div>
            {mensagem && <div className="gs-aviso">{mensagem}</div>}
            <div className="gs-lista">
              {aba === "comprar" &&
                ofertasMercador(save, visita).map((o) => (
                  <div key={o.item.id} className={`gs-card ${o.estoque <= 0 ? "gs-card-bloqueado" : ""}`}>
                    <span className="gs-card-emoji">{o.item.emoji}</span>
                    <div className="gs-card-corpo">
                      <strong>
                        {o.item.nome} <NotaQualidade q={o.q} />
                      </strong>
                      <span className="gs-card-sub">
                        <s>{formatarDinheiro(o.item.valor)}</s> · estoque {o.estoque}
                      </span>
                    </div>
                    <button className="gs-btn-mini" disabled={o.estoque <= 0 || saldoAceitandoSujo(save.personagem) < o.preco} onClick={() => rodar(comprarDoMercador(save, o.item.id), `${o.item.emoji} Comprou ${o.item.nome}.`)}>
                      {o.estoque <= 0 ? "Esgotado" : formatarDinheiro(o.preco)}
                    </button>
                  </div>
                ))}
              {aba === "vender" && meus.length === 0 && <p className="gs-dica">Você não tem itens para vender.</p>}
              {aba === "vender" &&
                meus.map(({ chave, qtd, q, item }) => (
                  <div key={chave} className="gs-card">
                    <span className="gs-card-emoji">{item.emoji}</span>
                    <div className="gs-card-corpo">
                      <strong>
                        {item.nome} ×{qtd}
                        <NotaQualidade q={q} />
                      </strong>
                      <span className="gs-card-sub">
                        {vendiveisAoMercador(save, chave) > 0
                          ? `Ele paga ${formatarDinheiro(precoVendaMercador(item, q))} cada`
                          : "Comprado dele: ele não recompra"}
                        {vendiveisAoMercador(save, chave) > 0 && compradosDoMercador(save, chave) > 0 ? ` (${compradosDoMercador(save, chave)} comprado dele fica fora)` : ""}
                      </span>
                    </div>
                    <button
                      className="gs-btn-mini"
                      disabled={vendiveisAoMercador(save, chave) <= 0}
                      onClick={() => rodar(venderAoMercador(save, chave, 1), `Vendeu ${item.nome} por ${formatarDinheiro(precoVendaMercador(item, q))}.`)}
                    >
                      Vender
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
