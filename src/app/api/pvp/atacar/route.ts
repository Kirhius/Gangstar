// Gangstar: ataque PvP resolvido no servidor. O resultado e sorteado aqui uma unica vez
// e gravado em gs_ataques; atacante e defensor aplicam o MESMO registro nos aparelhos.

import { createClient } from "@supabase/supabase-js";
import {
  ENERGIA_PVP,
  NIVEL_PVP,
  PROTECAO_APOS_PERDER_H,
  RECARGA_MESMO_ALVO_H,
  resolverAtaque,
  type ResumoJogador,
} from "@/lib/pvp";

export const dynamic = "force-dynamic";

function erro(msg: string, status = 400) {
  return Response.json({ erro: msg }, { status });
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chaveServico) return erro("Multiplayer não configurado no servidor.", 503);

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return erro("Faça login para atacar.", 401);

  const admin = createClient(url, chaveServico, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: usuario, error: erroUsuario } = await admin.auth.getUser(token);
  if (erroUsuario || !usuario.user) return erro("Sessão expirada. Entre de novo.", 401);
  const atacanteId = usuario.user.id;

  let corpo: { alvo?: string };
  try {
    corpo = await request.json();
  } catch {
    return erro("Pedido inválido.");
  }
  const defensorId = corpo.alvo;
  if (!defensorId || defensorId === atacanteId) return erro("Alvo inválido.");

  const { data: linhas, error: erroLinhas } = await admin.from("gs_jogadores").select("*").in("id", [atacanteId, defensorId]);
  if (erroLinhas) return erro("Não foi possível ler os jogadores.", 500);
  const atacante = linhas?.find((l) => l.id === atacanteId) as ResumoJogador | undefined;
  const defensor = linhas?.find((l) => l.id === defensorId) as ResumoJogador | undefined;
  if (!atacante) return erro("Seu personagem ainda não foi sincronizado. Tente de novo em alguns segundos.");
  if (!defensor) return erro("Esse jogador não existe mais.");
  if (atacante.nivel < NIVEL_PVP) return erro(`Ataques a jogadores liberam no nível ${NIVEL_PVP}.`);
  if (defensor.nivel < NIVEL_PVP) return erro(`Esse jogador ainda não chegou ao nível ${NIVEL_PVP}.`);
  if (atacante.energia < ENERGIA_PVP) return erro("Energia insuficiente.");
  if (atacante.vida <= 15) return erro("Você está muito ferido para atacar.");
  if (defensor.protegido_ate && new Date(defensor.protegido_ate).getTime() > Date.now()) {
    return erro("Esse jogador acabou de ser atacado e está protegido por enquanto.");
  }

  // recarga: o mesmo alvo so a cada 6h
  const desde = new Date(Date.now() - RECARGA_MESMO_ALVO_H * 3600000).toISOString();
  const { data: recentes } = await admin
    .from("gs_ataques")
    .select("id")
    .eq("atacante", atacanteId)
    .eq("defensor", defensorId)
    .gte("criado_em", desde)
    .limit(1);
  if (recentes && recentes.length) return erro(`Você já atacou esse jogador. Espere ${RECARGA_MESMO_ALVO_H}h para atacar de novo.`);

  const r = resolverAtaque(atacante, defensor);

  // um registro unico com o resultado e o efeito de cada lado
  const { data: ataque, error: erroAtaque } = await admin
    .from("gs_ataques")
    .insert({
      atacante: atacanteId,
      defensor: defensorId,
      atacante_nome: atacante.nome,
      atacante_gangue: atacante.gangue,
      defensor_nome: defensor.nome,
      defensor_gangue: defensor.gangue,
      venceu: r.venceu,
      chance: r.chance,
      efeito_atacante: r.efeitoAtacante,
      efeito_defensor: r.efeitoDefensor,
    })
    .select("*")
    .single();
  if (erroAtaque || !ataque) return erro("Não foi possível registrar o ataque.", 500);

  // atualiza os resumos na hora (o aparelho de cada um sincroniza o resto depois)
  const agora = new Date().toISOString();
  await admin
    .from("gs_jogadores")
    .update({
      energia: Math.max(0, atacante.energia + r.efeitoAtacante.energia),
      dinheiro: atacante.dinheiro + r.efeitoAtacante.dinheiro,
      atualizado_em: agora,
    })
    .eq("id", atacanteId);
  await admin
    .from("gs_jogadores")
    .update({
      dinheiro: Math.max(0, defensor.dinheiro + r.efeitoDefensor.dinheiro),
      protegido_ate: r.venceu ? new Date(Date.now() + PROTECAO_APOS_PERDER_H * 3600000).toISOString() : defensor.protegido_ate,
      atualizado_em: agora,
    })
    .eq("id", defensorId);

  return Response.json({ ataque });
}
