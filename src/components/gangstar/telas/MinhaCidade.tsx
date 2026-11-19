"use client";

// Gangstar: aba "Minha Cidade" - mapa ilustrado com 11 predios abandonados a venda.
// Cada predio tem uma funcao fixa (hotel, loja, fabrica, boate, gestao). Tocar num
// predio abre um popup: comprar (ele ja vem construido) ou gerenciar o que e seu.

import { useEffect, useState } from "react";
import {
  GangstarSave,
  PREDIOS,
  PREDIOS_CIDADE,
  coletarProducao,
  coletarTudo,
  comprarPredio,
  custoUpgrade,
  precoPredio,
  predioDoLote,
  producaoPendente,
  producaoTotalPendente,
  rendaPorHoraCidade,
  temGestaoConstruida,
  upgradarPredio,
  capacidadeFabrica,
  coletarFabrica,
  definirProdutoFabrica,
  ehFabrica,
  horasPorUnidade,
  nivelMaxPredio,
  produtoDaFabrica,
  unidadesProntas,
  unidadesProntasTotal,
  linhasFabrica,
  instLinha,
  consumirNaBoate,
  capacidadeLavagem,
  ehFachada,
  fachadaFechada,
  lavarDinheiro,
  sujo,
  suspeitaAtual,
  taxaLavagem,
  totalNaLavagem,
  horasParaLavar,
  VICIO_PERIGO,
  CATEGORIAS_LOJA,
  abastecerLoja,
  clientesPorHora,
  coletarCaixaLoja,
  demandaCategoria,
  ehLoja,
  parseChave,
  precoNaLoja,
  processarVendasLojas,
  qualidadeFabrica,
  recolherDaLoja,
} from "@/lib/gangstar";
import { NOME_CATEGORIA, ehConsumivel, itemPorId, itensDaFabrica, type FabricaItem, type ItemDef } from "@/lib/gangstarItens";
import { TituloComAjuda } from "../TituloComAjuda";
import { BoateMenu } from "../BoateMenu";
import { MapaCidade, type EtiquetaPredio } from "../mapa/MapaCidade";
import { Cassino } from "./Cassino";
import { Recrutamento } from "./Recrutamento";
import { descricaoItem } from "./Inventario";
import { NotaQualidade } from "../NotaQualidade";

