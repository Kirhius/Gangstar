// Gangstar: logica pura dos jogos do Cassino (roleta, blackjack, caca-niquel e poker
// Texas Hold'em contra 2 jogadores de IA). Nada aqui mexe no save: a tela do cassino
// desconta a aposta e credita o premio no dinheiro do personagem.

// ---------- Cartas ----------

export interface Carta {
  r: number; // 2..14 (11=J, 12=Q, 13=K, 14=A)
  n: number; // naipe 0..3
}

export const NAIPES = ["♠", "♥", "♦", "♣"];

export function nomeValor(r: number): string {
  return r <= 10 ? String(r) : ["J", "Q", "K", "A"][r - 11];
}

export function cartaTexto(c: Carta): string {
  return `${nomeValor(c.r)}${NAIPES[c.n]}`;
}

export function cartaVermelha(c: Carta): boolean {
  return c.n === 1 || c.n === 2;
}

export function baralhoEmbaralhado(): Carta[] {
  const b: Carta[] = [];
  for (let n = 0; n < 4; n++) for (let r = 2; r <= 14; r++) b.push({ r, n });
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

// ---------- Roleta (europeia, 0-36) ----------

const VERMELHOS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export type ApostaRoleta =
  | { tipo: "vermelho" | "preto" | "par" | "impar" | "baixo" | "alto" }
  | { tipo: "duzia"; duzia: 1 | 2 | 3 }
  | { tipo: "numero"; numero: number };

export function corNumero(n: number): "verde" | "vermelho" | "preto" {
  if (n === 0) return "verde";
  return VERMELHOS.has(n) ? "vermelho" : "preto";
}

export function girarRoleta(): number {
  return Math.floor(Math.random() * 37);
}

// multiplicador do lucro (0 = perdeu). Ganho total = aposta * (mult + 1)
export function pagamentoRoleta(aposta: ApostaRoleta, n: number): number {
  if (aposta.tipo === "numero") return aposta.numero === n ? 35 : 0;
  if (n === 0) return 0;
  switch (aposta.tipo) {
    case "vermelho":
      return VERMELHOS.has(n) ? 1 : 0;
    case "preto":
      return !VERMELHOS.has(n) ? 1 : 0;
    case "par":
      return n % 2 === 0 ? 1 : 0;
    case "impar":
      return n % 2 === 1 ? 1 : 0;
    case "baixo":
      return n <= 18 ? 1 : 0;
    case "alto":
      return n >= 19 ? 1 : 0;
    case "duzia":
      return Math.ceil(n / 12) === aposta.duzia ? 2 : 0;
  }
}

// ---------- Caca-niquel ----------

export const SIMBOLOS_SLOT = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];
const PESOS_SLOT = [30, 25, 18, 13, 9, 5];
const PREMIO_TRINCA = [5, 8, 12, 20, 40, 100];

function sortearSimbolo(): number {
  const total = PESOS_SLOT.reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (let i = 0; i < PESOS_SLOT.length; i++) {
    x -= PESOS_SLOT[i];
    if (x < 0) return i;
  }
  return 0;
}

export function girarSlot(): number[] {
  return [sortearSimbolo(), sortearSimbolo(), sortearSimbolo()];
}

// multiplicador do valor apostado (total devolvido); 0 = perdeu
export function premioSlot(rolos: number[]): number {
  const [a, b, c] = rolos;
  if (a === b && b === c) return PREMIO_TRINCA[a];
  const cerejas = rolos.filter((x) => x === 0).length;
  if (cerejas === 2) return 2.5;
  return 0;
}

export const TABELA_SLOT = SIMBOLOS_SLOT.map((s, i) => ({ simbolo: s, premio: PREMIO_TRINCA[i] }));

// ---------- Blackjack ----------

export function valorMaoBJ(cartas: Carta[]): number {
  let total = 0;
  let ases = 0;
  for (const c of cartas) {
    if (c.r === 14) {
      ases++;
      total += 11;
    } else total += Math.min(10, c.r);
  }
  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }
  return total;
}

export function ehBlackjack(cartas: Carta[]): boolean {
  return cartas.length === 2 && valorMaoBJ(cartas) === 21;
}

// banca compra ate 17
export function jogarBanca(banca: Carta[], baralho: Carta[]): { banca: Carta[]; baralho: Carta[] } {
  const b = [...banca];
  const d = [...baralho];
  while (valorMaoBJ(b) < 17) b.push(d.pop()!);
  return { banca: b, baralho: d };
}

