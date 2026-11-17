"use client";

// Gangstar: conta logada (multiplayer). Sem login (Supabase nao configurado) fica nulo.

import { createContext, useContext } from "react";

export interface Conta {
  userId: string;
  email: string | null;
}

export const ContaContexto = createContext<Conta | null>(null);

export function useConta(): Conta | null {
  return useContext(ContaContexto);
}
