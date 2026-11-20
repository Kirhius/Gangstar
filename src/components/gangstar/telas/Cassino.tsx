"use client";

// Gangstar: Cassino (aberto pela Boate do Hub e pela sua boate na Minha Cidade).
// Quatro jogos: Roleta, Blackjack, Caca-niquel (com jackpot acumulado) e Poker em mesas
// (sit & go contra IAs, v1.15), mais o torneio diario de poker e o agiota para quem quebrar.
// As apostas saem do dinheiro em maos do personagem.

import { useEffect, useRef, useState } from "react";
import {
  BUYIN_TORNEIO,
  FICHAS_TORNEIO,
  LIMITE_QUEBRADO,
  MAOS_TORNEIO,
  anteTorneio,
  aplicarGiroSlot,
  atualizarTorneio,
  contarVitoriaCassino,
  entrarTorneio,
  jackpotAtual,
  opcoesEmprestimo,
  pagarAgiota,
  pegarEmprestimo,
  premiosTorneio,
  rivaisTorneio,
  torneioDeHoje,
  type GangstarSave,
  saldoAceitandoSujo,
  fimMaoPoker,
  sairMesaPoker,
  sentarMesaPoker,
  marcarApostaPoker,
  abandonarMaoPoker,
} from "@/lib/gangstar";
import { PokerMesa } from "../PokerMesa";
import {
  SIMBOLOS_SLOT,
  TABELA_SLOT,
  avaliarMao,
  baralhoEmbaralhado,
  cartaTexto,
  cartaVermelha,
  compararPontuacao,
  corNumero,
  decisaoIA,
  ehBlackjack,
  forcaMaoIA,
  girarRoleta,
  girarSlot,
  jogarBanca,
  nomeMao,
  pagamentoRoleta,
  premioSlot,
  resultadoBJ,
  valorMaoBJ,
  type ApostaRoleta,
  type Carta,
} from "@/lib/cassino";

type Jogo = "roleta" | "blackjack" | "slot" | "poker" | "torneio";

const FICHAS = [50, 100, 500, 1000, 5000];

const formatarReais = (v: number) => formatarDinheiro(v);

function formatarDinheiro(v: number): string {
  return `R$ ${Math.round(v).toLocaleString("pt-BR")}`;
}

function CartaVisual({ c, oculta }: { c?: Carta; oculta?: boolean }) {
  if (!c || oculta) return <span className="gs-carta gs-carta-verso">🂠</span>;
  return <span className={`gs-carta ${cartaVermelha(c) ? "gs-carta-vermelha" : ""}`}>{cartaTexto(c)}</span>;
}

function SeletorAposta({ aposta, setAposta, dinheiro }: { aposta: number; setAposta: (v: number) => void; dinheiro: number }) {
  return (
    <div className="gs-cassino-fichas">
      {FICHAS.map((f) => (
        <button key={f} className={`gs-ficha ${aposta === f ? "gs-ficha-ativa" : ""}`} disabled={dinheiro < f} onClick={() => setAposta(f)}>
          {f >= 1000 ? `${f / 1000}k` : f}
        </button>
      ))}
    </div>
  );
}

