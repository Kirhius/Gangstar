// Gangstar: lembra em que tela o jogador estava, para um refresh da pagina voltar
// para o mesmo lugar (sessionStorage: vale so para a aba aberta do navegador).

const PREFIXO = "gangstar:nav:";

export function lerNav<T extends string>(chave: string, padrao: T): T {
  if (typeof window === "undefined") return padrao;
  try {
    return (sessionStorage.getItem(PREFIXO + chave) as T | null) ?? padrao;
  } catch {
    return padrao;
  }
}

export function gravarNav(chave: string, valor: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (valor === null) sessionStorage.removeItem(PREFIXO + chave);
    else sessionStorage.setItem(PREFIXO + chave, valor);
  } catch {
    // sem sessionStorage (modo privado etc.): so nao lembra a tela
  }
}

export function limparNav(): void {
  for (const c of ["ativo", "etapa", "aba", "visao"]) gravarNav(c, null);
}
