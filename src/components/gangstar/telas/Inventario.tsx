"use client";

// Gangstar: aba "Inventário" - itens produzidos nas fábricas, comprados do Mercador ou
// saqueados em emboscadas. Bebidas, drogas e medicamentos são consumidos aqui (v1.13);
// armas e coletes são equipados no Perfil.

import { useState } from "react";

import { GangstarSave, compradosDoMercador, durabilidadeItem, durabilidadeMax, multQualidade, parseChave, usarItem } from "@/lib/gangstar";
import { NotaQualidade } from "../NotaQualidade";
import { TituloComAjuda } from "../TituloComAjuda";
import { NOME_CATEGORIA, RARIDADES, ehConsumivel, itemPorId, type CategoriaItem, type ItemDef } from "@/lib/gangstarItens";

function formatarDinheiro(v: number): string {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function descricaoItem(item: ItemDef): string {
  const partes: string[] = [];
  if (item.poder) partes.push(`💪 +${item.poder} poder`);
  if (item.energia) partes.push(`⚡ +${item.energia}`);
  if (item.vida) partes.push(`❤️ +${item.vida}`);
  if (item.vicio) partes.push(`🌀 +${item.vicio} vício`);
  if (item.raridade) partes.push(`${RARIDADES[item.raridade].nome}: ${item.descricao ?? ""}`);
  return partes.join(" · ");
}

const ORDEM: CategoriaItem[] = ["especial", "arma", "colete", "bebida", "droga", "medicamento"];

export function Inventario({ save, aoAtualizar }: { save: GangstarSave; aoAtualizar: (s: GangstarSave) => void }) {
  const inv = save.inventario;
  // uma pilha por item + qualidade (chave "id@q"), da melhor para a pior
  const pilhas = Object.entries(inv)
    .filter(([, q]) => q > 0)
    .map(([chave, qtd]) => {
      const { id, q } = parseChave(chave);
      return { chave, qtd, q, item: itemPorId(id) };
    })
    .filter((p): p is { chave: string; qtd: number; q: number; item: ItemDef } => !!p.item)
    .sort((a, b) => a.item.nome.localeCompare(b.item.nome) || b.q - a.q);
  const total = Object.values(inv).reduce((a, b) => a + b, 0);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const usar = (chave: string, item: ItemDef) => {
    const r = usarItem(save, chave);
    if (r.erro) return setMensagem(`⚠️ ${r.erro}`);
    aoAtualizar(r.save);
    setMensagem(r.overdose ? `💀 ${item.emoji} ${item.nome}: overdose! Você foi parar no hospital.` : `${item.emoji} ${item.nome}: ${descricaoItem(item)}`);
  };


  const equipado = (item: ItemDef) =>
    (item.categoria === "arma" && save.personagem.armaEquipada === item.id) ||
    (item.categoria === "colete" && save.equipamento.colete === item.id) ||
    (item.categoria === "especial" && save.equipamento.especial === item.id);

  return (
    <div className="gs-pagina">
      <TituloComAjuda
        titulo="🎒 Inventário"
        ajuda={
          <>
            <p>
              {total} {total === 1 ? "item" : "itens"}. Produza nas fábricas da Minha Cidade, compre do Mercador ou saqueie em emboscadas.
            </p>
            <p>
              Bebidas, drogas e medicamentos você consome aqui (botão Usar) ou põe na prateleira das suas lojas. Armas, coletes e itens raros se equipam no Perfil. Itens
              comprados do Mercador servem para tudo, só não podem ser vendidos de volta para ele.
            </p>
            <p>Qualidade: C, B, A, S e SS — fábricas com mais nível e contrabandistas na gangue produzem melhor.</p>
          </>
        }
      />
      {mensagem && <div className="gs-aviso">{mensagem}</div>}
      {pilhas.length === 0 && <p className="gs-dica">Inventário vazio</p>}
      {ORDEM.map((cat) => {
        const daCat = pilhas.filter((p) => p.item.categoria === cat);
        if (!daCat.length) return null;
        return (
          <div key={cat}>
            <h3 className="gs-h3">{NOME_CATEGORIA[cat]}</h3>
            <div className="gs-lista">
              {daCat.map(({ chave, qtd, q, item }) => (
                <div
                  key={chave}
                  className={`gs-card ${equipado(item) ? "gs-card-ativo" : ""} ${item.raridade ? "gs-card-raro" : ""}`}
                  style={item.raridade ? { borderColor: RARIDADES[item.raridade].cor } : undefined}
                >
                  <span className="gs-card-emoji">{item.emoji}</span>
                  <div className="gs-card-corpo">
                    <strong>
                      {item.nome} ×{qtd}
                      {!item.raridade && <NotaQualidade q={q} />}
                    </strong>
                    {item.raridade && (
                      <span className={`gs-card-sub ${durabilidadeItem(save, item.id) <= 0 ? "gs-risco" : ""}`}>
                        🔧 {durabilidadeItem(save, item.id)}/{durabilidadeMax(item)} usos{durabilidadeItem(save, item.id) <= 0 ? " — quebrado (conserte no Comércio de armas)" : ""}
                      </span>
                    )}
                    <span className="gs-card-sub">
                      {descricaoItem(item)} · vale {formatarDinheiro(Math.round(item.valor * multQualidade(q)))}
                    </span>
                    {compradosDoMercador(save, chave) > 0 && (
                      <span className="gs-card-sub">🧳 {compradosDoMercador(save, chave)} do Mercador (não volta para ele)</span>
                    )}
                  </div>
                  {equipado(item) && <span className="gs-tag">Equipado</span>}
                  {ehConsumivel(item) && (
                    <button className="gs-btn-mini" disabled={!!save.personagem.preso} onClick={() => usar(chave, item)}>
                      Usar
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