function formatarTempo(horas: number): string {
  if (horas < 1) return `${Math.max(1, Math.round(horas * 60))} min`;
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function MinhaCidade({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [recrutando, setRecrutando] = useState(false);
  const [noCassino, setNoCassino] = useState(false);
  // v1.12: lojas/fachadas em abas - "principal" (loja) ou "lavar" (lavagem de dinheiro)
  const [abaPredio, setAbaPredio] = useState<"principal" | "lavar">("principal");
  useEffect(() => setAbaPredio("principal"), [aberto]);
  const gestaoPronta = temGestaoConstruida(save);
  const pendenteTotal = producaoTotalPendente(save);
  const meus = PREDIOS_CIDADE.filter((p) => save.predios[p.id]).length;

  const rodar = (resultado: { save: GangstarSave; erro?: string; valor?: number }, mensagemSucesso?: string, fecharPopup = true) => {
    if (resultado.erro) {
      setMensagem(`⚠️ ${resultado.erro}`);
      return;
    }
    setMensagem(mensagemSucesso ?? null);
    aoAtualizar(resultado.save);
    if (fecharPopup) setAberto(null);
  };

  const comprar = (id: string) => {
    const slot = PREDIOS_CIDADE.find((p) => p.id === id);
    rodar(comprarPredio(save, id), slot ? `🏗️ ${PREDIOS[slot.tipo].nome} reformado e funcionando!` : undefined, false);
  };
  const coletar = (id: string) => {
    const r = coletarProducao(save, id);
    rodar(r, r.valor ? `💰 Coletado ${formatarDinheiro(r.valor)}` : undefined, false);
  };
  const upgrade = (id: string) => rodar(upgradarPredio(save, id), "⬆️ Prédio evoluído!", false);
  const coletarItens = (id: string) => {
    const r = coletarFabrica(save, id);
    rodar(r, r.itens ? r.itens.map((x) => `${x.item.emoji} +${x.qtd} ${x.item.nome}`).join(" · ") + " no inventário" : undefined, false);
  };
  const [linhaSel, setLinhaSel] = useState(0);
  const trocarProduto = (id: string, itemId: string) => rodar(definirProdutoFabrica(save, id, itemId, linhaSel), "🔁 Produção trocada.", false);
  const coletarGeral = () => {
    const r = coletarTudo(save);
    rodar(r, r.valor ? `💰 Coletado ${formatarDinheiro(r.valor)} de todos os prédios` : undefined);
  };

  // v1.13: valor acumulado (lojas/renda) ou itens prontos (fabricas) em cima de cada predio
  const etiquetas: Record<string, EtiquetaPredio | null> = {};
  for (const [id, predio] of Object.entries(save.predios)) {
    etiquetas[id] = ehFabrica(predio.tipo)
      ? { tipo: "itens", valor: unidadesProntasTotal(predio, save) }
      : ehLoja(predio.tipo)
        ? { tipo: "dinheiro", valor: Math.floor(predio.caixa ?? 0) }
        : PREDIOS[predio.tipo].rendaPorHora > 0
          ? { tipo: "dinheiro", valor: producaoPendente(predio, save) }
          : null;
  }

  const slotAberto = aberto ? PREDIOS_CIDADE.find((p) => p.id === aberto) ?? null : null;
  const defAberto = slotAberto ? PREDIOS[slotAberto.tipo] : null;
  const instAberta = aberto ? predioDoLote(save, aberto) : null;
  const precoAberto = aberto ? precoPredio(save, aberto) : 0;

  if (noCassino) {
    return <Cassino save={save} aoAtualizar={aoAtualizar} aoVoltar={() => setNoCassino(false)} />;
  }

  if (recrutando && save.predios["recrutamento"]) {
    return <Recrutamento save={save} aoAtualizar={aoAtualizar} aoVoltar={() => setRecrutando(false)} />;
  }

  const ehRecrutamento = slotAberto?.tipo === "recrutamento";
  const semGangue = !save.personagem.gangue;

  return (
    <div className="gs-pagina">
      <TituloComAjuda
        titulo="🗺️ Minha Cidade"
        ajuda={`Toque num prédio abandonado pra comprar e reformar, ou num prédio seu pra gerenciar. Você tem ${meus} de ${PREDIOS_CIDADE.length}.`}
      />
      {mensagem && !aberto && <div className="gs-aviso">{mensagem}</div>}


      <MapaCidade
        predios={save.predios}
        etiquetas={etiquetas}
        onPredio={(id) => {
          setMensagem(null);
          setAberto(id);
          setLinhaSel(0);
          // ao abrir uma loja, atualiza as vendas dos clientes ate agora
          if (save.predios[id] && ehLoja(save.predios[id].tipo)) aoAtualizar(processarVendasLojas(save));
        }}
      />

      {gestaoPronta && (
        <div className="gs-card gs-painel-gestao">
          <span className="gs-card-emoji">📊</span>
          <div className="gs-card-corpo">
            <strong>Painel de Gestão</strong>
            <span className="gs-card-sub">Pronto para coletar: {formatarDinheiro(pendenteTotal)}</span>
          </div>
          <button className="gs-btn-mini" disabled={pendenteTotal <= 0} onClick={coletarGeral}>
            Coletar tudo
          </button>
        </div>
      )}

      <div className="gs-card gs-renda-cidade">
        <span className="gs-card-emoji">📈</span>
        <div className="gs-card-corpo">
          <strong>{formatarDinheiro(rendaPorHoraCidade(save))}/hora</strong>
          <span className="gs-card-sub">
            Arrecadação da sua cidade ({meus} {meus === 1 ? "prédio" : "prédios"} funcionando)
          </span>
        </div>
      </div>
      {totalNaLavagem(save) > 0 && (
        <div className="gs-card gs-renda-cidade">
          <span className="gs-card-emoji">🧺</span>
          <div className="gs-card-corpo">
            <strong>{formatarDinheiro(totalNaLavagem(save))} sendo lavados</strong>
            <span className="gs-card-sub">Fica pronto em cerca de {Math.ceil(horasParaLavar(save) * 60)} min · o limpo cai sozinho no seu saldo</span>
          </div>
        </div>
      )}

      {aberto && slotAberto && defAberto && (
        <div className="gs-popup-fundo" onClick={() => setAberto(null)}>
          <div className="gs-popup-painel" onClick={(e) => e.stopPropagation()}>
            <div className="gs-popup-topo">
              {instAberta && ehFabrica(instAberta.tipo) ? (
                // v1.10: nivel, linhas e regras da fabrica ficam no "?" ao lado do titulo
                <TituloComAjuda
                  pequeno
                  titulo={`${defAberto.emoji} ${defAberto.nome}`}
                  ajuda={
                    <>
                      <p>
                        Nível <strong>{instAberta.nivel}</strong> de {nivelMaxPredio(instAberta.tipo)}.
                      </p>
                      <p>
                        {linhasFabrica(instAberta)} {linhasFabrica(instAberta) === 1 ? "linha" : "linhas"} de produção (máx. 5).
                      </p>
                      <p>Cada nível libera um produto novo e a cada 2 níveis abre uma linha.</p>
                      <p>A qualidade da produção sobe a cada 3 níveis e com contrabandistas na gangue.</p>
                    </>
                  }
                />
              ) : (
                <h3 className="gs-h3" style={{ margin: 0 }}>
                  {defAberto.emoji} {instAberta ? defAberto.nome : "Prédio abandonado"}
                </h3>
              )}
              <button className="gs-popup-fechar" onClick={() => setAberto(null)} aria-label="Fechar">
                ✕
              </button>
            </div>
            {mensagem && <div className="gs-aviso">{mensagem}</div>}

            {!instAberta && (
              <>
                <p className="gs-p-intro">
                  À venda. Depois de comprado, ele é reformado e vira <strong>{defAberto.nome}</strong>
                  {ehRecrutamento
                    ? ": o lugar para contratar assaltantes, pilotos de fuga e contrabandistas para a sua gangue."
                    : ehFabrica(defAberto.tipo)
                      ? `: produz ${itensDaFabrica(defAberto.tipo as FabricaItem, 10).length} produtos diferentes conforme evolui (nível 1 a 10).`
                      : defAberto.rendaPorHora > 0
                      ? `, rendendo ${formatarDinheiro(defAberto.rendaPorHora)}/h.`
                      : ", o painel financeiro da sua cidade (coletar tudo de uma vez)."}
                </p>
                {ehRecrutamento && semGangue && <div className="gs-aviso">🔒 Bloqueado: crie uma gangue (aba Gangue) para poder comprar.</div>}
                <button
                  className="gs-btn gs-btn-principal gs-btn-bloco"
                  disabled={save.personagem.dinheiro < precoAberto || (ehRecrutamento && semGangue)}
                  onClick={() => comprar(aberto)}
                >
                  {ehRecrutamento && semGangue ? "🔒 Precisa de uma gangue" : `Comprar — ${formatarDinheiro(precoAberto)}`}
                </button>
                {save.personagem.dinheiro < precoAberto && <p className="gs-dica">Faltam {formatarDinheiro(precoAberto - save.personagem.dinheiro)}.</p>}
              </>
            )}

            {instAberta && ehRecrutamento && (
              <>
                <p className="gs-p-intro">
                  {save.bandidos.length} {save.bandidos.length === 1 ? "bandido" : "bandidos"} na gangue. Contrate assaltantes, pilotos de fuga e contrabandistas.
                </p>
                <button
                  className="gs-btn gs-btn-principal gs-btn-bloco"
                  disabled={semGangue}
                  onClick={() => {
                    setAberto(null);
                    setRecrutando(true);
                  }}
                >
                  {semGangue ? "🔒 Precisa de uma gangue" : "Abrir recrutamento"}
                </button>
              </>
            )}

            {instAberta && ehFabrica(instAberta.tipo) && (() => {
              const nivelMax = nivelMaxPredio(instAberta.tipo);
              const nLinhas = linhasFabrica(instAberta);
              const prontasTotal = unidadesProntasTotal(instAberta, save);
              const produtoSel = produtoDaFabrica(instLinha(instAberta, linhaSel));
              return (
                <>
                  <div className="gs-qualidade-linha">
                    Qualidade da produção: <NotaQualidade q={qualidadeFabrica(instAberta, save)} />
                    <small>sobe a cada 3 níveis e com contrabandistas na gangue</small>
                  </div>
                  <div className="gs-linhas-producao">
                    {Array.from({ length: 5 }, (_, i) => {
                      if (i >= nLinhas) {
                        return (
                          <div key={i} className="gs-linha gs-linha-bloqueada">
                            <span>🔒</span>
                            <small>Linha {i + 1} · nível {i * 2 + 1}</small>
                          </div>
                        );
                      }
                      const li = instLinha(instAberta, i);
                      const prod = produtoDaFabrica(li);
                      return (
                        <button key={i} className={`gs-linha ${linhaSel === i ? "gs-linha-sel" : ""}`} onClick={() => setLinhaSel(i)}>
                          <span>{prod?.emoji ?? "❔"}</span>
                          <strong>{prod?.nome ?? "—"}</strong>
                          <small>
                            {unidadesProntas(li, save)}/{capacidadeFabrica(li, save)} · 1 a cada {formatarTempo(horasPorUnidade(li, save))}
                          </small>
                        </button>
                      );
                    })}
                  </div>
                  <div className="gs-botoes-duplos">
                    <button className="gs-btn gs-btn-principal" disabled={prontasTotal <= 0} onClick={() => coletarItens(aberto)}>
                      Coletar ({prontasTotal})
                    </button>
                    {instAberta.nivel < nivelMax && (
                      <button className="gs-btn gs-btn-secundario" disabled={save.personagem.dinheiro < custoUpgrade(instAberta.tipo, instAberta.nivel)} onClick={() => upgrade(aberto)}>
                        Evoluir — {formatarDinheiro(custoUpgrade(instAberta.tipo, instAberta.nivel))}
                      </button>
                    )}
                  </div>
                  <h3 className="gs-h3">Produtos da linha {linhaSel + 1}</h3>
                  <div className="gs-lista gs-lista-produtos">
                    {itensDaFabrica(instAberta.tipo as FabricaItem).map((item) => {
                      const liberado = item.nivel <= instAberta.nivel;
                      const ativo = produtoSel?.id === item.id;
                      return (
                        <div key={item.id} className={`gs-card ${ativo ? "gs-card-ativo" : !liberado ? "gs-card-bloqueado" : ""}`}>
                          <span className="gs-card-emoji">{liberado ? item.emoji : "🔒"}</span>
                          <div className="gs-card-corpo">
                            <strong>
                              N{item.nivel} · {item.nome}
                            </strong>
                            <span className="gs-card-sub">{descricaoItem(item)}</span>
                          </div>
                          {liberado && !ativo && (
                            <button className="gs-btn-mini" onClick={() => trocarProduto(aberto, item.id)}>
                              Produzir
                            </button>
                          )}
                          {ativo && <span className="gs-tag">Produzindo</span>}
                        </div>
                      );
                    })}
                  </div>
                  <p className="gs-dica">Toque numa linha para escolher o que ela produz. Trocar o produto coleta o que estiver pronto e recomeça aquela linha.</p>
                </>
              );
            })()}

            {instAberta && !ehRecrutamento && !ehFabrica(instAberta.tipo) && (
              <>
                <p className="gs-p-intro">
                  Nível {instAberta.nivel} de 3 {defAberto.rendaPorHora > 0 && `· rende ${formatarDinheiro(defAberto.rendaPorHora * instAberta.nivel)}/h`}
                  {ehLoja(instAberta.tipo) && " · a renda vem só das vendas. Cada nível traz mais clientes."}
                </p>
                {defAberto.rendaPorHora > 0 && abaPredio === "principal" && (
                  <div className="gs-card">
                    <span className="gs-card-emoji">💰</span>
                    <div className="gs-card-corpo">
                      <strong>{formatarDinheiro(producaoPendente(instAberta, save))}</strong>
                      <span className="gs-card-sub">Pronto para coletar</span>
                    </div>
                  </div>
                )}
                {ehFachada(instAberta.tipo) ? (
                  // v1.12: barra superior com Evoluir e a troca entre a loja e a lavagem
                  <div className="gs-botoes-duplos gs-botoes-compactos">
                    <button
                      className="gs-btn gs-btn-secundario"
                      disabled={instAberta.nivel >= 3 || save.personagem.dinheiro < custoUpgrade(instAberta.tipo, instAberta.nivel)}
                      onClick={() => upgrade(aberto)}
                    >
                      {instAberta.nivel >= 3 ? "Nível máximo" : `Evoluir ${formatarDinheiro(custoUpgrade(instAberta.tipo, instAberta.nivel))}`}
                    </button>
                    <button
                      className={`gs-btn ${abaPredio === "lavar" ? "gs-btn-secundario" : "gs-btn-principal"}`}
                      onClick={() => setAbaPredio(abaPredio === "lavar" ? "principal" : "lavar")}
                    >
                      {abaPredio === "lavar" ? (ehLoja(instAberta.tipo) ? "← Loja" : `← ${defAberto.nome}`) : "🧼 Lavar dinheiro"}
                    </button>
                  </div>
                ) : null}
                {(!ehFachada(instAberta.tipo) || (abaPredio === "principal" && defAberto.rendaPorHora > 0)) && (
                  <div className={ehFachada(instAberta.tipo) ? "" : "gs-botoes-duplos"}>
                    {defAberto.rendaPorHora > 0 && (
                      <button
                        className={`gs-btn gs-btn-principal ${ehFachada(instAberta.tipo) ? "gs-btn-bloco" : ""}`}
                        disabled={producaoPendente(instAberta, save) <= 0}
                        onClick={() => coletar(aberto)}
                      >
                        Coletar
                      </button>
                    )}
                    {!ehFachada(instAberta.tipo) && instAberta.nivel < 3 && (
                      <button
                        className="gs-btn gs-btn-secundario"
                        disabled={save.personagem.dinheiro < custoUpgrade(instAberta.tipo, instAberta.nivel)}
                        onClick={() => upgrade(aberto)}
                      >
                        Evoluir — {formatarDinheiro(custoUpgrade(instAberta.tipo, instAberta.nivel))}
                      </button>
                    )}
                  </div>
                )}
                {ehFachada(instAberta.tipo) && abaPredio === "lavar" && <PainelLavagem save={save} predioId={aberto} rodar={(r, msg) => rodar(r, msg, false)} />}
                {abaPredio === "principal" && instAberta.tipo === "boate" && (
                  <>
                    <h3 className="gs-h3">🪩 Curtir na sua boate</h3>
                    <BoateMenu save={save} aoAtualizar={aoAtualizar} lojaId={aberto} />
                  </>
                )}
                {abaPredio === "principal" && ehLoja(instAberta.tipo) && (
                  <PainelLoja save={save} lojaId={aberto} rodar={(r, msg) => rodar(r, msg, false)} />
                )}
                {abaPredio === "principal" && instAberta.tipo === "boate" && (
                  <button
                    className="gs-btn gs-btn-cassino gs-btn-bloco"
                    onClick={() => {
                      setAberto(null);
                      setNoCassino(true);
                    }}
                  >
                    🎰 Cassino
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Loja: prateleira abastecida pelas fabricas, clientes de IA compram ----------

function PainelLoja({
  save,
  lojaId,
  rodar,
}: {
  save: GangstarSave;
  lojaId: string;
  rodar: (r: { save: GangstarSave; erro?: string; valor?: number }, msg?: string) => void;
}) {
  const inst = save.predios[lojaId];
  if (!inst) return null;
  const cats = CATEGORIAS_LOJA[inst.tipo] ?? [];
  const ehBoate = inst.tipo === "boate";
  const pilha = (chave: string, qtd: number) => {
    const { id, q } = parseChave(chave);
    return { chave, qtd, q, item: itemPorId(id) };
  };
  const valido = (p: { chave: string; qtd: number; q: number; item: ItemDef | null }): p is { chave: string; qtd: number; q: number; item: ItemDef } => !!p.item;
  const prateleira = Object.entries(inst.estoque ?? {})
    .filter(([, n]) => n > 0)
    .map(([k, n]) => pilha(k, n))
    .filter(valido);
  const noInventario = Object.entries(save.inventario)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => pilha(k, n))
    .filter(valido)
    .filter((p) => cats.includes(p.item.categoria));
  const naPrateleira = prateleira.reduce((a, p) => a + p.qtd, 0);
  const hoje = new Date();
  const diaHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const vendidosHoje = inst.vendidosHoje?.dia === diaHoje ? inst.vendidosHoje.qtd : 0;

  return (
    <div className="gs-loja">
      <TituloComAjuda
        pequeno
        titulo="🛒 Vendas para a população"
        ajuda={
          <>
            <div className="gs-loja-resumo">
        <span>👥 {clientesPorHora(inst)} clientes/h</span>
        <span>📦 {naPrateleira} na prateleira</span>
        <span>🧾 {vendidosHoje} vendidos hoje</span>
      </div>
      <div className="gs-loja-demanda">
        {cats.map((c) => {
          const d = demandaCategoria(save, c);
          return (
            <span key={c} className={d > 1 ? "gs-demanda-alta" : d < 1 ? "gs-demanda-baixa" : ""}>
              {NOME_CATEGORIA[c]}: {d > 1 ? "▲" : d < 1 ? "▼" : "●"} {Math.round(d * 100)}%
            </span>
          );
        })}
            </div>
            <p>
              Abasteça a prateleira com itens das suas fábricas ({cats.map((c) => NOME_CATEGORIA[c]).join(", ")}). Os clientes compram ao longo do dia e o dinheiro cai no caixa.
              Cada nível da loja traz mais clientes. Festa na cidade aumenta a procura por bebidas e drogas; batida policial derruba drogas e armas. Item com nota melhor (C →
              SS) vende mais caro.
            </p>
          </>
        }
      />
      <div className="gs-card">
        <span className="gs-card-emoji">💵</span>
        <div className="gs-card-corpo">
          <strong>{formatarDinheiro(inst.caixa ?? 0)}</strong>
          <span className="gs-card-sub">No caixa (vendas dos clientes)</span>
        </div>
        <button
          className="gs-btn-mini"
          disabled={(inst.caixa ?? 0) <= 0}
          onClick={() => {
            const r = coletarCaixaLoja(save, lojaId);
            rodar(r, r.valor ? `💵 Caixa recolhido: ${formatarDinheiro(r.valor)}` : undefined);
          }}
        >
          Recolher
        </button>
      </div>

      <h3 className="gs-h3">Prateleira</h3>
      {ehBoate && <p className="gs-dica">O que estiver aqui você consome em "Curtir na sua boate", e o resto os clientes compram.</p>}
      {prateleira.length === 0 && <p className="gs-dica">Vazia. Abasteça com itens das suas fábricas — clientes compram ao longo do dia.</p>}
      <div className="gs-lista">
        {prateleira.map((p) => (
          <div key={p.chave} className="gs-card">
            <span className="gs-card-emoji">{p.item.emoji}</span>
            <div className="gs-card-corpo">
              <strong>
                {p.item.nome} ×{p.qtd}
                <NotaQualidade q={p.q} />
              </strong>
              <span className="gs-card-sub">{formatarDinheiro(precoNaLoja(save, p.chave))} cada</span>
            </div>
            <div className="gs-botoes-mini">
              <button className="gs-btn-mini" onClick={() => rodar(recolherDaLoja(save, lojaId, p.chave), `${p.item.emoji} Voltou para o inventário.`)}>
                Retirar
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 className="gs-h3">Abastecer do inventário</h3>
      {noInventario.length === 0 && <p className="gs-dica">Nenhum item compatível no inventário ({cats.map((c) => NOME_CATEGORIA[c]).join(", ")}).</p>}
      <div className="gs-lista">
        {noInventario.map((p) => (
          <div key={p.chave} className="gs-card">
            <span className="gs-card-emoji">{p.item.emoji}</span>
            <div className="gs-card-corpo">
              <strong>
                {p.item.nome} ×{p.qtd}
                <NotaQualidade q={p.q} />
              </strong>
              <span className="gs-card-sub">
                Vende a {formatarDinheiro(precoNaLoja(save, p.chave))}
              </span>
            </div>
            <div className="gs-botoes-mini">
              <button className="gs-btn-mini" onClick={() => rodar(abastecerLoja(save, lojaId, p.chave, 1), `${p.item.emoji} +1 na prateleira.`)}>
                +1
              </button>
              {p.qtd > 1 && (
                <button className="gs-btn-mini" onClick={() => rodar(abastecerLoja(save, lojaId, p.chave, p.qtd), `${p.item.emoji} +${p.qtd} na prateleira.`)}>
                  Todos
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Lavagem de dinheiro (fachadas: boate, hotel e lojas) ----------

function PainelLavagem({
  save,
  predioId,
  rodar,
}: {
  save: GangstarSave;
  predioId: string;
  rodar: (r: { save: GangstarSave; erro?: string }, msg?: string) => void;
}) {
  const [valor, setValor] = useState("");
  const inst = save.predios[predioId];
  if (!inst) return null;
  const fila = Math.round(inst.lavagem?.fila ?? 0);
  const cap = capacidadeLavagem(save, inst);
  const taxa = taxaLavagem(save, inst.tipo);
  const fechado = fachadaFechada(inst);
  const alerta = suspeitaAtual(save);
  const sujoAgora = sujo(save.personagem);

  const lavar = () => {
    const limpo = valor.replace(/\D/g, "");
    const r = lavarDinheiro(save, predioId, limpo ? Number(limpo) : null);
    if (r.erro) return rodar(r);
    setValor("");
    if (r.batida) {
      const extra = [
        r.batida.preso ? "Você foi preso." : "",
        r.batida.contadoresPresos.length ? `Contadores presos: ${r.batida.contadoresPresos.join(", ")}.` : "",
      ]
        .filter(Boolean)
        .join(" ");
      return rodar(r, `🚔 Batida fiscal! A Federal apreendeu ${formatarDinheiro(r.batida.perdeu)} e lacrou esta fachada por 2h. ${extra}`);
    }
    rodar(r, `🧺 ${formatarDinheiro(r.valor ?? 0)} na fila de lavagem.`);
  };

  return (
    <div className="gs-lavagem">
      <TituloComAjuda
        pequeno
        titulo="🧺 Lavar dinheiro"
        ajuda={
          <>
            <p>
              Coloque dinheiro sujo na fila desta fachada. Ela lava {formatarDinheiro(cap)} por hora (cresce com o nível) e fica com {Math.round(taxa * 100)}% de taxa — o resto
              volta para você como dinheiro limpo, aos poucos.
            </p>
            <p>Lavar muito de uma vez sobe o alerta da Polícia Federal (+1% a cada R$ 5.000), e os roubos maiores e as extorsões também. O alerta cai 1% a cada 3 minutos. Acima de 60%, pode ter batida fiscal; acima de 90%, prisão.</p>
            <p>Contadores na gangue reduzem a taxa e o alerta; o advogado (na Delegacia) e o item raro Livro-caixa duplo também reduzem o alerta.</p>
          </>
        }
      />
      <div className="gs-loja-resumo">
        <span>🩸 Sujo: {formatarDinheiro(sujoAgora)}</span>
        <span>🧺 Na fila: {formatarDinheiro(fila)}</span>
        <span>
          ⏱️ {formatarDinheiro(cap)}/h · taxa {Math.round(taxa * 100)}%
        </span>
        <span className={alerta > 60 ? "gs-risco" : ""}>🚨 Alerta {Math.round(alerta)}%</span>
      </div>
      {fila > 0 && cap > 0 && <p className="gs-dica">Termina em cerca de {Math.ceil((fila / cap) * 60)} min.</p>}
      {fechado ? (
        <div className="gs-aviso">🚔 Lacrada pela Federal até {new Date(inst.fechadoAte!).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}. A fila volta a andar depois.</div>
      ) : (
        <div className="gs-bolsa-ordem">
          <label>
            <span>Quanto lavar (vazio = tudo)</span>
            <input inputMode="numeric" placeholder="vazio = tudo" value={valor} onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))} />
          </label>
          <button className="gs-btn gs-btn-principal" disabled={sujoAgora <= 0 || !!save.personagem.preso} onClick={lavar}>
            Lavar
          </button>
        </div>
      )}
    </div>
  );
}
