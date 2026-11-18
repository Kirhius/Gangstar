"use client";

// Gangstar: aba "Cidade" - hub com mercado negro, delegacia (fianca/motim), hospital
// (cura e desintoxicacao), banco (CDI), escola e academia (cursos em niveis), boates
// (recuperar energia) e extorsoes (estabelecimentos dominados que pagam com risco).

import { useEffect, useState } from "react";
import {
  ARMAS,
  GangstarSave,
  comprarArma,
  curarNoHospital,
  custoCura,
  custoFiancaAtual,
  depositarBanco,
  desintoxicar,
  custoDesintoxicacao,
  fazerMotim,
  podeFazerMotim,
  OPCOES_TREINO,
  treinar,
  xpDoTreino,
  type LocalTreino,
  mercadorAtual,
  proximaVisitaMercador,
  equiparArma,
  eventoAtualView,
  pagarFianca,
  precoArmaFinal,
  sacarBanco,
  treinosRestantesHoje,
  saldoAceitandoSujo,
} from "@/lib/gangstar";
import { CUSTO_ADVOGADO, DIAS_ADVOGADO, NIVEL_BOLSA, NIVEL_MERCADOR, advogadoAtivo, contratarAdvogado, consertarItemRaro, custoConserto, durabilidadeItem, durabilidadeMax, qtdItem } from "@/lib/gangstar";
import { ITENS_RAROS, RARIDADES } from "@/lib/gangstarItens";
import { MapaHub } from "../mapa/MapaHub";
import { MercadorPainel } from "../MercadorPainel";
import { Cassino } from "./Cassino";
import { BoateMenu } from "../BoateMenu";
import { Bolsa } from "./Bolsa";
import { Lavanderia } from "./Lavanderia";
import { gravarNav, lerNav } from "../navegacao";
import { TituloComAjuda } from "../TituloComAjuda";
import { IlustracaoAcademia, IlustracaoEscola } from "../IlustracaoServico";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

function tempoRestante(ate: number): string {
  const ms = Math.max(0, ate - Date.now());
  const min = Math.floor(ms / 60000);
  const seg = Math.floor((ms % 60000) / 1000);
  return `${min}m ${seg}s`;
}

type Visao = "hub" | "mercado" | "hospital" | "banco" | "escola" | "academia" | "boates" | "policia" | "cassino" | "bolsa" | "lavanderia";

type ResultadoPopup = { sucesso: boolean; titulo: string; linhas: string[] };

