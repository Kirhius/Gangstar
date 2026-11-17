"use client";

// Gangstar: nota de qualidade dos itens (C, B, A, S e SS), cada uma com sua cor.

import { notaQualidade } from "@/lib/gangstar";

export function NotaQualidade({ q }: { q: number }) {
  const nota = notaQualidade(q);
  return (
    <span className={`gs-nota gs-nota-${nota.toLowerCase()}`} title={`Qualidade ${nota}`}>
      {nota}
    </span>
  );
}
