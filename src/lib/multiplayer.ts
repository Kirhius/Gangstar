// Gangstar: multiplayer no navegador. Login (Google ou e-mail), save na nuvem,
// jogadores reais no ranking e ataques PvP em tempo real.
//
// Regra de ouro do PvP: o resultado de um ataque e sorteado SO no servidor e gravado
// num registro unico (gs_ataques). Atacante e defensor aplicam o seu lado desse mesmo
// registro, uma unica vez (o id fica guardado no save). Os dois veem o mesmo resultado.

import type { RealtimeChannel, Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigurado } from "./supabase";
import { aplicarEfeitoPvp, definirJogadoresReais, gangstar, resumoPublico, type EfeitoPvpSave, type GangstarSave } from "./gangstar";

export { supabaseConfigurado };

const CHAVE_DONO = "gangstar:dono";

// v1.11: um aparelho por vez. Cada abertura do jogo tem um id proprio; ao entrar, ele e
// gravado em gs_saves.sessao. Se outro aparelho entrar depois, este para de enviar o save
// (para um nao apagar o progresso do outro) e mostra um aviso.
const ID_APARELHO = Math.random().toString(36).slice(2) + Date.now().toString(36);
let bloqueadoPorOutro = false;
const ouvintesBloqueio = new Set<(b: boolean) => void>();

export function sessaoEmOutroAparelho(): boolean {
  return bloqueadoPorOutro;
}

export function ouvirBloqueio(f: (b: boolean) => void): () => void {
  ouvintesBloqueio.add(f);
  return () => ouvintesBloqueio.delete(f);
}

function marcarBloqueio(b: boolean) {
  if (bloqueadoPorOutro === b) return;
  bloqueadoPorOutro = b;
  ouvintesBloqueio.forEach((f) => f(b));
}

// "Jogar neste aparelho": toma a sessao de volta e recarrega o save da nuvem
export async function assumirSessao(): Promise<void> {
  if (!usuarioAtual) return;
  await supabase().from("gs_saves").update({ sessao: ID_APARELHO }).eq("id", usuarioAtual);
  const { data } = await supabase().from("gs_saves").select("save").eq("id", usuarioAtual).maybeSingle();
  if (data?.save) gangstar.salvar(data.save as GangstarSave);
  marcarBloqueio(false);
}

export interface AtaqueRegistro {
  id: string;
  atacante: string;
  defensor: string;
  atacante_nome: string | null;
  atacante_gangue: string | null;
  defensor_nome: string | null;
  defensor_gangue: string | null;
  venceu: boolean;
  chance: number;
  efeito_atacante: EfeitoPvpSave;
  efeito_defensor: EfeitoPvpSave;
  aplicado_atacante: boolean;
  aplicado_defensor: boolean;
  criado_em: string;
}

export interface JogadorPublico {
  id: string;
  nome: string;
  gangue: string | null;
  nivel: number;
  respeito: number;
  poder: number;
  temporada: string | null;
  protegido_ate: string | null;
  atualizado_em: string;
}

// ---------- Conta ----------

export async function sessaoAtual(): Promise<Session | null> {
  if (!supabaseConfigurado()) return null;
  const { data } = await supabase().auth.getSession();
  return data.session;
}

export function ouvirSessao(f: (s: Session | null) => void): () => void {
  if (!supabaseConfigurado()) return () => undefined;
  const { data } = supabase().auth.onAuthStateChange((_evento, s) => f(s));
  return () => data.subscription.unsubscribe();
}

export async function entrarComGoogle(): Promise<string | null> {
  const { error } = await supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
  return error ? traduzirErro(error.message) : null;
}

export async function entrarComEmail(email: string, senha: string): Promise<string | null> {
  const { error } = await supabase().auth.signInWithPassword({ email, password: senha });
  return error ? traduzirErro(error.message) : null;
}

