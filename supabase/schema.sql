-- =====================================================================
-- Gangstar multiplayer - rode este arquivo inteiro no SQL Editor do Supabase.
-- Tabelas com prefixo gs_ (pode usar um projeto Supabase que ja tenha outras coisas).
-- Pode rodar de novo sem problema: tudo e "if not exists" / "or replace".
-- =====================================================================

-- Resumo publico de cada jogador (ranking, lista de alvos do PvP)
create table if not exists public.gs_jogadores (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default 'Sem nome',
  gangue text,
  nivel int not null default 1,
  respeito bigint not null default 0,
  patrimonio bigint not null default 0,
  poder numeric not null default 0,
  dinheiro bigint not null default 0,
  energia int not null default 0,
  vida int not null default 0,
  temporada text,
  protegido_ate timestamptz,
  atualizado_em timestamptz not null default now()
);

-- Save completo (privado: so o dono le e escreve)
create table if not exists public.gs_saves (
  id uuid primary key references auth.users (id) on delete cascade,
  save jsonb not null,
  versao bigint not null default 0,
  atualizado_em timestamptz not null default now()
);

-- Ataques PvP: calculados SO no servidor (rota /api/pvp/atacar). Um registro unico
-- com o resultado e o efeito em cada lado: os dois aparelhos mostram o mesmo resultado.
create table if not exists public.gs_ataques (
  id uuid primary key default gen_random_uuid(),
  atacante uuid not null references auth.users (id) on delete cascade,
  defensor uuid not null references auth.users (id) on delete cascade,
  atacante_nome text,
  atacante_gangue text,
  defensor_nome text,
  defensor_gangue text,
  venceu boolean not null,
  chance numeric not null,
  efeito_atacante jsonb not null,
  efeito_defensor jsonb not null,
  aplicado_atacante boolean not null default false,
  aplicado_defensor boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists gs_ataques_defensor_idx on public.gs_ataques (defensor, criado_em desc);
create index if not exists gs_ataques_atacante_idx on public.gs_ataques (atacante, defensor, criado_em desc);

-- Seguranca (RLS)
alter table public.gs_jogadores enable row level security;
alter table public.gs_saves enable row level security;
alter table public.gs_ataques enable row level security;

drop policy if exists "gs_jogadores_ler" on public.gs_jogadores;
create policy "gs_jogadores_ler" on public.gs_jogadores for select to authenticated using (true);
drop policy if exists "gs_jogadores_inserir" on public.gs_jogadores;
create policy "gs_jogadores_inserir" on public.gs_jogadores for insert to authenticated with check (id = auth.uid());
drop policy if exists "gs_jogadores_atualizar" on public.gs_jogadores;
create policy "gs_jogadores_atualizar" on public.gs_jogadores for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "gs_saves_dono" on public.gs_saves;
create policy "gs_saves_dono" on public.gs_saves for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ataques: cada um le os seus; ninguem insere pelo app (so o servidor, com a chave service_role)
drop policy if exists "gs_ataques_ler" on public.gs_ataques;
create policy "gs_ataques_ler" on public.gs_ataques for select to authenticated using (atacante = auth.uid() or defensor = auth.uid());

-- marca o efeito de um ataque como aplicado no aparelho de quem chamou (sem poder mexer no resto)
create or replace function public.gs_marcar_ataque_aplicado(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.gs_ataques set aplicado_atacante = true where id = p_id and atacante = auth.uid();
  update public.gs_ataques set aplicado_defensor = true where id = p_id and defensor = auth.uid();
$$;
grant execute on function public.gs_marcar_ataque_aplicado(uuid) to authenticated;

-- tempo real: o defensor recebe o ataque na hora
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'gs_ataques') then
    alter publication supabase_realtime add table public.gs_ataques;
  end if;
end $$;