// multiplicador devolvido (aposta x mult): 0 perdeu, 1 empate, 2 ganhou, 2.5 blackjack
export function resultadoBJ(jogador: Carta[], banca: Carta[]): { mult: number; texto: string } {
  const vj = valorMaoBJ(jogador);
  const vb = valorMaoBJ(banca);
  if (vj > 21) return { mult: 0, texto: "Estourou! A banca vence." };
  if (ehBlackjack(jogador) && !ehBlackjack(banca)) return { mult: 2.5, texto: "Blackjack! Paga 3 para 2." };
  if (ehBlackjack(banca) && !ehBlackjack(jogador)) return { mult: 0, texto: "A banca fez blackjack." };
  if (vb > 21) return { mult: 2, texto: "A banca estourou! Você vence." };
  if (vj > vb) return { mult: 2, texto: `Você venceu (${vj} x ${vb}).` };
  if (vj === vb) return { mult: 1, texto: `Empate (${vj}). Aposta devolvida.` };
  return { mult: 0, texto: `A banca venceu (${vb} x ${vj}).` };
}

// ---------- Poker (Texas Hold'em) ----------

const NOMES_MAO = ["Carta alta", "Um par", "Dois pares", "Trinca", "Sequência", "Flush", "Full house", "Quadra", "Straight flush"];

function avaliar5(cs: Carta[]): number[] {
  const rs = cs.map((c) => c.r).sort((a, b) => b - a);
  const flush = cs.every((c) => c.n === cs[0].n);
  const unicos = [...new Set(rs)];
  let topoSeq = 0;
  if (unicos.length === 5) {
    if (rs[0] - rs[4] === 4) topoSeq = rs[0];
    else if (rs[0] === 14 && rs[1] === 5) topoSeq = 5; // A-2-3-4-5
  }
  const cont = new Map<number, number>();
  for (const r of rs) cont.set(r, (cont.get(r) ?? 0) + 1);
  const grupos = [...cont.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const ordem = grupos.map((g) => g[0]);
  if (topoSeq && flush) return [8, topoSeq];
  if (grupos[0][1] === 4) return [7, ...ordem];
  if (grupos[0][1] === 3 && grupos[1][1] === 2) return [6, ...ordem];
  if (flush) return [5, ...rs];
  if (topoSeq) return [4, topoSeq];
  if (grupos[0][1] === 3) return [3, ...ordem];
  if (grupos[0][1] === 2 && grupos[1][1] === 2) return [2, ...ordem];
  if (grupos[0][1] === 2) return [1, ...ordem];
  return [0, ...rs];
}

export function compararPontuacao(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

// melhor mao de 5 entre 5 a 7 cartas
export function avaliarMao(cartas: Carta[]): number[] {
  if (cartas.length <= 5) return avaliar5(cartas);
  let melhor: number[] | null = null;
  const n = cartas.length;
  const escolher = (inicio: number, atual: Carta[]) => {
    if (atual.length === 5) {
      const p = avaliar5(atual);
      if (!melhor || compararPontuacao(p, melhor) > 0) melhor = p;
      return;
    }
    for (let i = inicio; i <= n - (5 - atual.length); i++) escolher(i + 1, [...atual, cartas[i]]);
  };
  escolher(0, []);
  return melhor!;
}

export function nomeMao(pontuacao: number[]): string {
  return NOMES_MAO[pontuacao[0]];
}

// forca da mao para a IA decidir (0 a 1)
export function forcaMaoIA(mao: Carta[], mesa: Carta[]): number {
  if (mesa.length === 0) {
    const [a, b] = mao;
    let f = (a.r + b.r - 4) / 24 * 0.55;
    if (a.r === b.r) f += 0.3 + a.r / 60;
    if (a.n === b.n) f += 0.06;
    if (Math.abs(a.r - b.r) === 1) f += 0.04;
    return Math.min(1, f);
  }
  const p = avaliarMao([...mao, ...mesa]);
  const cat = p[0];
  const base = [0.12, 0.42, 0.62, 0.75, 0.82, 0.86, 0.93, 0.98, 1][cat];
  return Math.min(1, base + ((p[1] ?? 0) / 14) * 0.08);
}

export function decisaoIA(forca: number, precisaPagar: boolean): "fold" | "call" | "raise" {
  const blefe = Math.random() < 0.1;
  const r = forca + (Math.random() - 0.5) * 0.15;
  if (precisaPagar) {
    if (r < 0.3 && !blefe) return "fold";
    return "call";
  }
  if (r > 0.7 || blefe) return "raise";
  return "call"; // "call" sem aposta = mesa (check)
}