export async function criarConta(email: string, senha: string): Promise<{ erro: string | null; confirmar: boolean }> {
  const { data, error } = await supabase().auth.signUp({ email, password: senha, options: { emailRedirectTo: window.location.origin } });
  if (error) return { erro: traduzirErro(error.message), confirmar: false };
  return { erro: null, confirmar: !data.session };
}

export async function sairDaConta(save: GangstarSave | null): Promise<void> {
  if (save) await salvarNaNuvem(save).catch(() => undefined);
  marcarBloqueio(false);
  await supabase().auth.signOut();
  // o proximo login (talvez outra conta) nao herda este imperio
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith("gangstar:save")) localStorage.removeItem(k);
    localStorage.removeItem(CHAVE_DONO);
  } catch {
    // sem localStorage: nada a limpar
  }
}

function traduzirErro(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Esse e-mail já tem conta. Use Entrar.";
  if (m.includes("password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (m.includes("email not confirmed")) return "Confirme o seu e-mail (veja a caixa de entrada) e tente de novo.";
  if (m.includes("provider is not enabled")) return "Login com Google ainda não foi ativado no Supabase.";
  return msg;
}

// ---------- Save na nuvem ----------

// ao entrar: a nuvem manda. Sem save na nuvem, o save deste aparelho sobe para a conta
// (so se ele nao for de outra conta).
export async function sincronizarAoEntrar(userId: string): Promise<void> {
  const { data } = await supabase().from("gs_saves").select("save").eq("id", userId).maybeSingle();
  let dono: string | null = null;
  try {
    dono = localStorage.getItem(CHAVE_DONO);
  } catch {
    // ignora
  }
  if (data?.save) {
    gangstar.salvar(data.save as GangstarSave);
    // este aparelho passa a ser o dono da sessao
    await supabase().from("gs_saves").update({ sessao: ID_APARELHO }).eq("id", userId);
  } else {
    const local = dono && dono !== userId ? null : gangstar.carregar();
    if (dono && dono !== userId) {
      try {
        for (const k of Object.keys(localStorage)) if (k.startsWith("gangstar:save")) localStorage.removeItem(k);
      } catch {
        // ignora
      }
    }
    if (local) await salvarNaNuvem(local, userId);
  }
  try {
    localStorage.setItem(CHAVE_DONO, userId);
  } catch {
    // ignora
  }
}

let usuarioAtual: string | null = null;
export function definirUsuario(id: string | null) {
  usuarioAtual = id;
}
export function usuarioLogado(): string | null {
  return usuarioAtual;
}

export async function salvarNaNuvem(save: GangstarSave, userId = usuarioAtual): Promise<void> {
  if (!userId || !supabaseConfigurado() || bloqueadoPorOutro) return;
  const agora = new Date().toISOString();
  const sb = supabase();
  // outro aparelho assumiu a conta? entao este nao envia nada
  const { data: dono } = await sb.from("gs_saves").select("sessao").eq("id", userId).maybeSingle();
  if (dono?.sessao && dono.sessao !== ID_APARELHO) {
    marcarBloqueio(true);
    return;
  }
  await Promise.all([
    sb.from("gs_saves").upsert({ id: userId, save, versao: Date.now(), atualizado_em: agora, sessao: ID_APARELHO }),
    sb.from("gs_jogadores").upsert({ id: userId, ...resumoPublico(save), atualizado_em: agora }),
  ]);
}

let timerSync: ReturnType<typeof setTimeout> | null = null;
let ultimoParaSync: GangstarSave | null = null;

// junta varias mudancas seguidas num envio so
export function agendarSync(save: GangstarSave) {
  if (!usuarioAtual) return;
  ultimoParaSync = save;
  if (timerSync) return;
  timerSync = setTimeout(() => {
    timerSync = null;
    if (ultimoParaSync) salvarNaNuvem(ultimoParaSync).catch(() => undefined);
  }, 3000);
}

export async function enviarAgora(): Promise<void> {
  if (timerSync) {
    clearTimeout(timerSync);
    timerSync = null;
  }
  if (ultimoParaSync) await salvarNaNuvem(ultimoParaSync).catch(() => undefined);
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") enviarAgora();
  });
}