export function Cassino({ save, aoAtualizar, aoVoltar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void; aoVoltar: () => void }) {
  const [jogo, setJogo] = useState<Jogo>("roleta");
  const [aposta, setAposta] = useState(100);
  const saveRef = useRef(save);
  saveRef.current = save;
  const dinheiro = save.personagem.dinheiro;

  // aplica uma mudanca no save mais recente
  const aplicar = (fn: (s: GangstarSave) => GangstarSave) => {
    const novo = fn(saveRef.current);
    saveRef.current = novo;
    aoAtualizar(novo);
  };
  // credita/debita no dinheiro em maos (vitoria = conta para as conquistas)
  const mexerDinheiro = (delta: number, vitoria = false) =>
    aplicar((s) => {
      const novo = { ...s, personagem: { ...s.personagem, dinheiro: Math.max(0, s.personagem.dinheiro + Math.round(delta)) } };
      return vitoria ? contarVitoriaCassino(novo) : novo;
    });
  const [msgAgiota, setMsgAgiota] = useState<string | null>(null);
  const agiota = save.agiota;

  return (
    <div className="gs-pagina">
      <button className="gs-link-voltar" onClick={aoVoltar}>
        ← Sair do cassino
      </button>
      <h2 className="gs-h2">🎰 Cassino</h2>
      <p className="gs-p-intro">Saldo em mãos: {formatarDinheiro(dinheiro)}. Aposte com responsabilidade — a casa sempre leva uma parte.</p>

      {agiota && (
        <div className="gs-card gs-agiota">
          <span className="gs-card-emoji">🦈</span>
          <div className="gs-card-corpo">
            <strong>Dívida com o agiota: {formatarDinheiro(agiota.divida)}</strong>
            <span className={`gs-card-sub ${agiota.venceEm - Date.now() < 3 * 3600000 ? "gs-risco" : ""}`}>
              Vence em {Math.max(0, Math.floor((agiota.venceEm - Date.now()) / 3600000))}h — se não pagar, ele cobra do bolso, do banco e na porrada.
            </span>
          </div>
          <button className="gs-btn-mini" disabled={saldoAceitandoSujo(save.personagem) <= 0} onClick={() => aplicar((s) => pagarAgiota(s).save)}>
            Pagar
          </button>
        </div>
      )}
      {!agiota && dinheiro < LIMITE_QUEBRADO && (
        <div className="gs-card gs-agiota">
          <span className="gs-card-emoji">🦈</span>
          <div className="gs-card-corpo">
            <strong>Quebrou a banca? O agiota empresta.</strong>
            <span className="gs-card-sub">Juros de 30% em 24 horas. Não pagar sai caro.</span>
            <div className="gs-agiota-opcoes">
              {opcoesEmprestimo(save).map((v) => (
                <button
                  key={v}
                  className="gs-btn-mini"
                  onClick={() => {
                    const r = pegarEmprestimo(saveRef.current, v);
                    if (r.erro) return setMsgAgiota(r.erro);
                    setMsgAgiota(`Você pegou ${formatarDinheiro(v)}. Deve ${formatarDinheiro(Math.round(v * 1.3))}.`);
                    aplicar(() => r.save);
                  }}
                >
                  {formatarDinheiro(v)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {msgAgiota && <div className="gs-aviso">{msgAgiota}</div>}

      <div className="gs-sub-abas gs-sub-abas-bandidos">
        {(
          [
            ["roleta", "🎡 Roleta"],
            ["blackjack", "🃏 Blackjack"],
            ["slot", "🎰 Caça-níquel"],
            ["poker", "♠️ Poker"],
            ["torneio", "🏆 Torneio"],
          ] as [Jogo, string][]
        ).map(([id, rotulo]) => (
          <button key={id} className={`gs-sub-aba ${jogo === id ? "gs-sub-aba-ativa" : ""}`} onClick={() => setJogo(id)}>
            {rotulo}
          </button>
        ))}
      </div>

      {jogo !== "torneio" && jogo !== "poker" && <SeletorAposta aposta={aposta} setAposta={setAposta} dinheiro={dinheiro} />}

      {jogo === "roleta" && <Roleta aposta={aposta} dinheiro={dinheiro} mexer={mexerDinheiro} />}
      {jogo === "blackjack" && <Blackjack aposta={aposta} dinheiro={dinheiro} mexer={mexerDinheiro} />}
      {jogo === "slot" && <CacaNiquel aposta={aposta} dinheiro={dinheiro} mexer={mexerDinheiro} save={save} aplicar={aplicar} />}
      {jogo === "poker" && (
        <PokerMesa
          save={save}
          sentar={(valor) => {
            const r = sentarMesaPoker(saveRef.current, valor);
            if (!r.erro) aplicar(() => r.save);
            return r.erro;
          }}
          levantar={() => {
            const r = sairMesaPoker(saveRef.current);
            aplicar(() => r.save);
            return r.valor;
          }}
          marcarAposta={(meu) => aplicar((s) => marcarApostaPoker(s, meu))}
          abandonar={() => {
            const r = abandonarMaoPoker(saveRef.current);
            if (r.perdeu > 0) aplicar(() => r.save);
            return r;
          }}
          aoFimMao={(fichas, fichasIas) => {
            const r = fimMaoPoker(saveRef.current, fichas, fichasIas);
            aplicar(() => r.save);
            return r;
          }}
        />
      )}
      {jogo === "torneio" && <Torneio save={save} aplicar={aplicar} />}
    </div>
  );
}

type PropsJogo = { aposta: number; dinheiro: number; mexer: (delta: number, vitoria?: boolean) => void };

// ---------- Roleta ----------

const OPCOES_ROLETA: { rotulo: string; aposta: ApostaRoleta; paga: string }[] = [
  { rotulo: "🔴 Vermelho", aposta: { tipo: "vermelho" }, paga: "1:1" },
  { rotulo: "⚫ Preto", aposta: { tipo: "preto" }, paga: "1:1" },
  { rotulo: "Par", aposta: { tipo: "par" }, paga: "1:1" },
  { rotulo: "Ímpar", aposta: { tipo: "impar" }, paga: "1:1" },
  { rotulo: "1–18", aposta: { tipo: "baixo" }, paga: "1:1" },
  { rotulo: "19–36", aposta: { tipo: "alto" }, paga: "1:1" },
  { rotulo: "1ª dúzia", aposta: { tipo: "duzia", duzia: 1 }, paga: "2:1" },
  { rotulo: "2ª dúzia", aposta: { tipo: "duzia", duzia: 2 }, paga: "2:1" },
  { rotulo: "3ª dúzia", aposta: { tipo: "duzia", duzia: 3 }, paga: "2:1" },
];

function Roleta({ aposta, dinheiro, mexer }: PropsJogo) {
  const [escolha, setEscolha] = useState(0);
  const [numero, setNumero] = useState(7);
  const [cheio, setCheio] = useState(false);
  const [girando, setGirando] = useState(false);
  const [mostrado, setMostrado] = useState<number | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  const girar = () => {
    if (dinheiro < aposta || girando) return;
    setGirando(true);
    mexer(-aposta);
    setResultado(null);
    const final = girarRoleta();
    let passos = 0;
    const t = setInterval(() => {
      passos++;
      setMostrado(Math.floor(Math.random() * 37));
      if (passos >= 14) {
        clearInterval(t);
        setMostrado(final);
        setGirando(false);
        const ap: ApostaRoleta = cheio ? { tipo: "numero", numero } : OPCOES_ROLETA[escolha].aposta;
        const mult = pagamentoRoleta(ap, final);
        if (mult > 0) {
          mexer(aposta * (mult + 1), true);
          setResultado(`✅ Deu ${final}! Você ganhou ${formatarDinheiro(aposta * mult)}.`);
        } else setResultado(`❌ Deu ${final}. Perdeu ${formatarDinheiro(aposta)}.`);
      }
    }, 70);
  };

  return (
    <div className="gs-cassino-mesa">
      <div className={`gs-roleta-bola gs-roleta-${mostrado === null ? "verde" : corNumero(mostrado)}`}>{mostrado ?? "?"}</div>
      <div className="gs-cassino-grade">
        {OPCOES_ROLETA.map((o, i) => (
          <button key={o.rotulo} className={`gs-cassino-opcao ${!cheio && escolha === i ? "gs-cassino-opcao-ativa" : ""}`} onClick={() => { setCheio(false); setEscolha(i); }}>
            {o.rotulo}
            <small>{o.paga}</small>
          </button>
        ))}
      </div>
      <div className="gs-linha-campo gs-roleta-numero">
        <button className={`gs-cassino-opcao ${cheio ? "gs-cassino-opcao-ativa" : ""}`} onClick={() => setCheio(true)}>
          Número cheio <small>35:1</small>
        </button>
        <input className="gs-input" type="number" min={0} max={36} value={numero} onChange={(e) => { setCheio(true); setNumero(Math.max(0, Math.min(36, Number(e.target.value) || 0))); }} />
      </div>
      <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={dinheiro < aposta || girando} onClick={girar}>
        Girar — {formatarDinheiro(aposta)}
      </button>
      {resultado && <div className="gs-aviso">{resultado}</div>}
    </div>
  );
}

// ---------- Blackjack ----------

function Blackjack({ aposta, dinheiro, mexer }: PropsJogo) {
  const [baralho, setBaralho] = useState<Carta[]>([]);
  const [jog, setJog] = useState<Carta[]>([]);
  const [banca, setBanca] = useState<Carta[]>([]);
  const [valor, setValor] = useState(0);
  const [fase, setFase] = useState<"aposta" | "jogando" | "fim">("aposta");
  const [texto, setTexto] = useState<string | null>(null);

  const terminar = (j: Carta[], b: Carta[], d: Carta[], v: number) => {
    const bancaFinal = valorMaoBJ(j) > 21 ? { banca: b, baralho: d } : jogarBanca(b, d);
    const r = resultadoBJ(j, bancaFinal.banca);
    setBanca(bancaFinal.banca);
    setBaralho(bancaFinal.baralho);
    if (r.mult > 0) mexer(v * r.mult, r.mult > 1);
    setTexto(`${r.mult > 1 ? "✅" : r.mult === 1 ? "🤝" : "❌"} ${r.texto}`);
    setFase("fim");
  };

  const dar = () => {
    if (dinheiro < aposta) return;
    mexer(-aposta);
    const d = baralhoEmbaralhado();
    const j = [d.pop()!, d.pop()!];
    const b = [d.pop()!, d.pop()!];
    setJog(j);
    setBanca(b);
    setBaralho(d);
    setValor(aposta);
    setTexto(null);
    setFase("jogando");
    if (ehBlackjack(j) || ehBlackjack(b)) terminar(j, b, d, aposta);
  };
  const pedir = () => {
    const d = [...baralho];
    const j = [...jog, d.pop()!];
    setJog(j);
    setBaralho(d);
    if (valorMaoBJ(j) >= 21) terminar(j, banca, d, valor);
  };
  const parar = () => terminar(jog, banca, baralho, valor);
  const dobrar = () => {
    if (dinheiro < valor) return;
    mexer(-valor);
    const d = [...baralho];
    const j = [...jog, d.pop()!];
    setJog(j);
    setValor(valor * 2);
    terminar(j, banca, d, valor * 2);
  };

  return (
    <div className="gs-cassino-mesa">
      {fase !== "aposta" && (
        <>
          <div className="gs-mao">
            <span className="gs-mao-titulo">Banca {fase === "fim" ? `(${valorMaoBJ(banca)})` : ""}</span>
            <div className="gs-cartas">
              {banca.map((c, i) => (
                <CartaVisual key={i} c={c} oculta={fase === "jogando" && i === 1} />
              ))}
            </div>
          </div>
          <div className="gs-mao">
            <span className="gs-mao-titulo">Você ({valorMaoBJ(jog)}) · aposta {formatarDinheiro(valor)}</span>
            <div className="gs-cartas">
              {jog.map((c, i) => (
                <CartaVisual key={i} c={c} />
              ))}
            </div>
          </div>
        </>
      )}
      {fase === "jogando" ? (
        <div className="gs-botoes-triplos">
          <button className="gs-btn gs-btn-principal" onClick={pedir}>
            Pedir
          </button>
          <button className="gs-btn gs-btn-secundario" onClick={parar}>
            Parar
          </button>
          <button className="gs-btn gs-btn-secundario" disabled={jog.length !== 2 || dinheiro < valor} onClick={dobrar}>
            Dobrar
          </button>
        </div>
      ) : (
        <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={dinheiro < aposta} onClick={dar}>
          {fase === "fim" ? "Nova mão" : "Dar as cartas"} — {formatarDinheiro(aposta)}
        </button>
      )}
      {texto && <div className="gs-aviso">{texto}</div>}
      <p className="gs-dica">Banca para no 17. Blackjack paga 3:2, vitória paga 1:1.</p>
    </div>
  );
}

// ---------- Caca-niquel ----------

function CacaNiquel({ aposta, dinheiro, mexer, save, aplicar }: PropsJogo & { save: GangstarSave; aplicar: (fn: (s: GangstarSave) => GangstarSave) => void }) {
  const [rolos, setRolos] = useState<number[]>([5, 5, 5]);
  const [girando, setGirando] = useState(false);
  const [texto, setTexto] = useState<string | null>(null);

  const girar = () => {
    if (dinheiro < aposta || girando) return;
    mexer(-aposta);
    setGirando(true);
    setTexto(null);
    const final = girarSlot();
    let passos = 0;
    const t = setInterval(() => {
      passos++;
      setRolos([0, 1, 2].map(() => Math.floor(Math.random() * SIMBOLOS_SLOT.length)));
      if (passos >= 12) {
        clearInterval(t);
        setRolos(final);
        setGirando(false);
        const mult = premioSlot(final);
        const tripla7 = final.every((x) => x === 5);
        let jackpot = 0;
        aplicar((s) => {
          const r = aplicarGiroSlot(s, aposta, tripla7);
          jackpot = r.premioJackpot;
          return r.save;
        });
        if (jackpot > 0) {
          mexer(aposta * mult, true);
          setTexto(`💥 JACKPOT! ${formatarDinheiro(jackpot)} + ${formatarDinheiro(aposta * mult)}!`);
        } else if (mult > 0) {
          mexer(aposta * mult, true);
          setTexto(`🎉 Prêmio de ${formatarDinheiro(aposta * mult)} (${mult}x)!`);
        } else setTexto("Nada dessa vez.");
      }
    }, 70);
  };

  return (
    <div className="gs-cassino-mesa">
      <div className="gs-jackpot">
        <small>JACKPOT</small>
        <strong>{formatarDinheiro(jackpotAtual(save))}</strong>
        <small>7️⃣7️⃣7️⃣ leva tudo apostando R$ 1.000 ou mais (proporcional abaixo disso). Cada giro soma 5% da aposta.</small>
      </div>
      <div className="gs-slot-rolos">
        {rolos.map((r, i) => (
          <span key={i} className="gs-slot-rolo">
            {SIMBOLOS_SLOT[r]}
          </span>
        ))}
      </div>
      <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={dinheiro < aposta || girando} onClick={girar}>
        Puxar a alavanca — {formatarDinheiro(aposta)}
      </button>
      {texto && <div className="gs-aviso">{texto}</div>}
      <div className="gs-slot-tabela">
        {TABELA_SLOT.map((t) => (
          <span key={t.simbolo}>
            {t.simbolo}
            {t.simbolo}
            {t.simbolo} = {t.premio}x
          </span>
        ))}
        <span>🍒🍒 = 2,5x</span>
      </div>
    </div>
  );
}

// ---------- Poker Texas Hold'em ----------

interface JogadorIA {
  nome: string;
  emoji: string;
  mao: Carta[];
  ativo: boolean;
  acao: string;
}

const RUAS = ["Pré-flop", "Flop", "Turn", "River"];

function Poker({ aposta, dinheiro, mexer, onFimMao, rotuloFichas }: PropsJogo & { onFimMao?: () => void; rotuloFichas?: boolean }) {
  // no torneio os valores sao fichas, nao reais
  const formatarDinheiro = rotuloFichas ? (v: number) => `${v.toLocaleString("pt-BR")} fichas` : formatarReais;
  const [fase, setFase] = useState<"aposta" | "jogando" | "fim">("aposta");
  const [baralho, setBaralho] = useState<Carta[]>([]);
  const [mao, setMao] = useState<Carta[]>([]);
  const [mesa, setMesa] = useState<Carta[]>([]);
  const [ias, setIas] = useState<JogadorIA[]>([]);
  const [pote, setPote] = useState(0);
  const [rua, setRua] = useState(0);
  const [ante, setAnte] = useState(0);
  const [pagar, setPagar] = useState(0);
  const [texto, setTexto] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => setTexto(null), [aposta]);

  const valorAposta = (r: number, a: number) => (r < 2 ? a : a * 2);

  const iniciar = () => {
    if (dinheiro < aposta) return;
    mexer(-aposta);
    const d = baralhoEmbaralhado();
    const minha = [d.pop()!, d.pop()!];
    const novos: JogadorIA[] = [
      { nome: "Don Corvo", emoji: "🎩", mao: [d.pop()!, d.pop()!], ativo: true, acao: "" },
      { nome: "Lady Ás", emoji: "💄", mao: [d.pop()!, d.pop()!], ativo: true, acao: "" },
    ];
    setBaralho(d);
    setMao(minha);
    setIas(novos);
    setMesa([]);
    setPote(aposta * 3);
    setAnte(aposta);
    setRua(0);
    setPagar(0);
    setTexto(null);
    setLog([`Todos colocaram ${formatarDinheiro(aposta)} de entrada.`]);
    setFase("jogando");
  };

  const showdown = (iasFinal: JogadorIA[], mesaFinal: Carta[], poteFinal: number, voceAtivo: boolean) => {
    const competidores: { nome: string; voce: boolean; pts: number[] }[] = [];
    if (voceAtivo) competidores.push({ nome: "Você", voce: true, pts: avaliarMao([...mao, ...mesaFinal]) });
    for (const ia of iasFinal) if (ia.ativo) competidores.push({ nome: ia.nome, voce: false, pts: avaliarMao([...ia.mao, ...mesaFinal]) });
    competidores.sort((a, b) => compararPontuacao(b.pts, a.pts));
    const vencedores = competidores.filter((c) => compararPontuacao(c.pts, competidores[0].pts) === 0);
    const parte = poteFinal / vencedores.length;
    const voceGanhou = vencedores.some((v) => v.voce);
    if (voceGanhou) mexer(parte, true);
    setTexto(
      voceGanhou
        ? `✅ Você ${vencedores.length > 1 ? "dividiu" : "levou"} o pote com ${nomeMao(competidores[0].pts)}: ${formatarDinheiro(parte)}!`
        : `❌ ${vencedores.map((v) => v.nome).join(" e ")} venceu com ${nomeMao(competidores[0].pts)}.`,
    );
    setIas(iasFinal);
    setFase("fim");
    onFimMao?.();
  };

  // fim da rodada de apostas: avanca a rua ou vai para o showdown
  const avancar = (iasAtual: JogadorIA[], poteAtual: number, d: Carta[], mesaAtual: Carta[], ruaAtual: number) => {
    const ativas = iasAtual.filter((i) => i.ativo);
    if (ativas.length === 0) {
      mexer(poteAtual, true);
      setIas(iasAtual);
      onFimMao?.();
      setPote(poteAtual);
      setTexto(`✅ Todos desistiram. Você levou ${formatarDinheiro(poteAtual)}!`);
      setFase("fim");
      return;
    }
    if (ruaAtual >= 3) {
      setPote(poteAtual);
      setMesa(mesaAtual);
      showdown(iasAtual, mesaAtual, poteAtual, true);
      return;
    }
    const novaMesa = [...mesaAtual];
    const dd = [...d];
    if (ruaAtual === 0) novaMesa.push(dd.pop()!, dd.pop()!, dd.pop()!);
    else novaMesa.push(dd.pop()!);
    setMesa(novaMesa);
    setBaralho(dd);
    setRua(ruaAtual + 1);
    setPote(poteAtual);
    setPagar(0);
    setIas(iasAtual.map((i) => ({ ...i, acao: i.ativo ? "" : i.acao })));
  };

  const agir = (acao: "mesa" | "apostar" | "pagar" | "desistir") => {
    const valor = valorAposta(rua, ante);
    const novoLog: string[] = [];
    if (acao === "desistir") {
      setLog((l) => [...l, "Você desistiu."]);
      // as IAs vao ao showdown entre si (so para mostrar quem venceria)
      const mesaCompleta = [...mesa];
      const dd = [...baralho];
      while (mesaCompleta.length < 5) mesaCompleta.push(dd.pop()!);
      setMesa(mesaCompleta);
      showdown(ias, mesaCompleta, pote, false);
      return;
    }
    if (acao === "pagar") {
      mexer(-pagar);
      novoLog.push(`Você pagou ${formatarDinheiro(pagar)}.`);
      setLog((l) => [...l, ...novoLog]);
      avancar(ias, pote + pagar, baralho, mesa, rua);
      return;
    }
    let poteAtual = pote;
    let iasAtual = ias.map((i) => ({ ...i }));
    if (acao === "apostar") {
      if (dinheiro < valor) return;
      mexer(-valor);
      poteAtual += valor;
      novoLog.push(`Você apostou ${formatarDinheiro(valor)}.`);
      iasAtual = iasAtual.map((ia) => {
        if (!ia.ativo) return ia;
        const d = decisaoIA(forcaMaoIA(ia.mao, mesa), true);
        if (d === "fold") {
          novoLog.push(`${ia.nome} desistiu.`);
          return { ...ia, ativo: false, acao: "Desistiu" };
        }
        poteAtual += valor;
        novoLog.push(`${ia.nome} pagou.`);
        return { ...ia, acao: "Pagou" };
      });
      setLog((l) => [...l, ...novoLog]);
      setIas(iasAtual);
      avancar(iasAtual, poteAtual, baralho, mesa, rua);
      return;
    }
    // mesa (check): uma IA pode apostar; as outras pagam ou desistem
    novoLog.push("Você deu mesa.");
    let quemApostou = -1;
    iasAtual = iasAtual.map((ia, idx) => {
      if (!ia.ativo) return ia;
      const forca = forcaMaoIA(ia.mao, mesa);
      if (quemApostou < 0) {
        const d = decisaoIA(forca, false);
        if (d === "raise") {
          quemApostou = idx;
          poteAtual += valor;
          novoLog.push(`${ia.nome} apostou ${formatarDinheiro(valor)}.`);
          return { ...ia, acao: "Apostou" };
        }
        novoLog.push(`${ia.nome} deu mesa.`);
        return { ...ia, acao: "Mesa" };
      }
      const d = decisaoIA(forca, true);
      if (d === "fold") {
        novoLog.push(`${ia.nome} desistiu.`);
        return { ...ia, ativo: false, acao: "Desistiu" };
      }
      poteAtual += valor;
      novoLog.push(`${ia.nome} pagou.`);
      return { ...ia, acao: "Pagou" };
    });
    // quem deu mesa antes da aposta tambem precisa responder
    if (quemApostou > 0) {
      iasAtual = iasAtual.map((ia, idx) => {
        if (idx >= quemApostou || !ia.ativo) return ia;
        const d = decisaoIA(forcaMaoIA(ia.mao, mesa), true);
        if (d === "fold") {
          novoLog.push(`${ia.nome} desistiu.`);
          return { ...ia, ativo: false, acao: "Desistiu" };
        }
        poteAtual += valor;
        novoLog.push(`${ia.nome} pagou.`);
        return { ...ia, acao: "Pagou" };
      });
    }
    setLog((l) => [...l, ...novoLog]);
    setIas(iasAtual);
    if (quemApostou >= 0) {
      setPote(poteAtual);
      setPagar(valor);
      return;
    }
    avancar(iasAtual, poteAtual, baralho, mesa, rua);
  };

  const valor = valorAposta(rua, ante);
  return (
    <div className="gs-cassino-mesa gs-poker-mesa">
      {fase === "aposta" ? (
        <>
          <p className="gs-p-intro">
            {rotuloFichas
              ? "Mão do torneio: a entrada é o ante atual em fichas; no Turn e no River a aposta dobra."
              : "Texas Hold'em contra 2 jogadores de IA. A entrada é o valor da ficha escolhida; no Turn e no River a aposta dobra."}
          </p>
          <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={dinheiro < aposta} onClick={iniciar}>
            Sentar à mesa — {formatarDinheiro(aposta)}
          </button>
        </>
      ) : (
        <>
          <div className="gs-poker-ias">
            {ias.map((ia) => (
              <div key={ia.nome} className={`gs-mao ${ia.ativo ? "" : "gs-mao-fora"}`}>
                <span className="gs-mao-titulo">
                  {ia.emoji} {ia.nome} {ia.acao && <em>· {ia.acao}</em>}
                </span>
                <div className="gs-cartas">
                  {ia.mao.map((c, i) => (
                    <CartaVisual key={i} c={c} oculta={fase !== "fim"} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="gs-mao gs-poker-centro">
            <span className="gs-mao-titulo">
              {fase === "fim" ? "Fim da mão" : RUAS[rua]} · Pote {formatarDinheiro(pote)}
            </span>
            <div className="gs-cartas">
              {[0, 1, 2, 3, 4].map((i) => (mesa[i] ? <CartaVisual key={i} c={mesa[i]} /> : <span key={i} className="gs-carta gs-carta-vazia" />))}
            </div>
          </div>
          <div className="gs-mao">
            <span className="gs-mao-titulo">Você{mesa.length >= 3 ? ` · ${nomeMao(avaliarMao([...mao, ...mesa]))}` : ""}</span>
            <div className="gs-cartas">
              {mao.map((c, i) => (
                <CartaVisual key={i} c={c} />
              ))}
            </div>
          </div>
          {fase === "jogando" &&
            (pagar > 0 ? (
              <div className="gs-botoes-duplos">
                <button className="gs-btn gs-btn-principal" disabled={dinheiro < pagar} onClick={() => agir("pagar")}>
                  Pagar {formatarDinheiro(pagar)}
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
                <button className="gs-btn gs-btn-principal" disabled={dinheiro < valor} onClick={() => agir("apostar")}>
                  Apostar {formatarDinheiro(valor)}
                </button>
                <button className="gs-btn gs-btn-secundario" onClick={() => agir("desistir")}>
                  Desistir
                </button>
              </div>
            ))}
          {fase === "fim" && (
            <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={dinheiro < aposta} onClick={iniciar}>
              Nova mão — {formatarDinheiro(aposta)}
            </button>
          )}
          {texto && <div className="gs-aviso">{texto}</div>}
          <div className="gs-poker-log">
            {log.slice(-6).map((l, i) => (
              <span key={i}>{l}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Torneio diario de poker ----------

function Torneio({ save, aplicar }: { save: GangstarSave; aplicar: (fn: (s: GangstarSave) => GangstarSave) => void }) {
  const t = torneioDeHoje(save);
  const [erro, setErro] = useState<string | null>(null);
  const premios = premiosTorneio();
  const dia = t?.dia ?? new Date().toISOString().slice(0, 10);
  const placar = [...rivaisTorneio(dia), ...(t ? [{ nome: "Você", fichas: t.fichas }] : [])].sort((a, b) => b.fichas - a.fichas);

  if (!t) {
    return (
      <div className="gs-cassino-mesa">
        <p className="gs-p-intro">
          Torneio diário: inscrição de {formatarDinheiro(BUYIN_TORNEIO)}, você recebe {FICHAS_TORNEIO.toLocaleString("pt-BR")} fichas e joga {MAOS_TORNEIO} mãos contra a mesa. No fim, suas fichas
          entram no placar do dia contra outros 7 jogadores.
        </p>
        <div className="gs-slot-tabela">
          <span>🥇 {formatarDinheiro(premios[0])}</span>
          <span>🥈 {formatarDinheiro(premios[1])}</span>
          <span>🥉 {formatarDinheiro(premios[2])}</span>
        </div>
        <button
          className="gs-btn gs-btn-principal gs-btn-bloco"
          disabled={save.personagem.dinheiro < BUYIN_TORNEIO}
          onClick={() => {
            let e: string | undefined;
            aplicar((s) => {
              const r = entrarTorneio(s);
              e = r.erro;
              return r.save;
            });
            setErro(e ?? null);
          }}
        >
          Inscrever-se — {formatarDinheiro(BUYIN_TORNEIO)}
        </button>
        {erro && <div className="gs-aviso">{erro}</div>}
      </div>
    );
  }

  return (
    <>
      <div className="gs-torneio-status">
        <span>🏆 Torneio de hoje</span>
        <strong>{t.fichas.toLocaleString("pt-BR")} fichas</strong>
        <span>
          Mão {Math.min(t.maos + 1, MAOS_TORNEIO)}/{MAOS_TORNEIO} · ante {anteTorneio(t)}
        </span>
      </div>
      {t.terminado ? (
        <div className="gs-cassino-mesa">
          <div className="gs-aviso">
            {t.posicao <= 3 ? `🏆 Você terminou em ${t.posicao}º lugar e ganhou ${formatarDinheiro(t.premio)}!` : `Você terminou em ${t.posicao}º lugar. Sem prêmio hoje — volte amanhã.`}
          </div>
        </div>
      ) : (
        <Poker
          aposta={anteTorneio(t)}
          dinheiro={t.fichas}
          rotuloFichas
          mexer={(delta) => aplicar((s) => atualizarTorneio(s, delta, false))}
          onFimMao={() => aplicar((s) => atualizarTorneio(s, 0, true))}
        />
      )}
      <div className="gs-placar-torneio">
        {placar.map((p, i) => (
          <span key={`${p.nome}-${i}`} className={p.nome === "Você" ? "gs-placar-voce" : ""}>
            {i + 1}º {p.nome} — {p.fichas.toLocaleString("pt-BR")}
          </span>
        ))}
      </div>
    </>
  );
}
