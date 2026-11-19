"use client";

// Gangstar: ilustracoes do topo das telas do Hub (Escola, Academia, Banco, Boate, Lavanderia).
// Todas em faixa 3:1 recortada pelo centro (classe gs-ilustracao).
// Imagens pixel art em public/gangstar/servicos.

/* eslint-disable @next/next/no-img-element */

export function IlustracaoEscola() {
  return <img src="/gangstar/servicos/escola.webp" alt="Escola Modelo Pinheiro por dentro" className="gs-ilustracao" width={1376} height={768} />;
}

export function IlustracaoAcademia() {
  return <img src="/gangstar/servicos/academia.webp" alt="Academia Athletica por dentro" className="gs-ilustracao" width={1376} height={768} />;
}

export function IlustracaoBanco() {
  return <img src="/gangstar/servicos/banco.webp" alt="Banco por dentro" className="gs-ilustracao" width={1376} height={459} />;
}

export function IlustracaoBoate() {
  return <img src="/gangstar/servicos/boate.webp" alt="Boate por dentro" className="gs-ilustracao" width={1376} height={768} />;
}

export function IlustracaoLavanderia() {
  return <img src="/gangstar/servicos/lavanderia.webp" alt="Lavanderia por dentro" className="gs-ilustracao" width={1376} height={1085} />;
}
