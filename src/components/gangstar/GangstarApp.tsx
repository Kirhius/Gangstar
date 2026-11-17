"use client";

// Gangstar: shell principal do jogo (cabecalho + abas do rodape), montado depois
// da tela de boas-vindas/criacao de personagem.

import { useEffect, useRef, useState } from "react";
import {
  GangstarSave,
  NIVEL_EMBOSCADA,
  NIVEL_EXTORSAO,
  NIVEL_PORTO,
  atualizarComTempo,
  eventoDiario,
  eventosDaSemana,
  gangstar,
  liberacoesDoNivel,
  marcarTemporadaVista,
  nomeDoMes,
  tituloAtual,
  notificacoesMissoes,
  xpDoNivel,
} from "@/lib/gangstar";
import { MinhaCidade } from "./telas/MinhaCidade";
import { Cidade } from "./telas/Cidade";
import { Roubos } from "./telas/Roubos";
import { Gangue } from "./telas/Gangue";
import { Perfil } from "./telas/Perfil";
import { Porto } from "./telas/Porto";
import { Emboscada } from "./telas/Emboscada";
import { Extorsoes } from "./telas/Extorsoes";
import { Inventario } from "./telas/Inventario";
import { Missoes } from "./telas/Missoes";
import { useConta } from "./conta";
import { agendarSync, aplicarAtaque, assinarAtaquesRecebidos, ataquesPendentes, atualizarJogadores, type AtaqueRegistro } from "@/lib/multiplayer";
import { gravarNav, lerNav } from "./navegacao";

type Aba = "minha-cidade" | "cidade" | "roubos" | "gangue" | "perfil" | "porto" | "emboscada" | "extorsoes" | "inventario" | "missoes";

// duas linhas no rodape; "Roubos" fica destacado num circulo sobreposto
const ABAS: { id: Aba; emoji: string; rotulo: string }[] = [
  { id: "minha-cidade", emoji: "🗺️", rotulo: "Cidade" },
  { id: "cidade", emoji: "🏙️", rotulo: "Hub" },
  { id: "roubos", emoji: "🎯", rotulo: "Roubos" },
  { id: "gangue", emoji: "🏴", rotulo: "Gangue" },
  { id: "missoes", emoji: "📜", rotulo: "Missões" },
  { id: "porto", emoji: "⚓", rotulo: "Porto" },
  { id: "emboscada", emoji: "🗡️", rotulo: "Emboscada" },
  { id: "extorsoes", emoji: "💼", rotulo: "Extorsões" },
  { id: "inventario", emoji: "🎒", rotulo: "Inventário" },
  { id: "perfil", emoji: "👤", rotulo: "Perfil" },
];

