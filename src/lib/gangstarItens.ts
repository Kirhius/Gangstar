// Gangstar: catalogo de itens produzidos nas fabricas (dados puros, sem dependencia do
// motor). Cada fabrica libera um produto novo por nivel (1 a 10).
//
// - Armas e coletes: equipaveis no Perfil (slot de arma e slot de colete) e somam poder.
// - Bebidas, drogas e medicamentos: consumiveis no Inventario (energia, vida e vicio).
// O "valor" e o preco de referencia: base para o Mercador e para os contratos do Porto.

export type CategoriaItem = "arma" | "colete" | "bebida" | "droga" | "medicamento" | "especial";
export type Raridade = "comum" | "raro" | "epico" | "lendario";
export type TipoBonusEspecial = "poder" | "respeito" | "prisao" | "extorsao" | "emboscada";
export type FabricaItem = "fabrica-armas" | "fabrica-bebidas" | "fabrica-drogas" | "fabrica-medicamentos";

export interface ItemDef {
  id: string;
  nome: string;
  emoji: string;
  categoria: CategoriaItem;
  fabrica?: FabricaItem; // itens raros nao saem de fabrica
  nivel: number; // nivel da fabrica que libera o item
  valor: number;
  poder?: number; // armas e coletes
  energia?: number; // consumiveis
  vida?: number;
  vicio?: number;
  // itens raros (slot Especial do Perfil)
  raridade?: Raridade;
  bonus?: { tipo: TipoBonusEspecial; valor: number };
  descricao?: string;
}

