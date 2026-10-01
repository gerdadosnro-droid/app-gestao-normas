-- Rode no SQL Editor do Supabase. Seguro para rodar mais de uma vez.

create table if not exists public.normas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null,
  titulo text,
  revisao text,
  local_arquivo text,
  data_aquisicao date,
  ultima_verificacao date,
  carimbo_copia_controlada boolean not null default true,
  estado_fisico text not null default 'boa' check (estado_fisico in ('boa','rasurada')),
  verificado_por text,
  observacoes text,
  baixada_em timestamptz,          -- baixa (obsoleta/substituída) em vez de excluir
  motivo_baixa text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
-- Se a tabela já existia (versão antiga):
alter table public.normas add column if not exists baixada_em timestamptz;
alter table public.normas add column if not exists motivo_baixa text;

-- Não permite a mesma norma+revisão duas vezes entre as ativas
create unique index if not exists normas_codigo_revisao_uk
  on public.normas (lower(codigo), coalesce(lower(revisao), '')) where baixada_em is null;

-- Histórico de tudo que mudou (quem, quando, antes/depois)
create table if not exists public.normas_historico (
  id bigserial primary key,
  norma_id uuid,
  operacao text not null,
  dados_antes jsonb,
  dados_depois jsonb,
  usuario text,
  em timestamptz not null default now()
);

create or replace function public.normas_before() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create or replace function public.normas_log() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into normas_historico (norma_id, operacao, dados_antes, dados_depois, usuario)
  values (coalesce(new.id, old.id), tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end,
          auth.jwt() ->> 'email');
  return coalesce(new, old);
end $$;

drop trigger if exists trg_normas_before on public.normas;
create trigger trg_normas_before before update on public.normas
  for each row execute function public.normas_before();
drop trigger if exists trg_normas_log on public.normas;
create trigger trg_normas_log after insert or update or delete on public.normas
  for each row execute function public.normas_log();

-- Segurança: só usuários logados; ninguém apaga pelo app
alter table public.normas enable row level security;
alter table public.normas_historico enable row level security;
drop policy if exists "acesso interno" on public.normas;
drop policy if exists normas_select on public.normas;
drop policy if exists normas_insert on public.normas;
drop policy if exists normas_update on public.normas;
drop policy if exists historico_select on public.normas_historico;
create policy normas_select on public.normas for select to authenticated using (true);
create policy normas_insert on public.normas for insert to authenticated with check (true);
create policy normas_update on public.normas for update to authenticated using (true) with check (true);
create policy historico_select on public.normas_historico for select to authenticated using (true);

-- Atualização em tempo real
do $$ begin
  alter publication supabase_realtime add table public.normas;
exception when duplicate_object then null; end $$;
