"use client";

// Gangstar: aba "Perfil" - atributos, vida, energia, vicio e saldo bancario do personagem.
// Atributos sobem automaticamente ao subir de nivel (ou treinando na Escola/Academia, na Cidade).
// v4.58: 3 slots de equipamento - arma, colete e especial (itens raros, v4.60).

import { useState } from "react";
import { useConta } from "../conta";
import { sairDaConta } from "@/lib/multiplayer";
import { ARMAS, CLASSES, GangstarSave, armaEquipada, coleteEquipado, desequipar, equiparArma, equiparItem, poderDeRoubo, proximoNivelInfo, qtdItem, especialEquipado, durabilidadeItem, durabilidadeMax } from "@/lib/gangstar";
import { ITENS, ITENS_RAROS, RARIDADES } from "@/lib/gangstarItens";

function Barra({ valor, max, cor }: { valor: number; max: number; cor: string }) {
  const pct = Math.max(0, Math.min(100, (valor / max) * 100));
  return (
    <div className="gs-barra-fundo">
      <div className="gs-barra-preenchida" style={{ width: `${pct}%`, background: cor }} />
    </div>
  );
}

type Slot = "arma" | "colete" | "especial";

export function Perfil({ save, aoAtualizar, aoSair }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void; aoSair?: () => void }) {
  const p = save.personagem;
  const [escolhendo, setEscolhendo] = useState<Slot | null>(null);
  const conta = useConta();
  const arma = armaEquipada(save);
  const colete = coleteEquipado(save);
  const especial = especialEquipado(save);
  const opcoesEspecial = ITENS_RAROS.filter((i) => qtdItem(save, i.id) > 0);
  const opcoesArma = [
    ...ARMAS.filter((a) => p.armas.includes(a.id)).map((a) => ({ id: a.id, nome: a.nome, emoji: a.emoji, poder: a.poder, origem: "mercado" as const })),
    ...ITENS.filter((i) => i.categoria === "arma" && qtdItem(save, i.id) > 0).map((i) => ({ id: i.id, nome: i.nome, emoji: i.emoji, poder: i.poder ?? 0, origem: "fabrica" as const })),
  ].sort((a, b) => b.poder - a.poder);
  const opcoesColete = ITENS.filter((i) => i.categoria === "colete" && qtdItem(save, i.id) > 0).sort((a, b) => (b.poder ?? 0) - (a.poder ?? 0));
  const equipar = (slot: Slot, id: string, origem?: "mercado" | "fabrica") => {
    if (slot === "arma" && origem === "mercado") aoAtualizar(equiparArma(save, id));
    else {
      const r = equiparItem(save, id);
      if (!r.erro) aoAtualizar(r.save);
    }
    setEscolhendo(null);
  };
  const classe = CLASSES[p.classe];
  const { atual, proximo, faltam } = proximoNivelInfo(p);

  return (
    <div className="gs-pagina">
      <h2 className="gs-h2">
        {classe.emoji} {p.nome}
      </h2>
      <p className="gs-p-intro">
        {classe.nome} · Nível {p.nivel}
        {proximo !== null && <> · faltam {faltam} xp</>}
      </p>

      <div className="gs-stat">
        <span>⭐ XP</span>
        <Barra valor={proximo === null ? 1 : Math.max(0, p.xp - atual)} max={proximo === null ? 1 : proximo - atual} cor="#8a6cff" />
        <span>{proximo === null ? "MÁX" : `${Math.max(0, p.xp - atual)}/${proximo - atual}`}</span>
      </div>
      <div className="gs-stat">
        <span>❤️ Vida</span>
        <Barra valor={p.vida} max={p.vidaMax} cor="#ff4d6d" />
        <span>
          {p.vida}/{p.vidaMax}
        </span>
      </div>
      <div className="gs-stat">
        <span>⚡ Energia</span>
        <Barra valor={p.energia} max={p.energiaMax} cor="#ffb020" />
        <span>
          {p.energia}/{p.energiaMax}
        </span>
      </div>
      <div className="gs-stat">
        <span>💉 Vício</span>
        <Barra valor={p.vicio} max={100} cor="#a259ff" />
        <span>{p.vicio}/100</span>
      </div>

      <h3 className="gs-h3">Equipamento · poder {poderDeRoubo(save)}</h3>
      <div className="gs-slots-equip">
        <button className={`gs-slot-equip ${arma ? "gs-slot-cheio" : ""}`} onClick={() => setEscolhendo(escolhendo === "arma" ? null : "arma")}>
          <span className="gs-slot-emoji">{arma?.emoji ?? "🔫"}</span>
          <strong>{arma?.nome ?? "Arma"}</strong>
          <small>{arma ? `+${arma.poder} poder` : "vazio"}</small>
        </button>
        <button className={`gs-slot-equip ${colete ? "gs-slot-cheio" : ""}`} onClick={() => setEscolhendo(escolhendo === "colete" ? null : "colete")}>
          <span className="gs-slot-emoji">{colete?.emoji ?? "🦺"}</span>
          <strong>{colete?.nome ?? "Colete"}</strong>
          <small>{colete ? `+${Math.round((colete.poder ?? 0) * 0.6)} poder · menos dano` : "vazio"}</small>
        </button>
        <button
          className={`gs-slot-equip ${especial ? "gs-slot-cheio gs-slot-especial-cheio" : "gs-slot-especial-vazio"}`}
          style={
            especial?.raridade
              ? {
                  borderColor: RARIDADES[especial.raridade].cor,
                  background: `linear-gradient(160deg, ${RARIDADES[especial.raridade].cor}33, #150a24 75%)`,
                  boxShadow: `0 0 12px ${RARIDADES[especial.raridade].cor}88, inset 0 0 12px ${RARIDADES[especial.raridade].cor}33`,
                }
              : undefined
          }
          onClick={() => setEscolhendo(escolhendo === "especial" ? null : "especial")}
        >
          <span className="gs-slot-emoji">{especial?.emoji ?? "💎"}</span>
          <strong>{especial?.nome ?? "Especial"}</strong>
          <small>{especial ? especial.descricao : "vazio"}</small>
          {especial && (
            <small className={durabilidadeItem(save, especial.id) <= 0 ? "gs-risco" : ""}>
              🔧 {durabilidadeItem(save, especial.id) <= 0 ? "QUEBRADO" : `${durabilidadeItem(save, especial.id)}/${durabilidadeMax(especial)}`}
            </small>
          )}
        </button>
      </div>
      {escolhendo && (
        <div className="gs-lista gs-escolha-equip">
          {(escolhendo === "arma" ? arma : escolhendo === "colete" ? colete : especial) && (
            <button className="gs-btn gs-btn-secundario gs-btn-bloco" onClick={() => { aoAtualizar(desequipar(save, escolhendo)); setEscolhendo(null); }}>
              Desequipar
            </button>
          )}
          {escolhendo === "especial" && opcoesEspecial.length === 0 && (
            <p className="gs-dica">Nenhum item raro. Eles só caem nos roubos em equipe (15% de chance a cada sucesso). Gastam 1 de durabilidade por ação e quebrados não dão bônus: conserte no Comércio de armas.</p>
          )}
          {escolhendo === "especial" &&
            opcoesEspecial.map((o) => (
              <button
                key={o.id}
                className={`gs-card gs-card-clicavel gs-card-raro ${save.equipamento.especial === o.id ? "gs-card-ativo" : ""}`}
                style={{ borderColor: RARIDADES[o.raridade ?? "comum"].cor }}
                onClick={() => equipar("especial", o.id)}
              >
                <span className="gs-card-emoji">{o.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{o.nome}</strong>
                  <span className="gs-card-sub" style={{ color: RARIDADES[o.raridade ?? "comum"].cor }}>
                    {RARIDADES[o.raridade ?? "comum"].nome} · {o.descricao} · 🔧 {durabilidadeItem(save, o.id)}/{durabilidadeMax(o)}
                  </span>
                </div>
              </button>
            ))}
          {escolhendo !== "especial" && (escolhendo === "arma" ? opcoesArma : opcoesColete).length === 0 && (
            <p className="gs-dica">
              Nenhum{escolhendo === "arma" ? "a arma" : " colete"} disponível. {escolhendo === "arma" ? "Compre no Comércio de armas ou fabrique na Fábrica de Armas." : "Fabrique na Fábrica de Armas (nível 2+)."}
            </p>
          )}
          {escolhendo === "arma" &&
            opcoesArma.map((o) => (
              <button key={o.id} className={`gs-card gs-card-clicavel ${p.armaEquipada === o.id ? "gs-card-ativo" : ""}`} onClick={() => equipar("arma", o.id, o.origem)}>
                <span className="gs-card-emoji">{o.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{o.nome}</strong>
                  <span className="gs-card-sub">+{o.poder} poder · {o.origem === "mercado" ? "Comércio de armas" : "Fábrica"}</span>
                </div>
              </button>
            ))}
          {escolhendo === "colete" &&
            opcoesColete.map((o) => (
              <button key={o.id} className={`gs-card gs-card-clicavel ${save.equipamento.colete === o.id ? "gs-card-ativo" : ""}`} onClick={() => equipar("colete", o.id)}>
                <span className="gs-card-emoji">{o.emoji}</span>
                <div className="gs-card-corpo">
                  <strong>{o.nome}</strong>
                  <span className="gs-card-sub">+{Math.round((o.poder ?? 0) * 0.6)} poder · protege nas emboscadas</span>
                </div>
              </button>
            ))}
        </div>
      )}

      <div className="gs-grid-atributos">
        <div className="gs-atributo">
          <span className="gs-card-emoji">💪</span>
          <strong>{p.atributos.forca}</strong>
          <span className="gs-card-sub">Força</span>
        </div>
        <div className="gs-atributo">
          <span className="gs-card-emoji">🧠</span>
          <strong>{p.atributos.inteligencia}</strong>
          <span className="gs-card-sub">Intelecto</span>
        </div>
        <div className="gs-atributo">
          <span className="gs-card-emoji">🛡️</span>
          <strong>{p.atributos.resistencia}</strong>
          <span className="gs-card-sub">Resistência</span>
        </div>
        <div className="gs-atributo">
          <span className="gs-card-emoji">🗣️</span>
          <strong>{p.atributos.carisma}</strong>
          <span className="gs-card-sub">Carisma</span>
        </div>
      </div>

      <div className="gs-lista">
        <div className="gs-card">
          <span className="gs-card-emoji">💵</span>
          <div className="gs-card-corpo">
            <strong>R$ {p.dinheiro.toLocaleString("pt-BR")}</strong>
            <span className="gs-card-sub">Dinheiro limpo</span>
          </div>
        </div>
        <div className="gs-card">
          <span className="gs-card-emoji">🩸</span>
          <div className="gs-card-corpo">
            <strong>R$ {(p.dinheiroSujo ?? 0).toLocaleString("pt-BR")}</strong>
            <span className="gs-card-sub">Dinheiro sujo (lave nas fachadas)</span>
          </div>
        </div>
        <div className="gs-card">
          <span className="gs-card-emoji">⭐</span>
          <div className="gs-card-corpo">
            <strong>{p.respeito}</strong>
            <span className="gs-card-sub">Respeito</span>
          </div>
        </div>
        <div className="gs-card">
          <span className="gs-card-emoji">🏦</span>
          <div className="gs-card-corpo">
            <strong>R$ {p.banco.saldo.toLocaleString("pt-BR")}</strong>
            <span className="gs-card-sub">Guardado no banco</span>
          </div>
        </div>
      </div>

      <p className="gs-dica">💡 {classe.descricao}</p>
      <h3 className="gs-h3">🏆 Sala de troféus</h3>
      {(save.trofeus ?? []).length === 0 ? (
        <p className="gs-dica">Nenhum troféu ainda. Termine uma temporada mensal no top 3 do ranking de gangues para ganhar um título permanente.</p>
      ) : (
        <div className="gs-trofeus">
          {[...(save.trofeus ?? [])].reverse().map((t) => (
            <div key={t.mes} className={`gs-trofeu gs-trofeu-${t.posicao}`}>
              <span>{t.titulo.split(" ")[0]}</span>
              <strong>{t.titulo.split(" ").slice(1).join(" ")}</strong>
              <small>
                {t.posicao}º lugar · {t.respeito.toLocaleString("pt-BR")} de respeito
              </small>
            </div>
          ))}
        </div>
      )}


      {aoSair && (
        <button className="gs-btn gs-btn-bloco gs-btn-sair" onClick={aoSair}>
          ← Voltar à tela inicial
        </button>
      )}
      {conta && (
        <div className="gs-conta">
          <small>Conta: {conta.email ?? "Google"}</small>
          <button
            className="gs-btn gs-btn-bloco gs-btn-sair"
            onClick={async () => {
              await sairDaConta(save);
              window.location.reload();
            }}
          >
            🚪 Sair da conta
          </button>
        </div>
      )}
    </div>
  );
}