export const ITENS: ItemDef[] = [
  // ---- Destilaria (bebidas): energia, pouco vicio
  { id: "pinga", nome: "Pinga barata", emoji: "🥃", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 1, valor: 40, energia: 8, vicio: 1 },
  { id: "cerveja", nome: "Cerveja barata", emoji: "🍺", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 2, valor: 70, energia: 12, vicio: 1 },
  { id: "aguardente", nome: "Aguardente envelhecida", emoji: "🍶", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 3, valor: 120, energia: 16, vicio: 2 },
  { id: "vodka", nome: "Vodka nacional", emoji: "🍸", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 4, valor: 190, energia: 20, vicio: 2 },
  { id: "rum", nome: "Rum caribenho", emoji: "🏝️", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 5, valor: 290, energia: 25, vicio: 3 },
  { id: "tequila", nome: "Tequila reposado", emoji: "🌵", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 6, valor: 420, energia: 30, vicio: 3 },
  { id: "gin", nome: "Gin artesanal", emoji: "🍹", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 7, valor: 600, energia: 36, vicio: 3 },
  { id: "uisque", nome: "Uísque 18 anos", emoji: "🥃", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 8, valor: 850, energia: 42, vicio: 4 },
  { id: "conhaque", nome: "Conhaque XO", emoji: "🍷", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 9, valor: 1200, energia: 50, vicio: 4 },
  { id: "champanhe", nome: "Champanhe de luxo", emoji: "🍾", categoria: "bebida", fabrica: "fabrica-bebidas", nivel: 10, valor: 1700, energia: 60, vicio: 4 },

  // ---- Fabrica de medicamentos: vida (e um pouco de energia), quase sem vicio
  { id: "analgesico", nome: "Analgésico", emoji: "💊", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 1, valor: 50, vida: 10, energia: 2 },
  { id: "ansiolitico", nome: "Ansiolítico", emoji: "💊", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 2, valor: 85, vida: 14, energia: 4, vicio: 1 },
  { id: "anti-inflamatorio", nome: "Anti-inflamatório", emoji: "💊", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 3, valor: 140, vida: 20, energia: 4 },
  { id: "relaxante", nome: "Relaxante muscular", emoji: "💉", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 4, valor: 210, vida: 26, energia: 6 },
  { id: "antibiotico", nome: "Antibiótico forte", emoji: "🧫", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 5, valor: 310, vida: 34, energia: 6 },
  { id: "morfina", nome: "Morfina", emoji: "💉", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 6, valor: 450, vida: 44, energia: 8, vicio: 3 },
  { id: "kit-sutura", nome: "Kit de sutura", emoji: "🩹", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 7, valor: 640, vida: 55, energia: 8 },
  { id: "adrenalina", nome: "Adrenalina", emoji: "💉", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 8, valor: 900, vida: 40, energia: 35, vicio: 2 },
  { id: "plasma", nome: "Bolsa de plasma", emoji: "🩸", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 9, valor: 1250, vida: 80, energia: 10 },
  { id: "soro-regenerador", nome: "Soro regenerador", emoji: "🧪", categoria: "medicamento", fabrica: "fabrica-medicamentos", nivel: 10, valor: 1800, vida: 100, energia: 25 },

  // ---- Fabrica de drogas: muita energia, muito vicio
  { id: "haxixe", nome: "Haxixe", emoji: "🟫", categoria: "droga", fabrica: "fabrica-drogas", nivel: 1, valor: 60, energia: 14, vicio: 4 },
  { id: "maconha", nome: "Maconha prensada", emoji: "🌿", categoria: "droga", fabrica: "fabrica-drogas", nivel: 2, valor: 100, energia: 18, vicio: 5 },
  { id: "alucinogeno", nome: "Alucinógeno", emoji: "🍄", categoria: "droga", fabrica: "fabrica-drogas", nivel: 3, valor: 160, energia: 24, vicio: 6 },
  { id: "ecstasy", nome: "Ecstasy", emoji: "💠", categoria: "droga", fabrica: "fabrica-drogas", nivel: 4, valor: 240, energia: 30, vicio: 8 },
  { id: "lanca-perfume", nome: "Lança-perfume", emoji: "🧴", categoria: "droga", fabrica: "fabrica-drogas", nivel: 5, valor: 350, energia: 36, vicio: 9 },
  { id: "cocaina", nome: "Cocaína", emoji: "❄️", categoria: "droga", fabrica: "fabrica-drogas", nivel: 6, valor: 500, energia: 44, vicio: 11 },
  { id: "heroina", nome: "Heroína", emoji: "💉", categoria: "droga", fabrica: "fabrica-drogas", nivel: 7, valor: 700, energia: 52, vicio: 13 },
  { id: "ketamina", nome: "Ketamina", emoji: "🧊", categoria: "droga", fabrica: "fabrica-drogas", nivel: 8, valor: 980, energia: 60, vicio: 14 },
  { id: "metanfetamina", nome: "Metanfetamina azul", emoji: "🔷", categoria: "droga", fabrica: "fabrica-drogas", nivel: 9, valor: 1350, energia: 72, vicio: 16 },
  { id: "po-dourado", nome: "Pó dourado", emoji: "✨", categoria: "droga", fabrica: "fabrica-drogas", nivel: 10, valor: 1900, energia: 85, vicio: 18 },

  // ---- Fabrica de armas: armas e coletes
  { id: "f-faca", nome: "Faca tática", emoji: "🔪", categoria: "arma", fabrica: "fabrica-armas", nivel: 1, valor: 200, poder: 5 },
  { id: "f-revolver", nome: "Revólver .38", emoji: "🔫", categoria: "arma", fabrica: "fabrica-armas", nivel: 2, valor: 900, poder: 12 },
  { id: "colete-basico", nome: "Colete básico", emoji: "🦺", categoria: "colete", fabrica: "fabrica-armas", nivel: 2, valor: 700, poder: 6 },
  { id: "f-pistola", nome: "Pistola automática", emoji: "🔫", categoria: "arma", fabrica: "fabrica-armas", nivel: 3, valor: 2000, poder: 20 },
  { id: "colete-reforcado", nome: "Colete reforçado", emoji: "🦺", categoria: "colete", fabrica: "fabrica-armas", nivel: 3, valor: 1600, poder: 11 },
  { id: "f-escopeta", nome: "Escopeta calibre 12", emoji: "💥", categoria: "arma", fabrica: "fabrica-armas", nivel: 4, valor: 4200, poder: 32 },
  { id: "f-submetralhadora", nome: "Submetralhadora", emoji: "🔫", categoria: "arma", fabrica: "fabrica-armas", nivel: 5, valor: 7500, poder: 44 },
  { id: "colete-tatico", nome: "Colete tático", emoji: "🦺", categoria: "colete", fabrica: "fabrica-armas", nivel: 5, valor: 5000, poder: 20 },
  { id: "f-fuzil", nome: "Fuzil de assalto", emoji: "🧨", categoria: "arma", fabrica: "fabrica-armas", nivel: 6, valor: 12500, poder: 58 },
  { id: "f-rifle-precisao", nome: "Rifle de precisão", emoji: "🎯", categoria: "arma", fabrica: "fabrica-armas", nivel: 7, valor: 19000, poder: 72 },
  { id: "colete-kevlar", nome: "Colete de kevlar pesado", emoji: "🛡️", categoria: "colete", fabrica: "fabrica-armas", nivel: 7, valor: 13000, poder: 32 },
  { id: "f-metralhadora", nome: "Metralhadora pesada", emoji: "🔫", categoria: "arma", fabrica: "fabrica-armas", nivel: 8, valor: 28000, poder: 90 },
  { id: "colete-militar", nome: "Colete balístico militar", emoji: "🛡️", categoria: "colete", fabrica: "fabrica-armas", nivel: 9, valor: 26000, poder: 46 },
  { id: "f-lanca-granadas", nome: "Lança-granadas", emoji: "💣", categoria: "arma", fabrica: "fabrica-armas", nivel: 10, valor: 45000, poder: 115 },
];

