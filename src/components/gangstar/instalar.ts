// Gangstar: captura o pedido de instalacao do navegador (Android/Chrome) o mais cedo
// possivel, para o botao "Instalar app" usar depois. No iPhone nao existe esse
// evento: o botao mostra o passo a passo do Safari.

type EventoInstalar = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

let pedido: EventoInstalar | null = null;
const ouvintes = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    pedido = e as EventoInstalar;
    ouvintes.forEach((f) => f());
  });
  window.addEventListener("appinstalled", () => {
    pedido = null;
    ouvintes.forEach((f) => f());
  });
}

export function ouvirInstalacao(f: () => void): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export function podeInstalarDireto(): boolean {
  return !!pedido;
}

export async function instalarAgora(): Promise<boolean> {
  if (!pedido) return false;
  await pedido.prompt();
  const escolha = await pedido.userChoice.catch(() => ({ outcome: "dismissed" }));
  pedido = null;
  ouvintes.forEach((f) => f());
  return escolha.outcome === "accepted";
}

export function jaInstalado(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function ehIphone(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