export function GangstarApp({ aoSair }: { aoSair: () => void }) {
  const [save, setSave] = useState<GangstarSave | null>(null);
  const [aba, setAbaBruta] = useState<Aba>(() => lerNav<Aba>("aba", "minha-cidade"));
  const setAba = (a: Aba) => {
    gravarNav("aba", a);
    if (a !== "cidade") gravarNav("visao", null);
    setAbaBruta(a);
  };
  const [verEventos, setVerEventos] = useState(false);
  // pop-up de "subiu de nivel": guarda o nivel anterior e mostra as liberacoes novas
  const nivelAnterior = useRef<number | null>(null);
  const [subiu, setSubiu] = useState<{ de: number; para: number } | null>(null);
  const nivelAtual = save?.personagem.nivel ?? null;
  useEffect(() => {
    if (nivelAtual === null) return;
    const antes = nivelAnterior.current;
    if (antes !== null && nivelAtual > antes) setSubiu((s) => ({ de: s?.de ?? antes, para: nivelAtual }));
    nivelAnterior.current = nivelAtual;
  }, [nivelAtual]);

  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    setSave(gangstar.carregar());
  }, []);

  // relogio de 10s: energia, vida e vicio se recuperam com o jogo aberto
  useEffect(() => {
    const t = setInterval(() => {
      setSave((atual) => {
        if (!atual) return atual;
        const novo = atualizarComTempo(atual);
        gangstar.salvar(novo);
        return novo;
      });
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // relogio de 1s: contagem regressiva da prisao (e solta quando o tempo acaba)
  const presoAte = save?.personagem.preso?.ate ?? null;
  useEffect(() => {
    if (!presoAte) return;
    const t = setInterval(() => {
      const n = Date.now();
      setAgora(n);
      if (n >= presoAte) {
        setSave((atual) => {
          if (!atual) return atual;
          const novo = atualizarComTempo(atual);
          gangstar.salvar(novo);
          return novo;
        });
      }
    }, 1000);
    return () => clearInterval(t);
  }, [presoAte]);

  // ---------- multiplayer: save na nuvem, ataques recebidos em tempo real, jogadores reais ----------
  const conta = useConta();
  useEffect(() => {
    if (conta && save) agendarSync(save);
  }, [conta, save]);
  const [ataquesRecebidos, setAtaquesRecebidos] = useState<AtaqueRegistro[]>([]);
  const carregou = save !== null;
  useEffect(() => {
    if (!conta || !carregou) return;
    // aplica o lado deste jogador do ataque (o mesmo registro que o outro aparelho le)
    const aplicar = (a: AtaqueRegistro) => {
      setSave((atual) => {
        if (!atual) return atual;
        const novo = aplicarAtaque(atual, a, conta.userId);
        gangstar.salvar(novo);
        return novo;
      });
      if (a.defensor === conta.userId) setAtaquesRecebidos((l) => (l.some((x) => x.id === a.id) ? l : [...l, a]));
    };
    ataquesPendentes(conta.userId).then((lista) => lista.forEach(aplicar));
    const parar = assinarAtaquesRecebidos(conta.userId, aplicar);
    atualizarJogadores();
    const t = setInterval(atualizarJogadores, 30000);
    return () => {
      parar();
      clearInterval(t);
    };
  }, [conta, carregou]);

  if (!save) return null;
  const avisosMissoes = notificacoesMissoes(save);
  const evento = eventoDiario();
  const msRestante = presoAte ? Math.max(0, presoAte - agora) : 0;
  const contagem = `${String(Math.floor(msRestante / 60000)).padStart(2, "0")}:${String(Math.floor((msRestante % 60000) / 1000)).padStart(2, "0")}`;

  const atualizar = (novo: GangstarSave) => {
    gangstar.salvar(novo);
    setSave(novo);
  };

  return (
    <div className="gs-app">
      <header className="gs-cabecalho">
        <div className="gs-cabecalho-linha1">
          <button className="gs-nivel-quadro" onClick={() => setAba("perfil")} aria-label={`Nível ${save.personagem.nivel}`} title="Seu nível">
            <small>NÍV</small>
            <strong>{save.personagem.nivel}</strong>
          </button>
          <div className="gs-cabecalho-info">
            <strong className="gs-cabecalho-nome">{save.personagem.nome}</strong>
            <span className="gs-cabecalho-sub">
              {tituloAtual(save) && <span title={tituloAtual(save)!.titulo}>{tituloAtual(save)!.titulo.split(" ")[0]} </span>}
              {save.personagem.gangue ?? "Sem gangue"}
            </span>
          </div>
          <button className="gs-evento-dia" title={`${evento.dia}: ${evento.descricao}`} onClick={() => setVerEventos(true)}>
            <span className="gs-evento-dia-emoji">{evento.emoji}</span>
            <span className="gs-evento-dia-texto">
              <small>{evento.dia}</small>
              <strong>{evento.nome}</strong>
            </span>
          </button>
        </div>
        <div className="gs-stats-topo">
          <div className="gs-stat-chip gs-stat-chip-dinheiro" title="Dinheiro em mãos">
            💰
            <strong className={save.personagem.dinheiro < 0 ? "gs-negativo" : ""}>
              R$ {save.personagem.dinheiro.toLocaleString("pt-BR", { minimumFractionDigits: save.personagem.dinheiro < 0 ? 2 : 0 })}
            </strong>
          </div>
          <div className="gs-stat-chip gs-stat-chip-energia" title="Energia">
            ⚡<strong>
              {save.personagem.energia}/{save.personagem.energiaMax}
            </strong>
          </div>
          <div className="gs-stat-chip gs-stat-chip-vida" title="Vida">
            ❤️<strong>
              {save.personagem.vida}/{save.personagem.vidaMax}
            </strong>
          </div>
          <div className="gs-stat-chip gs-stat-chip-respeito" title="Respeito">
            ⭐<strong>{save.personagem.respeito}</strong>
          </div>
          <div className="gs-stat-chip gs-stat-chip-vicio" title="Vício">
            🌀<strong>{save.personagem.vicio}/100</strong>
          </div>
        </div>
        {save.personagem.preso && (
          <div className={`gs-preso-contagem ${save.personagem.preso.hospital ? "gs-internado" : ""}`} role="status">
            {save.personagem.preso.hospital ? "🏥 Internado por overdose · alta em " : "🚔 Preso · liberdade em "}
            <strong>{contagem}</strong>
          </div>
        )}
      </header>

      <main className="gs-conteudo-app">
        {aba === "minha-cidade" && <MinhaCidade save={save} aoAtualizar={atualizar} />}
        {aba === "cidade" && <Cidade save={save} aoAtualizar={atualizar} />}
        {aba === "roubos" && <Roubos save={save} aoAtualizar={atualizar} />}
        {aba === "gangue" && <Gangue save={save} aoAtualizar={atualizar} />}
        {aba === "perfil" && <Perfil save={save} aoAtualizar={atualizar} aoSair={aoSair} />}
        {aba === "porto" &&
          (save.personagem.nivel >= NIVEL_PORTO ? <Porto save={save} aoAtualizar={atualizar} /> : <TelaBloqueada emoji="⚓" nome="Porto" nivel={NIVEL_PORTO} atual={save.personagem.nivel} />)}
        {aba === "emboscada" &&
          (save.personagem.nivel >= NIVEL_EMBOSCADA ? (
            <Emboscada save={save} aoAtualizar={atualizar} />
          ) : (
            <TelaBloqueada emoji="🗡️" nome="Emboscada" nivel={NIVEL_EMBOSCADA} atual={save.personagem.nivel} />
          ))}
        {aba === "extorsoes" &&
          (save.personagem.nivel >= NIVEL_EXTORSAO ? (
            <Extorsoes save={save} aoAtualizar={atualizar} />
          ) : (
            <TelaBloqueada emoji="💼" nome="Extorsões" nivel={NIVEL_EXTORSAO} atual={save.personagem.nivel} />
          ))}
        {aba === "inventario" && <Inventario save={save} aoAtualizar={atualizar} />}
        {aba === "missoes" && <Missoes save={save} aoAtualizar={atualizar} />}
      </main>

      <nav className="gs-abas-rodape">
        {ABAS.map((a) => (
          <button key={a.id} className={`gs-aba-btn ${a.id === "roubos" ? "gs-aba-destaque" : ""} ${aba === a.id ? "gs-aba-ativa" : ""}`} onClick={() => setAba(a.id)}>
            <span className="gs-aba-emoji">{a.emoji}</span>
            {a.id === "missoes" && avisosMissoes > 0 && <span className="gs-aba-badge">{avisosMissoes}</span>}
            <span className="gs-aba-rotulo">{a.rotulo}</span>
          </button>
        ))}
      </nav>
      {verEventos && (
        <div className="gs-popup-fundo" onClick={() => setVerEventos(false)}>
          <div className="gs-popup-painel" onClick={(e) => e.stopPropagation()}>
            <div className="gs-popup-topo">
              <h3 className="gs-h3" style={{ margin: 0 }}>
                📅 Eventos da semana
              </h3>
              <button className="gs-popup-fechar" onClick={() => setVerEventos(false)} aria-label="Fechar">
                ✕
              </button>
            </div>
            <div className="gs-eventos-semana">
              {eventosDaSemana().map((e) => (
                <div key={e.id} className={`gs-evento-linha ${e.id === evento.id ? "gs-evento-hoje" : ""}`}>
                  <span className="gs-evento-linha-emoji">{e.emoji}</span>
                  <div>
                    <small>
                      {e.dia}
                      {e.id === evento.id && " · HOJE"}
                    </small>
                    <strong>{e.nome}</strong>
                    <span>{e.descricao}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {subiu && (
        <div className="gs-popup-fundo" onClick={() => setSubiu(null)}>
          <div className="gs-popup-painel gs-subiu-nivel" onClick={(e) => e.stopPropagation()}>
            <h3 className="gs-h3" style={{ margin: 0 }}>
              ⬆️ Você subiu de nível!
            </h3>
            <div className="gs-subiu-numero">{subiu.para}</div>
            <div className="gs-subiu-lista">
              {Array.from({ length: subiu.para - subiu.de }, (_, i) => subiu.de + 1 + i).map((n) => {
                const lib = liberacoesDoNivel(n);
                return (
                  <div key={n}>
                    {subiu.para - subiu.de > 1 && <small>NÍVEL {n}</small>}
                    {lib.length ? lib.map((t) => <p key={t}>{t}</p>) : <p>Nenhuma liberação nova neste nível — continue crescendo.</p>}
                  </div>
                );
              })}
            </div>
            <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => setSubiu(null)}>
              Bora!
            </button>
          </div>
        </div>
      )}
      {save.ultimaTemporada && !save.ultimaTemporada.visto && (
        <div className="gs-popup-fundo">
          <div className="gs-popup-painel gs-fim-temporada">
            <small className="gs-fim-temporada-rotulo">FIM DA TEMPORADA</small>
            <h3 className="gs-h3" style={{ margin: 0 }}>
              {nomeDoMes(save.ultimaTemporada.mes)}
            </h3>
            <div className="gs-fim-temporada-posicao">{save.ultimaTemporada.posicao}º</div>
            {save.ultimaTemporada.titulo ? (
              <p>
                Você terminou no top 3 com {save.ultimaTemporada.respeito.toLocaleString("pt-BR")} de respeito e ganhou o título permanente <strong>{save.ultimaTemporada.titulo}</strong>.
              </p>
            ) : (
              <p>
                Você terminou com {save.ultimaTemporada.respeito.toLocaleString("pt-BR")} de respeito. Só o top 3 leva título e troféu — essa temporada é sua chance.
              </p>
            )}
            <p className="gs-dica">Um novo mês começou: seu império voltou do zero. Seu nome, sua gangue e seus troféus ficam para sempre.</p>
            <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => atualizar(marcarTemporadaVista(save))}>
              Começar a nova temporada
            </button>
          </div>
        </div>
      )}
      {ataquesRecebidos.length > 0 && !subiu && (() => {
        const a = ataquesRecebidos[0];
        const perdeu = a.venceu;
        const quem = `${a.atacante_nome ?? "Alguém"}${a.atacante_gangue ? ` (${a.atacante_gangue})` : ""}`;
        return (
          <div className="gs-popup-fundo">
            <div className={`gs-popup-painel gs-ataque-recebido ${perdeu ? "gs-ataque-perdeu" : "gs-ataque-defendeu"}`}>
              <small className="gs-fim-temporada-rotulo">{perdeu ? "VOCÊ FOI EMBOSCADO" : "ATAQUE REPELIDO"}</small>
              <div className="gs-ataque-emoji">{perdeu ? "💥" : "🛡️"}</div>
              <p>
                <strong>{quem}</strong> atacou você {perdeu ? "e venceu." : "e saiu no prejuízo."}
              </p>
              <div className="gs-ataque-efeitos">
                {a.efeito_defensor.dinheiro !== 0 && <span>💰 {a.efeito_defensor.dinheiro < 0 ? "−" : "+"}R$ {Math.abs(a.efeito_defensor.dinheiro).toLocaleString("pt-BR")}</span>}
                {a.efeito_defensor.respeito !== 0 && (
                  <span>
                    ⭐ {a.efeito_defensor.respeito > 0 ? "+" : ""}
                    {a.efeito_defensor.respeito} respeito
                  </span>
                )}
                {a.efeito_defensor.vida !== 0 && <span>❤️ {a.efeito_defensor.vida} vida</span>}
                {a.efeito_defensor.xp > 0 && <span>✨ +{a.efeito_defensor.xp} XP</span>}
              </div>
              {perdeu && <p className="gs-dica">Você ficou 1 hora protegido contra novos ataques. Guarde dinheiro no banco: só o dinheiro em mãos pode ser levado.</p>}
              <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => setAtaquesRecebidos((l) => l.slice(1))}>
                {perdeu ? "Vou me vingar" : "Boa!"}
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function TelaBloqueada({ emoji, nome, nivel, atual }: { emoji: string; nome: string; nivel: number; atual: number }) {
  return (
    <div className="gs-pagina">
      <div className="gs-tela-bloqueada">
        <span>🔒</span>
        <strong>
          {emoji} {nome}
          <br />
          libera no nível {nivel}
        </strong>
        <p>
          Você está no nível {atual}. O nível {nivel} pede {xpDoNivel(nivel).toLocaleString("pt-BR")} de XP no total — faça roubos, treine e complete missões.
        </p>
      </div>
    </div>
  );
}
