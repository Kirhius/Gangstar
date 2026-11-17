import type { ReactNode } from "react";

export type NomeIcone =
  | "inicio"
  | "livro"
  | "menu"
  | "elenco"
  | "tatica"
  | "tabela"
  | "jogos"
  | "bola"
  | "lesao"
  | "esq"
  | "dir"
  | "fechar"
  | "play"
  | "pular"
  | "alerta"
  | "estrela"
  | "auto"
  | "troca"
  | "check"
  | "clube"
  | "espadas"
  | "gerente"
  | "lupa"
  | "contrato"
  | "proposta"
  | "engrenagem"
  | "presente"
  | "globo"
  | "trofeu"
  | "medalha"
  | "coroa"
  | "sino"
  | "olho"
  | "olhoFechado"
  | "banco";

const CAMINHOS: Record<NomeIcone, ReactNode> = {
  banco: (
    <>
      <path d="M3 9.5 12 4l9 5.5H3Z" />
      <path d="M5 12v6M9.5 12v6M14.5 12v6M19 12v6M3 20h18" />
    </>
  ),
  globo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  coroa: (
    <>
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8Z" />
      <path d="M5.5 21h13" />
    </>
  ),
  trofeu: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 14v4M8.5 20h7" />
    </>
  ),
  sino: (
    <>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </>
  ),
  olho: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  olhoFechado: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M4 4l16 16" />
    </>
  ),
  presente: (
    <>
      <rect x="4" y="10" width="16" height="10" rx="1.5" />
      <path d="M3 7h18v3H3zM12 7v13" />
      <path d="M12 7C9 7 7.5 5.8 7.5 4.6 7.5 3.6 8.4 3 9.3 3 11 3 12 5 12 7zM12 7c3 0 4.5-1.2 4.5-2.4 0-1-.9-1.6-1.8-1.6C13 3 12 5 12 7z" />
    </>
  ),
  gerente: (
    <>
      <circle cx="12" cy="7.5" r="3.6" />
      <path d="M4.5 21c.4-4.4 3.4-7 7.5-7s7.1 2.6 7.5 7" />
      <path d="M12 14l-1.6 2.2L12 20l1.6-3.8z" />
    </>
  ),
  lupa: (
    <>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="M15 15l5.5 5.5" />
    </>
  ),
  contrato: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14.5 3v4.5H19M9 12h7M9 15.5h7M9 19h4" />
    </>
  ),
  proposta: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  engrenagem: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </>
  ),
  espadas: (
    <>
      <path d="M4 4l9.5 9.5M4 4v3.5L5.5 9M4 4h3.5L9 5.5" />
      <path d="M20 4l-9.5 9.5M20 4v3.5L18.5 9M20 4h-3.5L15 5.5" />
      <path d="M6.5 14.5l3 3M17.5 14.5l-3 3" />
      <path d="M5 19l2.5-2.5M19 19l-2.5-2.5" />
    </>
  ),
  inicio: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9.5h13V10" />
      <path d="M10 19.5v-5h4v5" />
    </>
  ),
  elenco: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19.5c.4-3.4 3-5.5 6.2-5.5s5.8 2.1 6.2 5.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17.2 14c2.3.2 3.9 1.9 4.2 4.5" />
    </>
  ),
  tatica: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M12 4v16" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M3 9.5h3.5v5H3M21 9.5h-3.5v5H21" />
    </>
  ),
  tabela: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 14v3.5M8.5 20h7M9.5 17.5h5" />
    </>
  ),
  jogos: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M8 14h3M13 14h3M8 17h3" />
    </>
  ),
  bola: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 8 3.4 2.5-1.3 4h-4.2l-1.3-4L12 8Z" />
      <path d="M12 8V3.2M15.4 10.5l4.7-1.4M14.1 14.5l2.9 3.9M9.9 14.5l-2.9 3.9M8.6 10.5 3.9 9.1" />
    </>
  ),
  lesao: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  esq: <path d="m14.5 5-7 7 7 7" />,
  dir: <path d="m9.5 5 7 7-7 7" />,
  fechar: <path d="m6 6 12 12M18 6 6 18" />,
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" />,
  pular: (
    <>
      <path d="M5 5.5v13l9-6.5-9-6.5Z" />
      <path d="M18 5.5v13" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5Z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  menu: <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />,
  livro: (
    <>
      <path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v12.5H7.5A2.5 2.5 0 0 1 5 17V4.5Z" />
      <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5H18M9 8h5.5" />
    </>
  ),
  medalha: (
    <>
      <path d="m8 3 3 6.2M16 3l-3 6.2" />
      <circle cx="12" cy="15" r="5.5" />
      <path d="m12 12.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3.9-1.8Z" />
    </>
  ),
  estrela: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.8L12 3.5Z" />,
  auto: (
    <>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m18.5 15 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  troca: (
    <>
      <path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  clube: (
    <>
      <path d="M3 20.5h18" />
      <path d="M4.5 20.5V11l4-2.5V20.5" />
      <path d="M8.5 20.5v-14l6-3v17.5" />
      <path d="M14.5 20.5V9.5l5 2.5v8.5" />
      <path d="M11 8.5v.1M11 12v.1M11 15.5v.1M17 14.5v.1" />
    </>
  ),
};

export function Icone({ nome, tamanho = 22, cheio = false }: { nome: NomeIcone; tamanho?: number; cheio?: boolean }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill={cheio ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
