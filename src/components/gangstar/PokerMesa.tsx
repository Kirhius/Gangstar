"use client";

// Gangstar: Poker em mesas (sit & go) - v1.15.
// Mesas de R$ 50 (1 rival), 100 (2), 500 (3), 1k (4) e 5k (6). Todos comecam com fichas
// iguais ao valor da mesa; as fichas ficam separadas do dinheiro. Perdeu tudo, acabou;
// levantou da mesa, as fichas voltam em reais; quebrou todos, e campeao e ganha um item especial.
// Texas Hold'em simplificado: uma aposta por rua (dobra no Turn e no River), all-in quando
// faltam fichas e potes paralelos no showdown.

import { useEffect, useRef, useState } from "react";
import { MESAS_POKER, antePoker, type GangstarSave, type MesaPoker } from "@/lib/gangstar";
import { RARIDADES, type ItemDef } from "@/lib/gangstarItens";
import { avaliarMao, baralhoEmbaralhado, cartaTexto, cartaVermelha, compararPontuacao, decisaoIA, forcaMaoIA, nomeMao, type Carta } from "@/lib/cassino";

interface Jog {
  nome: string;
  emoji: string;
  fichas: number;
  mao: Carta[];
  contrib: number;
  foldou: boolean;
  fora: boolean;
  acao: string;
}

const RUAS = ["Pré-flop", "Flop", "Turn", "River"];

const fmt = (v: number) => `${Math.round(v).toLocaleString("pt-BR")}`;
const reais = (v: number) => `R$ ${Math.round(v).toLocaleString("pt-BR")}`;

function CartaVisual({ c, oculta }: { c?: Carta; oculta?: boolean }) {
  if (!c || oculta) return <span className="gs-carta gs-carta-verso">🂠</span>;
  return <span className={`gs-carta ${cartaVermelha(c) ? "gs-carta-vermelha" : ""}`}>{cartaTexto(c)}</span>;
}

const vivo = (j: Jog) => !j.foldou && !j.fora;
const podeAgir = (j: Jog) => vivo(j) && j.fichas > 0;

function pagarFichas(js: Jog[], i: number, valor: number): Jog[] {
  const x = Math.max(0, Math.min(valor, js[i].fichas));
  return js.map((j, k) => (k === i ? { ...j, fichas: j.fichas - x, contrib: j.contrib + x } : j));
}

export type FimMaoPoker = { fim?: "eliminado" | "campeao"; item?: ItemDef; ganho?: number };

