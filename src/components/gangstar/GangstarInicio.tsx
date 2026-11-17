"use client";

// Gangstar: tela de boas-vindas + criacao de personagem do modo "construcao de imperio do crime".
// Visual pixel/retro/arcade, propositalmente bem diferente da estetica do FutOnze.

import { useState } from "react";
import { CLASSES, ClasseId, gangstar } from "@/lib/gangstar";
import { GangstarApp } from "./GangstarApp";
import { gravarNav, lerNav } from "./navegacao";
import { Icone } from "../Icone";

type Etapa = "boas-vindas" | "criar-personagem" | "jogo";

export function GangstarInicio({ aoVoltar }: { aoVoltar?: () => void }) {
  const [temSalvo, setTemSalvo] = useState(() => gangstar.temSalvo());
  const [etapa, setEtapaBruta] = useState<Etapa>(() => (lerNav<string>("etapa", "") === "jogo" && gangstar.temSalvo() ? "jogo" : "boas-vindas"));
  const setEtapa = (e: Etapa) => {
    gravarNav("etapa", e === "jogo" ? "jogo" : null);
    setEtapaBruta(e);
  };
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState<ClasseId>("assaltante");

  const continuarJogo = () => setEtapa("jogo");

  const criarPersonagem = () => {
    gangstar.novoJogo(nome, classe);
    setTemSalvo(true);
    setEtapa("jogo");
  };

  if (etapa === "jogo") {
    return <GangstarApp aoSair={() => setEtapa("boas-vindas")} />;
  }

  return (
    <section className="gs-tela">
      <div className="gs-banner" aria-hidden="true" />
      <div className="gs-grade" aria-hidden="true" />

      {(etapa === "criar-personagem" || aoVoltar) && (
        <button className="gs-voltar" onClick={etapa === "criar-personagem" ? () => setEtapa("boas-vindas") : aoVoltar} aria-label="Voltar">
          <Icone nome="esq" />
        </button>
      )}

      {etapa === "boas-vindas" && (
        <div className="gs-conteudo">
          <h1 className="gs-titulo">
            GANG<span className="gs-titulo-dest">STAR</span>
          </h1>
          <p className="gs-subtitulo">Construa seu império</p>

          <div className="gs-botoes">
            {temSalvo && (
              <button className="gs-btn gs-btn-principal" onClick={continuarJogo}>
                Continuar
              </button>
            )}
            <button className={`gs-btn ${temSalvo ? "gs-btn-secundario" : "gs-btn-principal"}`} onClick={() => setEtapa("criar-personagem")}>
              Novo jogo
            </button>
          </div>

          {temSalvo && <small className="gs-dica">Começar um novo jogo apaga o império salvo neste aparelho.</small>}
        </div>
      )}

      {etapa === "criar-personagem" && (
        <div className="gs-conteudo gs-conteudo-criacao">
          <h2 className="gs-titulo gs-titulo-pequeno">CRIAR PERSONAGEM</h2>

          <div className="gs-campo gs-campo-claro">
            <label className="gs-label" htmlFor="gs-nome-personagem">
              Seu nome de rua
            </label>
            <input
              id="gs-nome-personagem"
              className="gs-input"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Zico do Beco"
              maxLength={20}
            />
          </div>

          <div className="gs-classes">
            {(Object.keys(CLASSES) as ClasseId[]).map((id) => {
              const c = CLASSES[id];
              return (
                <button key={id} className={`gs-classe-btn ${classe === id ? "gs-classe-ativa" : ""}`} onClick={() => setClasse(id)}>
                  <span className="gs-card-emoji">{c.emoji}</span>
                  <strong>{c.nome}</strong>
                  <span className="gs-card-sub">{c.descricao}</span>
                </button>
              );
            })}
          </div>

          <div className="gs-botoes">
            <button className="gs-btn gs-btn-principal" onClick={criarPersonagem}>
              Começar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
