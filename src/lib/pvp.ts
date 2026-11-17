// Gangstar: regras do PvP (ataque a outro jogador). Este arquivo roda NO SERVIDOR
// (rota /api/pvp/atacar): o resultado e sorteado uma unica vez e gravado num registro
// so, que os dois aparelhos leem. Assim ninguem "ganha" no proprio celular.

export const NIVEL_PVP = 7;
export const ENERGIA_PVP = 15;
export const RECARGA_MESMO_ALVO_H = 6; // so pode atacar o mesmo jogador a cada 6h
export const PROTECAO_APOS_PERDER_H = 1; // quem perde dinheiro fica 1h protegido
export const TETO_ROUBO_PVP = 100000;

export interface ResumoJogador {
  id: string;
  nome: string;
  gangue: string | null;
  nivel: number;
  respeito: number;
  poder: number;
  dinheiro: number;
  dinheiro_sujo?: number;
  energia: number;
  vida: number;
  protegido_ate: string | null;
}

// o que muda no save de cada lado (aplicado pelo aparelho de cada um)
export interface EfeitoPvp {
  dinheiro: number; // limpo
  sujo: number;
  respeito: number;
  vida: number;
  energia: number;
  xp: number;
}

export function chancePvp(poderAtacante: number, poderDefensor: number): number {
  const a = Math.max(1, poderAtacante);
  const d = Math.max(1, poderDefensor);
  return Math.max(0.1, Math.min(0.9, 0.5 + ((a - d) / (a + d)) * 0.8));
}

export function resolverAtaque(
  atacante: ResumoJogador,
  defensor: ResumoJogador,
  sorteio: number = Math.random(),
): { venceu: boolean; chance: number; efeitoAtacante: EfeitoPvp; efeitoDefensor: EfeitoPvp } {
  const chance = chancePvp(atacante.poder, defensor.poder);
  const venceu = sorteio < chance;
  if (venceu) {
    // o dinheiro sujo vai primeiro (20%); sem sujo, leva 12% do limpo. O atacante recebe tudo como sujo.
    const sujoDef = Math.max(0, defensor.dinheiro_sujo ?? 0);
    const doSujo = Math.min(TETO_ROUBO_PVP, Math.round(sujoDef * 0.2));
    const doLimpo = doSujo > 0 ? 0 : Math.min(TETO_ROUBO_PVP, Math.max(0, Math.round(defensor.dinheiro * 0.12)));
    return {
      venceu,
      chance,
      efeitoAtacante: { dinheiro: 0, sujo: doSujo + doLimpo, respeito: 20, vida: -5, energia: -ENERGIA_PVP, xp: 40 },
      efeitoDefensor: { dinheiro: -doLimpo, sujo: -doSujo, respeito: -15, vida: -10, energia: 0, xp: 0 },
    };
  }
  return {
    venceu,
    chance,
    efeitoAtacante: { dinheiro: 0, sujo: 0, respeito: -10, vida: -15, energia: -ENERGIA_PVP, xp: 10 },
    efeitoDefensor: { dinheiro: 0, sujo: 0, respeito: 10, vida: 0, energia: 0, xp: 15 },
  };
}
