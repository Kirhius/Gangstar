// Gangstar: cliente do Supabase no navegador (login, save na nuvem, ranking e PvP).
// Sem as variaveis de ambiente o jogo continua funcionando offline (so no aparelho).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cliente: SupabaseClient | null = null;

export function supabaseConfigurado(): boolean {
  return !!URL && !!CHAVE;
}

export function supabase(): SupabaseClient {
  if (!URL || !CHAVE) throw new Error("Supabase não configurado");
  if (!cliente) {
    cliente = createClient(URL, CHAVE, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "gangstar:auth" },
    });
  }
  return cliente;
}
