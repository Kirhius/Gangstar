// Gangstar: dia e noite nos mapas, pela hora real do aparelho. So muda a cor (uma
// camada por cima da arte); nada no mapa mexe nem deixa de ser clicavel.

export type PeriodoDia = "dia" | "entardecer" | "noite" | "amanhecer";

export function periodoDoDia(data = new Date()): PeriodoDia {
  const h = data.getHours() + data.getMinutes() / 60;
  if (h >= 6.5 && h < 17) return "dia";
  if (h >= 17 && h < 18.75) return "entardecer";
  if (h >= 5 && h < 6.5) return "amanhecer";
  return "noite";
}

// cor e opacidade da camada (mistura "multiply" escurece; "soft-light" so tinge)
const CAMADA: Record<PeriodoDia, { cor: string; opacidade: number; modo: "multiply" | "soft-light" } | null> = {
  dia: null,
  amanhecer: { cor: "#ff9ec4", opacidade: 0.28, modo: "soft-light" },
  entardecer: { cor: "#ff8a3d", opacidade: 0.32, modo: "soft-light" },
  noite: { cor: "#1c2a6b", opacidade: 0.58, modo: "multiply" },
};

// para mapas em SVG (Minha Cidade e Hub): um retangulo por cima das imagens
export function CamadaPeriodo({ w, h }: { w: number; h: number }) {
  const c = CAMADA[periodoDoDia()];
  if (!c) return null;
  return <rect x={0} y={0} width={w} height={h} fill={c.cor} opacity={c.opacidade} style={{ mixBlendMode: c.modo }} pointerEvents="none" />;
}

// para mapas em <img> (Porto): uma div por cima da imagem
export function CamadaPeriodoDiv() {
  const c = CAMADA[periodoDoDia()];
  if (!c) return null;
  return <div className="gs-camada-periodo" style={{ background: c.cor, opacity: c.opacidade, mixBlendMode: c.modo }} aria-hidden="true" />;
}