export function Cidade({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const [visao, setVisaoBruta] = useState<Visao>(() => lerNav<Visao>("visao", "hub"));
  const setVisao = (v: Visao) => {
    gravarNav("visao", v === "hub" ? null : v);
    setVisaoBruta(v);
  };
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [valorBanco, setValorBanco] = useState("");
  const [resultado, setResultado] = useState<ResultadoPopup | null>(null);
  const [mercadorAberto, setMercadorAberto] = useState(false);
  const [, setTique] = useState(0);
  // atualiza a cada 30s para o botao do Mercador aparecer/sumir na hora certa
  useEffect(() => {
    const t = setInterval(() => setTique((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const p = save.personagem;
  const restantes = treinosRestantesHoje(save);

  const rodar = (resultado: { save: GangstarSave; erro?: string }, mensagemSucesso?: string) => {
    if (resultado.erro) {
      setMensagem(`⚠️ ${resultado.erro}`);
      return;
    }
    setMensagem(mensagemSucesso ?? null);
    aoAtualizar(resultado.save);
  };

  const comprar = (armaId: string) => rodar(comprarArma(save, armaId));
  const equipar = (armaId: string) => aoAtualizar(equiparArma(save, armaId));
  const pagar = () => rodar(pagarFianca(save));
  const curar = () => rodar(curarNoHospital(save));
  const fazerTreino = (opcaoId: string) => {
    const opcao = OPCOES_TREINO.find((o) => o.id === opcaoId);
    const r = treinar(save, opcaoId);
    rodar(r, opcao ? `${opcao.emoji} +${opcao.ganho} de ${opcao.local === "escola" ? "intelecto" : "força"} · +${r.xp ?? 0} XP` : undefined);
  };
  const motim = () => {
    const r = fazerMotim(save);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(null);
    setResultado(
      r.fugiu
        ? { sucesso: true, titulo: "🏃 Motim deu certo!", linhas: ["Você escapou da prisão no meio da confusão."] }
        : { sucesso: false, titulo: "🚨 O motim falhou", linhas: ["Os guardas controlaram a rebelião.", "+5 minutos na sua pena.", "Sem novo motim até sair dessa prisão."] },
    );
  };
  const desintox = (pontos: number) => rodar(desintoxicar(save, pontos), "💉 Tratamento feito, o vício baixou.");
  const depositar = () => {
    const v = Math.round(Number(valorBanco));
    if (!v) return;
    rodar(depositarBanco(save, v));
    setValorBanco("");
  };
  const sacar = () => {
    const v = Math.round(Number(valorBanco));
    if (!v) return;
    rodar(sacarBanco(save, v));
    setValorBanco("");
  };

  if (visao === "cassino") {
    return <Cassino save={save} aoAtualizar={aoAtualizar} aoVoltar={() => setVisao("boates")} />;
  }

  if (visao !== "hub") {
    const titulos: Record<Exclude<Visao, "hub">, string> = {
      mercado: "🔫 Mercado Negro",
      hospital: "🏥 Hospital",
      banco: "🏦 Banco",
      escola: "🎓 Escola",
      academia: "🏋️ Academia",
      boates: "🪩 Boates",
      policia: "🚔 Delegacia",
      cassino: "🎰 Cassino",
      bolsa: "📈 Bolsa de Valores",
      lavanderia: "🧺 Lavanderia",
    };
    const blocoTreino = (local: LocalTreino) => {
      const restam = restantes[local];
      return (
        <>
          <p className="gs-p-intro">
            {restam}/5 {local === "escola" ? "estudos" : "treinos"} disponíveis hoje · ⚡ {p.energia} de energia
          </p>
          {OPCOES_TREINO.filter((o) => o.local === local).map((o) => {
            const bloqueado = p.nivel < o.nivelMin;
            return (
              <div key={o.id} className={`gs-card ${bloqueado ? "gs-card-bloqueado" : ""}`}>
                <span className="gs-card-emoji">{bloqueado ? "🔒" : o.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{o.nome}</strong>
                  <span className="gs-card-sub">
                    {bloqueado
                      ? `Nível ${o.nivelMin} necessário`
                      : `+${o.ganho} de ${local === "escola" ? "intelecto" : "força"} · ⚡${o.energia} · ✨${xpDoTreino(o)} XP`}
                  </span>
                </div>
                {!bloqueado && (
                  <button className="gs-btn-mini" disabled={restam <= 0 || p.energia < o.energia || p.dinheiro < o.custo} onClick={() => fazerTreino(o.id)}>
                    {restam <= 0 ? "Amanhã" : formatarDinheiro(o.custo)}
                  </button>
                )}
              </div>
            );
          })}
        </>
      );
    };
    return (
      <div className="gs-pagina">
        <button className="gs-link-voltar" onClick={() => setVisao("hub")}>
          ← Voltar à Cidade
        </button>
        <h2 className="gs-h2">{titulos[visao]}</h2>
        {mensagem && <div className="gs-aviso">{mensagem}</div>}

        {visao === "mercado" && (
          <>
            <p className="gs-p-intro">Compre armas para aumentar seu poder nos roubos. Os preços oscilam com o mercado e seu território.</p>
            <div className="gs-lista">
              {ARMAS.map((a) => {
                const possui = p.armas.includes(a.id);
                const equipada = p.armaEquipada === a.id;
                const preco = precoArmaFinal(save, a);
                return (
                  <div key={a.id} className={`gs-card ${equipada ? "gs-card-ativo" : ""}`}>
                    <span className="gs-card-emoji">{a.emoji}</span>
                    <div className="gs-card-corpo">
                      <strong>{a.nome}</strong>
                      <span className="gs-card-sub">Poder {a.poder}</span>
                    </div>
                    {possui ? (
                      equipada ? (
                        <span className="gs-tag">Equipada</span>
                      ) : (
                        <button className="gs-btn-mini" onClick={() => equipar(a.id)}>
                          Equipar
                        </button>
                      )
                    ) : (
                      <button className="gs-btn-mini" onClick={() => comprar(a.id)}>
                        {formatarDinheiro(preco)}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <h3 className="gs-h3">🔧 Oficina de itens raros</h3>
            {ITENS_RAROS.filter((i) => qtdItem(save, i.id) > 0).length === 0 ? (
              <p className="gs-dica">Você não tem itens raros. Eles caem nos roubos em equipe e se desgastam a cada ação; quebrados param de dar bônus.</p>
            ) : (
              <div className="gs-lista">
                {ITENS_RAROS.filter((i) => qtdItem(save, i.id) > 0).map((i) => {
                  const d = durabilidadeItem(save, i.id);
                  const custo = custoConserto(save, i.id);
                  return (
                    <div key={i.id} className="gs-card gs-card-raro" style={{ borderColor: RARIDADES[i.raridade ?? "comum"].cor }}>
                      <span className="gs-card-emoji">{i.emoji}</span>
                      <div className="gs-card-corpo">
                        <strong>{i.nome}</strong>
                        <span className={`gs-card-sub ${d <= 0 ? "gs-risco" : ""}`}>
                          🔧 {d}/{durabilidadeMax(i)} usos{d <= 0 ? " · QUEBRADO" : ""}
                        </span>
                      </div>
                      <button className="gs-btn-mini" disabled={custo <= 0 || saldoAceitandoSujo(p) < custo} onClick={() => rodar(consertarItemRaro(save, i.id), `🔧 ${i.nome} consertado!`)}>
                        {custo <= 0 ? "Inteiro" : `Consertar ${formatarDinheiro(custo)}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {visao === "hospital" && (
          <div className="gs-lista">
            <div className="gs-card">
              <span className="gs-card-emoji">❤️</span>
              <div className="gs-card-corpo">
                <strong>
                  Vida: {p.vida}/{p.vidaMax}
                </strong>
                <span className="gs-card-sub">Recupere sua vida ao máximo pagando o tratamento.</span>
              </div>
            </div>
            <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={custoCura(p) === 0 || p.dinheiro < custoCura(p)} onClick={curar}>
              {custoCura(p) === 0 ? "Vida já está cheia" : `Curar — ${formatarDinheiro(custoCura(p))}`}
            </button>
            <div className="gs-card">
              <span className="gs-card-emoji">💉</span>
              <div className="gs-card-corpo">
                <strong>Desintoxicação · Vício {p.vicio}/100</strong>
                <span className="gs-card-sub">Tratamento pago para baixar o nível de vício.</span>
              </div>
            </div>
            <div className="gs-botoes-duplos">
              <button className="gs-btn gs-btn-secundario" disabled={p.vicio <= 0 || p.dinheiro < custoDesintoxicacao(save, 20)} onClick={() => desintox(20)}>
                −{Math.min(20, p.vicio)} — {formatarDinheiro(custoDesintoxicacao(save, 20))}
              </button>
              <button className="gs-btn gs-btn-secundario" disabled={p.vicio <= 0 || p.dinheiro < custoDesintoxicacao(save, 100)} onClick={() => desintox(100)}>
                Completa — {formatarDinheiro(custoDesintoxicacao(save, 100))}
              </button>
            </div>
          </div>
        )}

        {visao === "banco" && (
          <div className="gs-lista">
            <div className="gs-card">
              <span className="gs-card-emoji">💰</span>
              <div className="gs-card-corpo">
                <strong>{formatarDinheiro(p.banco.saldo)}</strong>
                <span className="gs-card-sub">Guardado no banco (rende CDI com o tempo)</span>
              </div>
            </div>
            <div className="gs-linha-campo">
              <input
                className="gs-input"
                inputMode="numeric"
                value={valorBanco}
                onChange={(e) => setValorBanco(e.target.value.replace(/\D/g, ""))}
                placeholder="Valor em R$"
              />
            </div>
            <div className="gs-botoes-duplos">
              <button className="gs-btn gs-btn-secundario" onClick={depositar}>
                Depositar
              </button>
              <button className="gs-btn gs-btn-secundario" onClick={sacar}>
                Sacar
              </button>
            </div>
          </div>
        )}

        {visao === "escola" && (
          <div className="gs-lista">
            <IlustracaoEscola />
            <div className="gs-card">
              <span className="gs-card-emoji">🧠</span>
              <div className="gs-card-corpo">
                <strong>Intelecto: {p.atributos.inteligencia}</strong>
                <span className="gs-card-sub">Escolha um curso. Os mais avançados liberam com o seu nível.</span>
              </div>
            </div>
            {blocoTreino("escola")}
          </div>
        )}

        {visao === "academia" && (
          <div className="gs-lista">
            <IlustracaoAcademia />
            <div className="gs-card">
              <span className="gs-card-emoji">💪</span>
              <div className="gs-card-corpo">
                <strong>Força: {p.atributos.forca}</strong>
                <span className="gs-card-sub">Escolha um treino. Os mais pesados liberam com o seu nível.</span>
              </div>
            </div>
            {blocoTreino("academia")}
          </div>
        )}

        {visao === "policia" && (
          <div className="gs-lista">
            <div className="gs-card gs-card-advogado">
              <span className="gs-card-emoji">⚖️</span>
              <div className="gs-card-corpo">
                <strong>Advogado</strong>
                <span className="gs-card-sub">
                  {advogadoAtivo(save)
                    ? `Contratado até ${new Date(save.advogadoAte!).toLocaleDateString("pt-BR")}: −30% de alerta da Federal e fiança pela metade.`
                    : `${formatarDinheiro(CUSTO_ADVOGADO)} (só dinheiro limpo) por ${DIAS_ADVOGADO} dias: −30% de alerta da Federal ao lavar e fiança pela metade.`}
                </span>
              </div>
              <button className="gs-btn-mini" disabled={p.dinheiro < CUSTO_ADVOGADO} onClick={() => rodar(contratarAdvogado(save), "⚖️ Advogado contratado.")}>
                {advogadoAtivo(save) ? "Renovar" : "Contratar"}
              </button>
            </div>
            {p.preso?.hospital ? (
              <div className="gs-card gs-card-prisao">
                <span className="gs-card-emoji">🏥</span>
                <div className="gs-card-corpo">
                  <strong>Você está internado</strong>
                  <span className="gs-card-sub">Alta em {tempoRestante(p.preso.ate)}</span>
                </div>
              </div>
            ) : p.preso ? (
              <>
                <div className="gs-card gs-card-prisao">
                  <span className="gs-card-emoji">🚔</span>
                  <div className="gs-card-corpo">
                    <strong>Você está preso!</strong>
                    <span className="gs-card-sub">Liberdade em {tempoRestante(p.preso.ate)}</span>
                  </div>
                </div>
                <button className="gs-btn gs-btn-principal gs-btn-bloco" disabled={saldoAceitandoSujo(p) < custoFiancaAtual(save)} onClick={pagar}>
                  Pagar fiança — {formatarDinheiro(custoFiancaAtual(save))}
                </button>
                <button className="gs-btn gs-btn-perigo gs-btn-bloco" disabled={!podeFazerMotim(save)} onClick={motim}>
                  {podeFazerMotim(save) ? "🔥 Motim (12% de fugir)" : "Motim já falhou"}
                </button>
                <p className="gs-dica">Se o motim falhar, sua pena aumenta 5 minutos e você não pode tentar de novo nesta prisão.</p>
              </>
            ) : (
              <div className="gs-card gs-card-ok">
                <span className="gs-card-emoji">🕊️</span>
                <div className="gs-card-corpo">
                  <strong>Você está livre</strong>
                  <span className="gs-card-sub">Sem pendências com a polícia. Já foi preso {p.vezesPreso} {p.vezesPreso === 1 ? "vez" : "vezes"}.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {visao === "bolsa" && <Bolsa save={save} aoAtualizar={aoAtualizar} />}
        {visao === "lavanderia" && <Lavanderia save={save} aoAtualizar={aoAtualizar} />}

        {visao === "boates" && (
          <div className="gs-lista">
            <p className="gs-p-intro">Escolha a seção. Aqui tudo sai bem mais caro que no mercado — mas é na hora.</p>
            <BoateMenu save={save} aoAtualizar={aoAtualizar} />
            <button className="gs-btn gs-btn-cassino gs-btn-bloco" onClick={() => setVisao("cassino")}>
              🎰 Cassino
            </button>
          </div>
        )}

        {resultado && (
          <div className="gs-popup-fundo" onClick={() => setResultado(null)}>
            <div className={`gs-popup-painel gs-popup-resultado ${resultado.sucesso ? "gs-popup-resultado-ok" : "gs-popup-resultado-falha"}`} onClick={(e) => e.stopPropagation()}>
              <div className="gs-popup-topo">
                <h3 className="gs-h3" style={{ margin: 0 }}>
                  {resultado.titulo}
                </h3>
                <button className="gs-popup-fechar" onClick={() => setResultado(null)} aria-label="Fechar">
                  ✕
                </button>
              </div>
              <div className="gs-resultado-linhas">
                {resultado.linhas.map((linha, i) => (
                  <p key={i} className="gs-resultado-linha">
                    {linha}
                  </p>
                ))}
              </div>
              <button className="gs-btn gs-btn-principal gs-btn-bloco" onClick={() => setResultado(null)}>
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="gs-pagina">
      <TituloComAjuda titulo="🏙️ Cidade" ajuda="Toque num prédio do mapa para entrar." />
      <MapaHub
        onLocal={(local) => {
          setMensagem(null);
          setVisao(local);
        }}
        extra={
          mercadorAtual() && p.nivel >= NIVEL_MERCADOR ? (
            <button className="gs-mercador-botao" onClick={() => setMercadorAberto(true)}>
              <span>🧳</span> Mercador
            </button>
          ) : null
        }
      />
      {!mercadorAtual() && (
        <p className="gs-dica gs-mercador-dica">
          🧳 O Mercador volta às {new Date(proximaVisitaMercador()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
        </p>
      )}
      {mercadorAberto && <MercadorPainel save={save} aoAtualizar={aoAtualizar} aoFechar={() => setMercadorAberto(false)} />}

      {eventoAtualView(save) && (
        <div className="gs-aviso gs-aviso-evento">
          {eventoAtualView(save)!.def.emoji} <strong>{eventoAtualView(save)!.def.nome}</strong> — {eventoAtualView(save)!.def.descricao}
        </div>
      )}

      {p.preso?.hospital && (
        <div className="gs-card gs-card-prisao">
          <span className="gs-card-emoji">🏥</span>
          <div className="gs-card-corpo">
            <strong>Internado por overdose</strong>
            <span className="gs-card-sub">Alta em {tempoRestante(p.preso.ate)}</span>
          </div>
        </div>
      )}
      {p.preso && !p.preso.hospital && (
        <div className="gs-card gs-card-prisao">
          <span className="gs-card-emoji">🚔</span>
          <div className="gs-card-corpo">
            <strong>Você está preso!</strong>
            <span className="gs-card-sub">Liberdade em {tempoRestante(p.preso.ate)}</span>
          </div>
          <button className="gs-btn-mini" onClick={pagar}>
            Fiança {formatarDinheiro(custoFiancaAtual(save))}
          </button>
        </div>
      )}
      {!p.preso && (
        <div className="gs-card gs-card-ok">
          <span className="gs-card-emoji">🕊️</span>
          <div className="gs-card-corpo">
            <strong>Você está livre</strong>
            <span className="gs-card-sub">Sem pendências com a polícia</span>
          </div>
        </div>
      )}

      <div className="gs-lista">
        {[
          { id: "mercado" as const, emoji: "🔫", nome: "Mercado Negro", sub: "Armas e conserto de itens raros" },
          { id: "hospital" as const, emoji: "🏥", nome: "Hospital", sub: "Cure sua vida" },
          { id: "boates" as const, emoji: "🪩", nome: "Boates", sub: "Recupere energia" },
          { id: "banco" as const, emoji: "🏦", nome: "Banco", sub: "Guarde dinheiro no CDI" },
          { id: "escola" as const, emoji: "🎓", nome: "Escola", sub: `Treine intelecto (${restantes.escola}/5 hoje)` },
          { id: "academia" as const, emoji: "🏋️", nome: "Academia", sub: `Treine força (${restantes.academia}/5 hoje)` },
          { id: "policia" as const, emoji: "🚔", nome: "Delegacia", sub: "Fiança e motim" },
          { id: "lavanderia" as const, emoji: "🧺", nome: "Lavanderia", sub: "Lave dinheiro sujo na hora (40%)" },
          { id: "bolsa" as const, emoji: "📈", nome: "Bolsa de Valores", sub: p.nivel >= NIVEL_BOLSA ? "Compre e venda ações" : `Libera no nível ${NIVEL_BOLSA}` },
        ].map((loc) => (
          <button key={loc.id} className="gs-card gs-card-clicavel" onClick={() => setVisao(loc.id)}>
            <span className="gs-card-emoji">{loc.emoji}</span>
            <div className="gs-card-corpo">
              <strong>{loc.nome}</strong>
              <span className="gs-card-sub">{loc.sub}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