// ---------- Outros jogadores ----------

let jogadores: JogadorPublico[] = [];
const ouvintesJogadores = new Set<() => void>();

export function listaJogadores(): JogadorPublico[] {
  return jogadores;
}

export function ouvirJogadores(f: () => void): () => void {
  ouvintesJogadores.add(f);
  return () => ouvintesJogadores.delete(f);
}

export async function atualizarJogadores(): Promise<void> {
  if (!usuarioAtual) return;
  const { data } = await supabase()
    .from("gs_jogadores")
    .select("id,nome,gangue,nivel,respeito,poder,temporada,protegido_ate,atualizado_em")
    .order("respeito", { ascending: false })
    .limit(300);
  jogadores = ((data ?? []) as JogadorPublico[]).filter((j) => j.id !== usuarioAtual);
  definirJogadoresReais(jogadores.map((j) => ({ id: j.id, nome: j.nome, gangue: j.gangue, respeito: Number(j.respeito), temporada: j.temporada })));
  ouvintesJogadores.forEach((f) => f());
}

// ---------- PvP ----------

export async function atacarJogador(alvoId: string): Promise<{ ataque?: AtaqueRegistro; erro?: string }> {
  const sessao = await sessaoAtual();
  if (!sessao) return { erro: "Faça login para atacar." };
  await enviarAgora(); // o servidor usa os seus numeros mais recentes
  try {
    const r = await fetch("/api/pvp/atacar", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${sessao.access_token}` },
      body: JSON.stringify({ alvo: alvoId }),
    });
    const corpo = await r.json();
    if (!r.ok) return { erro: corpo.erro ?? "Falha no ataque." };
    return { ataque: corpo.ataque as AtaqueRegistro };
  } catch {
    return { erro: "Sem conexão. O ataque não foi feito." };
  }
}

// aplica no save o lado deste jogador e avisa o servidor que ja aplicou
export function aplicarAtaque(save: GangstarSave, a: AtaqueRegistro, userId: string): GangstarSave {
  const souAtacante = a.atacante === userId;
  const efeito = souAtacante ? a.efeito_atacante : a.efeito_defensor;
  supabase()
    .rpc("gs_marcar_ataque_aplicado", { p_id: a.id })
    .then(
      () => undefined,
      () => undefined,
    );
  return aplicarEfeitoPvp(save, a.id, efeito);
}

export async function ataquesPendentes(userId: string): Promise<AtaqueRegistro[]> {
  const { data } = await supabase()
    .from("gs_ataques")
    .select("*")
    .or(`and(atacante.eq.${userId},aplicado_atacante.eq.false),and(defensor.eq.${userId},aplicado_defensor.eq.false)`)
    .order("criado_em", { ascending: true })
    .limit(50);
  return (data ?? []) as AtaqueRegistro[];
}

export async function historicoAtaques(userId: string): Promise<AtaqueRegistro[]> {
  const { data } = await supabase()
    .from("gs_ataques")
    .select("*")
    .or(`atacante.eq.${userId},defensor.eq.${userId}`)
    .order("criado_em", { ascending: false })
    .limit(20);
  return (data ?? []) as AtaqueRegistro[];
}

// tempo real: o defensor recebe o ataque na hora em que acontece
export function assinarAtaquesRecebidos(userId: string, f: (a: AtaqueRegistro) => void): () => void {
  const canal: RealtimeChannel = supabase()
    .channel(`gs-ataques-${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "gs_ataques", filter: `defensor=eq.${userId}` }, (p) =>
      f(p.new as AtaqueRegistro),
    )
    .subscribe();
  return () => {
    supabase().removeChannel(canal);
  };
}