// ---- Itens raros: so caem nos roubos em equipe; vao no slot Especial do Perfil.
export const RARIDADES: Record<Raridade, { nome: string; cor: string; peso: number }> = {
  comum: { nome: "Comum", cor: "#9aa3b5", peso: 55 },
  raro: { nome: "Raro", cor: "#3ab0ff", peso: 28 },
  epico: { nome: "Épico", cor: "#a259ff", peso: 13 },
  lendario: { nome: "Lendário", cor: "#ffb020", peso: 4 },
};

export const ITENS_RAROS: ItemDef[] = [
  { id: "r-punho-ingles", nome: "Punho inglês", emoji: "👊", categoria: "especial", nivel: 1, valor: 3000, raridade: "comum", bonus: { tipo: "poder", valor: 0.05 }, descricao: "+5% de poder" },
  { id: "r-canivete-sorte", nome: "Canivete da sorte", emoji: "🗡️", categoria: "especial", nivel: 1, valor: 3000, raridade: "comum", bonus: { tipo: "respeito", valor: 0.06 }, descricao: "+6% de respeito nos roubos" },
  { id: "r-distintivo-falso", nome: "Distintivo falso", emoji: "🪪", categoria: "especial", nivel: 1, valor: 9000, raridade: "raro", bonus: { tipo: "prisao", valor: 0.15 }, descricao: "−15% de chance de prisão" },
  { id: "r-maleta-couro", nome: "Maleta de couro", emoji: "💼", categoria: "especial", nivel: 1, valor: 9000, raridade: "raro", bonus: { tipo: "extorsao", valor: 0.15 }, descricao: "+15% nas coletas de extorsão" },
  { id: "r-relogio-ouro", nome: "Relógio de ouro", emoji: "⌚", categoria: "especial", nivel: 1, valor: 25000, raridade: "epico", bonus: { tipo: "respeito", valor: 0.12 }, descricao: "+12% de respeito nos roubos" },
  { id: "r-celular-cripto", nome: "Celular criptografado", emoji: "📵", categoria: "especial", nivel: 1, valor: 25000, raridade: "epico", bonus: { tipo: "emboscada", valor: 0.15 }, descricao: "+15% de poder nas emboscadas e contra o capo" },
  { id: "r-anel-padrinho", nome: "Anel do Padrinho", emoji: "💍", categoria: "especial", nivel: 1, valor: 80000, raridade: "lendario", bonus: { tipo: "poder", valor: 0.15 }, descricao: "+15% de poder" },
  { id: "r-amuleto-jorge", nome: "Amuleto de São Jorge", emoji: "🧿", categoria: "especial", nivel: 1, valor: 80000, raridade: "lendario", bonus: { tipo: "prisao", valor: 0.3 }, descricao: "−30% de chance de prisão" },
];

export function itemPorId(id: string | null | undefined): ItemDef | null {
  if (!id) return null;
  return ITENS.find((i) => i.id === id) ?? ITENS_RAROS.find((i) => i.id === id) ?? null;
}

export function itensDaFabrica(fabrica: FabricaItem, ateNivel = 10): ItemDef[] {
  return ITENS.filter((i) => i.fabrica === fabrica && i.nivel <= ateNivel);
}

export function ehConsumivel(item: ItemDef): boolean {
  return item.categoria === "bebida" || item.categoria === "droga" || item.categoria === "medicamento";
}

export const NOME_CATEGORIA: Record<CategoriaItem, string> = {
  arma: "Armas",
  colete: "Coletes",
  bebida: "Bebidas",
  droga: "Drogas",
  medicamento: "Medicamentos",
  especial: "Itens raros",
};