export function PokerMesa({
  save,
  sentar,
  levantar,
  aoFimMao,
  marcarAposta,
  abandonar,
}: {
  save: GangstarSave;
  sentar: (valor: number) => string | undefined;
  levantar: () => number;
  aoFimMao: (fichas: number, fichasIas: number[]) => FimMaoPoker;
  marcarAposta: (meu: number) => void;
  abandonar: () => { perdeu: number; fim?: "eliminado" };
}) {
  const mesaSalva: MesaPoker | null = save.pokerMesa ?? null;
  const [fase, setFase] = useState<"entre" | "jogando" | "fim">("entre");
  const [js, setJs] = useState<Jog[]>([]);
  const [baralho, setBaralho] = useState<Carta[]>([]);
  const [mesa, setMesa] = useState<Carta[]>([]);
  const [rua, setRua] = useState(0);
  const [pagar, setPagar] = useState(0);
  const [texto, setTexto] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [final, setFinal] = useState<{ tipo: "eliminado" | "campeao" | "saiu"; item?: ItemDef; valor: number; mesa: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // mao abandonada (saiu da tela no meio): perde o que ja tinha apostado
  const checou = useRef(false);
  useEffect(() => {
    if (checou.current) return;
    checou.current = true;
    if (!mesaSalva?.emJogo) return;
    const r = abandonar();
    if (r.fim === "eliminado") setFinal({ tipo: "eliminado", valor: 0, mesa: mesaSalva.valor });
    else if (r.perdeu > 0) setTexto(`Você saiu no meio da mão e perdeu as ${fmt(r.perdeu)} fichas que já tinha apostado.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // guarda quanto voce ja pos na mao em andamento
  const meuNaMao = fase === "jogando" ? (js[0]?.contrib ?? 0) : 0;
  useEffect(() => {
    if (fase === "jogando") marcarAposta(meuNaMao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meuNaMao, fase]);

  const ante = mesaSalva ? antePoker(mesaSalva) : 0;
  const valorRua = (r: number) => (r < 2 ? ante : ante * 2);
  const [poteFinal, setPoteFinal] = useState(0);
  const pote = fase === "fim" ? poteFinal : js.reduce((a, j) => a + j.contrib, 0);

  // ---------- fim da mao: distribui o pote (com potes paralelos) e grava as fichas ----------
  const encerrar = (jsFim: Jog[], mesaFim: Carta[], msg: string, total: number) => {
    setPoteFinal(total);
    setJs(jsFim);
    setMesa(mesaFim);
    setTexto(msg);
    setFase("fim");
    setPagar(0);
    const r = aoFimMao(
      jsFim[0].fichas,
      jsFim.slice(1).map((j) => j.fichas),
    );
    if (r.fim === "eliminado") setFinal({ tipo: "eliminado", valor: 0, mesa: mesaSalva?.valor ?? 0 });
    if (r.fim === "campeao") setFinal({ tipo: "campeao", item: r.item, valor: r.ganho ?? 0, mesa: mesaSalva?.valor ?? 0 });
  };

  const showdown = (jsAtual: Jog[], mesaFim: Carta[]) => {
    const vivos = jsAtual.map((j, i) => ({ j, i })).filter(({ j }) => vivo(j));
    const pts = new Map(vivos.map(({ j, i }) => [i, avaliarMao([...j.mao, ...mesaFim])]));
    const niveis = [...new Set(vivos.map(({ j }) => j.contrib))].sort((a, b) => a - b);
    const ganhos = jsAtual.map(() => 0);
    let anterior = 0;
    let ultimosVencedores: number[] = [];
    for (const nivel of niveis) {
      const parte = jsAtual.reduce((a, j) => a + Math.max(0, Math.min(j.contrib, nivel) - Math.min(j.contrib, anterior)), 0);
      const elegiveis = vivos.filter(({ j }) => j.contrib >= nivel).map(({ i }) => i);
      const melhor = elegiveis.reduce((m, i) => (m < 0 || compararPontuacao(pts.get(i)!, pts.get(m)!) > 0 ? i : m), -1);
      const venc = elegiveis.filter((i) => compararPontuacao(pts.get(i)!, pts.get(melhor)!) === 0);
      const cada = Math.floor(parte / venc.length);
      venc.forEach((i, k) => (ganhos[i] += cada + (k === 0 ? parte - cada * venc.length : 0)));
      ultimosVencedores = venc;
      anterior = nivel;
    }
    // sobra de quem desistiu depois de pôr mais que todos os vivos
    const sobra = jsAtual.reduce((a, j) => a + Math.max(0, j.contrib - anterior), 0);
    if (sobra > 0 && ultimosVencedores.length) ganhos[ultimosVencedores[0]] += sobra;
    const jsFim = jsAtual.map((j, i) => ({ ...j, fichas: j.fichas + ganhos[i], contrib: 0 }));
    const topo = vivos.reduce((m, { i }) => (m < 0 || compararPontuacao(pts.get(i)!, pts.get(m)!) > 0 ? i : m), -1);
    const nomeTopo = nomeMao(pts.get(topo)!);
    const msg =
      ganhos[0] > 0
        ? `✅ Você ganhou ${fmt(ganhos[0])} fichas com ${nomeMao(pts.get(0) ?? pts.get(topo)!)}!`
        : `❌ ${jsAtual
            .map((j, i) => (ganhos[i] > 0 ? j.nome : null))
            .filter(Boolean)
            .join(" e ")} levou o pote com ${nomeTopo}.`;
    encerrar(jsFim, mesaFim, msg, jsAtual.reduce((a, j) => a + j.contrib, 0));
  };

  // termina a rua: um so vivo leva tudo; senao abre cartas ate o showdown se ninguem mais pode apostar
  const avancar = (jsAtual: Jog[], d: Carta[], mesaAtual: Carta[], ruaAtual: number) => {
    const vivos = jsAtual.filter(vivo);
    if (vivos.length === 1) {
      const idx = jsAtual.findIndex(vivo);
      const total = jsAtual.reduce((a, j) => a + j.contrib, 0);
      const jsFim = jsAtual.map((j, i) => ({ ...j, fichas: j.fichas + (i === idx ? total : 0), contrib: 0 }));
      encerrar(jsFim, mesaAtual, idx === 0 ? `✅ Todos desistiram. Você levou ${fmt(total)} fichas!` : `❌ ${jsAtual[idx].nome} levou o pote de ${fmt(total)}.`, total);
      return;
    }
    let novaMesa = [...mesaAtual];
    const dd = [...d];
    let r = ruaAtual;
    const ninguemAposta = !podeAgir(jsAtual[0]) || jsAtual.filter(podeAgir).length <= 1;
    if (r >= 3 || ninguemAposta) {
      while (novaMesa.length < 5) novaMesa.push(dd.pop()!);
      setBaralho(dd);
      showdown(jsAtual, novaMesa);
      return;
    }
    if (r === 0) novaMesa = [...novaMesa, dd.pop()!, dd.pop()!, dd.pop()!];
    else novaMesa = [...novaMesa, dd.pop()!];
    r += 1;
    setMesa(novaMesa);
    setBaralho(dd);
    setRua(r);
    setPagar(0);
    setJs(jsAtual.map((j) => ({ ...j, acao: vivo(j) ? (j.fichas <= 0 ? "All-in" : "") : j.acao })));
  };

  const iniciarMao = () => {
    if (!mesaSalva) return;
    const d = baralhoEmbaralhado();
    let novos: Jog[] = [
      { nome: "Você", emoji: "🧑", fichas: mesaSalva.fichas, mao: [d.pop()!, d.pop()!], contrib: 0, foldou: false, fora: false, acao: "" },
      ...mesaSalva.ias.map((ia) => ({
        nome: ia.nome,
        emoji: ia.emoji,
        fichas: ia.fichas,
        mao: ia.fichas > 0 ? [d.pop()!, d.pop()!] : [],
        contrib: 0,
        foldou: false,
        fora: ia.fichas <= 0,
        acao: ia.fichas <= 0 ? "Eliminado" : "",
      })),
    ];
    for (let i = 0; i < novos.length; i++) if (!novos[i].fora) novos = pagarFichas(novos, i, ante);
    novos = novos.map((j) => (vivo(j) && j.fichas <= 0 ? { ...j, acao: "All-in" } : j));
    setJs(novos);
    setBaralho(d);
    setMesa([]);
    setRua(0);
    setPagar(0);
    setTexto(null);
    setLog([`Mão ${mesaSalva.maos + 1}: entrada de ${fmt(ante)} fichas.`]);
    setFase("jogando");
    if (!podeAgir(novos[0]) || novos.filter(podeAgir).length <= 1) avancar(novos, d, [], 0);
  };

  // IA responde a uma aposta: paga (all-in se faltar) ou desiste
  const responder = (jsAtual: Jog[], i: number, valor: number, mesaAtual: Carta[], linhas: string[]): Jog[] => {
    const ia = jsAtual[i];
    if (!podeAgir(ia)) return jsAtual;
    const d = decisaoIA(forcaMaoIA(ia.mao, mesaAtual), true);
    if (d === "fold") {
      linhas.push(`${ia.nome} desistiu.`);
      return jsAtual.map((j, k) => (k === i ? { ...j, foldou: true, acao: "Desistiu" } : j));
    }
    const novo = pagarFichas(jsAtual, i, valor);
    const allin = novo[i].fichas <= 0;
    linhas.push(`${ia.nome} ${allin ? "foi all-in" : "pagou"}.`);
    return novo.map((j, k) => (k === i ? { ...j, acao: allin ? "All-in" : "Pagou" } : j));
  };

  const agir = (acao: "mesa" | "apostar" | "pagar" | "desistir") => {
    const valor = valorRua(rua);
    const linhas: string[] = [];
    let atual = js.map((j) => ({ ...j }));
    if (acao === "desistir") {
      atual[0] = { ...atual[0], foldou: true, acao: "Desistiu" };
      setLog((l) => [...l, "Você desistiu."]);
      const mesaFim = [...mesa];
      const dd = [...baralho];
      while (mesaFim.length < 5) mesaFim.push(dd.pop()!);
      if (atual.filter(vivo).length === 1) return avancar(atual, dd, mesa, rua);
      return showdown(atual, mesaFim);
    }
    if (acao === "pagar") {
      atual = pagarFichas(atual, 0, pagar);
      linhas.push(atual[0].fichas <= 0 ? "Você foi all-in." : `Você pagou ${fmt(pagar)}.`);
      setLog((l) => [...l, ...linhas]);
      return avancar(atual, baralho, mesa, rua);
    }
    if (acao === "apostar") {
      atual = pagarFichas(atual, 0, valor);
      linhas.push(atual[0].fichas <= 0 ? "Você foi all-in." : `Você apostou ${fmt(valor)}.`);
      for (let i = 1; i < atual.length; i++) atual = responder(atual, i, valor, mesa, linhas);
      setLog((l) => [...l, ...linhas]);
      setJs(atual);
      return avancar(atual, baralho, mesa, rua);
    }
    // mesa (check): a primeira IA que quiser aposta; as outras respondem
    linhas.push("Você deu mesa.");
    let quem = -1;
    for (let i = 1; i < atual.length; i++) {
      if (!podeAgir(atual[i])) continue;
      if (quem < 0) {
        const d = decisaoIA(forcaMaoIA(atual[i].mao, mesa), false);
        if (d === "raise") {
          quem = i;
          atual = pagarFichas(atual, i, valor);
          const allin = atual[i].fichas <= 0;
          linhas.push(`${atual[i].nome} ${allin ? "foi all-in" : `apostou ${fmt(valor)}`}.`);
          atual[i] = { ...atual[i], acao: allin ? "All-in" : "Apostou" };
        } else {
          atual[i] = { ...atual[i], acao: "Mesa" };
        }
        continue;
      }
      atual = responder(atual, i, valor, mesa, linhas);
    }
    if (quem > 1) for (let i = 1; i < quem; i++) atual = responder(atual, i, valor, mesa, linhas);
    setLog((l) => [...l, ...linhas]);
    setJs(atual);
    if (quem >= 0 && atual.filter(vivo).length > 1) {
      setPagar(Math.min(valor, atual[0].fichas));
      return;
    }
    avancar(atual, baralho, mesa, rua);
  };

  // ---------- telas ----------

  if (final) {
    const corItem = final.item ? RARIDADES[final.item.raridade ?? "comum"].cor : undefined;
    return (
      <div className="gs-cassino-mesa">
        {final.tipo === "campeao" ? (
          <div className="gs-aviso gs-aviso-ok">
            🏆 Campeão da mesa de {reais(final.mesa)}! Você quebrou todo mundo e levou {reais(final.valor)}
            {final.item && (
              <>
                {" "}
                e o item especial{" "}
                <strong style={{ color: corItem }}>
                  {final.item.emoji} {final.item.nome}
                </strong>{" "}
                ({final.item.descricao})
              </>
            )}
            .
          </div>
        ) : final.tipo === "eliminado" ? (
          <div className="gs-aviso">💸 Suas fichas acabaram na mesa de {reais(final.mesa)}. Fim de jogo.</div>
        ) : (
          <div className="gs-aviso">Você levantou da mesa com {reais(final.valor)}.</div>
        )}
        <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => { setFinal(null); setFase("entre"); setJs([]); }}>
          Voltar às mesas
        </button>
      </div>
    );
  }

  if (!mesaSalva) {
    return (
      <div className="gs-cassino-mesa">
        <p className="gs-p-intro">
          Escolha a mesa. Todos começam com fichas iguais ao valor da mesa, separadas do seu dinheiro. Perdeu tudo, acabou; levantou, as fichas voltam em reais; quebrou
          todo mundo, é campeão e ganha um item especial.
        </p>
        <div className="gs-poker-mesas">
          {MESAS_POKER.map((m) => (
            <button
              key={m.valor}
              className="gs-poker-mesa-btn"
              disabled={save.personagem.dinheiro < m.valor}
              onClick={() => {
                const e = sentar(m.valor);
                setErro(e ?? null);
                setFase("entre");
              }}
            >
              <strong>{reais(m.valor)}</strong>
              <small>
                contra {m.oponentes} {m.oponentes === 1 ? "jogador" : "jogadores"}
              </small>
            </button>
          ))}
        </div>
        {erro && <div className="gs-aviso">⚠️ {erro}</div>}
      </div>
    );
  }

  const valor = valorRua(rua);
  const eu = js[0];
  const fichasEu = fase === "entre" ? mesaSalva.fichas : (eu?.fichas ?? 0);
  return (
    <div className="gs-cassino-mesa gs-poker-mesa">
      <div className="gs-torneio-status">
        <span>♠️ Mesa de {reais(mesaSalva.valor)}</span>
        <strong>{fmt(fichasEu)} fichas</strong>
        <span>
          Mão {mesaSalva.maos + (fase === "entre" ? 1 : fase === "fim" ? 0 : 1)} · entrada {fmt(ante)}
        </span>
      </div>

      <div className="gs-poker-ias">
        {(fase === "entre" ? mesaSalva.ias.map((ia) => ({ ...ia, mao: [] as Carta[], foldou: false, fora: ia.fichas <= 0, acao: ia.fichas <= 0 ? "Eliminado" : "", contrib: 0 })) : js.slice(1)).map(
          (ia, i) => (
            <div key={`${ia.nome}-${i}`} className={`gs-mao ${!ia.fora && !ia.foldou ? "" : "gs-mao-fora"}`}>
              <span className="gs-mao-titulo">
                {ia.emoji} {ia.nome} · {fmt(ia.fichas)} {ia.acao && <em>· {ia.acao}</em>}
              </span>
              {fase !== "entre" && !ia.fora && (
                <div className="gs-cartas">
                  {ia.mao.map((c, k) => (
                    <CartaVisual key={k} c={c} oculta={fase !== "fim" || ia.foldou} />
                  ))}
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {fase !== "entre" && (
        <>
          <div className="gs-mao gs-poker-centro">
            <span className="gs-mao-titulo">
              {fase === "fim" ? "Fim da mão" : RUAS[rua]} · Pote {fmt(pote)}
            </span>
            <div className="gs-cartas">
              {[0, 1, 2, 3, 4].map((i) => (mesa[i] ? <CartaVisual key={i} c={mesa[i]} /> : <span key={i} className="gs-carta gs-carta-vazia" />))}
            </div>
          </div>
          <div className="gs-mao">
            <span className="gs-mao-titulo">
              Você · {fmt(eu?.fichas ?? 0)} fichas{mesa.length >= 3 && eu ? ` · ${nomeMao(avaliarMao([...eu.mao, ...mesa]))}` : ""}
            </span>
            <div className="gs-cartas">{eu?.mao.map((c, i) => <CartaVisual key={i} c={c} />)}</div>
          </div>
        </>
      )}

      {fase === "jogando" &&
        eu &&
        (pagar > 0 ? (
          <div className="gs-botoes-duplos">
            <button className="gs-btn gs-btn-principal" onClick={() => agir("pagar")}>
              {pagar >= eu.fichas ? `All-in ${fmt(eu.fichas)}` : `Pagar ${fmt(pagar)}`}
            </button>
            <button className="gs-btn gs-btn-secundario" onClick={() => agir("desistir")}>
              Desistir
            </button>
          </div>
        ) : (
          <div className="gs-botoes-triplos">
            <button className="gs-btn gs-btn-secundario" onClick={() => agir("mesa")}>
              Mesa
            </button>
            <button className="gs-btn gs-btn-principal" onClick={() => agir("apostar")}>
              {valor >= eu.fichas ? `All-in ${fmt(eu.fichas)}` : `Apostar ${fmt(valor)}`}
            </button>
            <button className="gs-btn gs-btn-secundario" onClick={() => agir("desistir")}>
              Desistir
            </button>
          </div>
        ))}

      {fase !== "jogando" && (
        <div className="gs-botoes-duplos">
          <button className="gs-btn gs-btn-principal" onClick={iniciarMao}>
            {fase === "fim" ? "Próxima mão" : "Dar as cartas"}
          </button>
          <button
            className="gs-btn gs-btn-secundario"
            onClick={() => {
              const v = levantar();
              setFinal({ tipo: "saiu", valor: v, mesa: mesaSalva.valor });
            }}
          >
            Levantar ({reais(mesaSalva.fichas)})
          </button>
        </div>
      )}

      {texto && <div className="gs-aviso">{texto}</div>}
      {fase !== "entre" && (
        <div className="gs-poker-log">
          {log.slice(-6).map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  );
}
