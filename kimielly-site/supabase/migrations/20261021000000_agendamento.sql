-- ============================================================================
--  Agendamento online — Kimiélly Wegner
--  Tabelas, regras anti-conflito, funções de disponibilidade e RLS.
--
--  Modelo de segurança:
--   * RLS ligado em todas as tabelas, SEM políticas para anon/authenticated:
--     o navegador não lê nem grava nada diretamente.
--   * O site acessa o banco somente pelas rotas /api do Next.js, usando a
--     service role key (variável de ambiente do servidor).
--   * As funções de reserva só podem ser executadas pelo service_role.
--   * Conflitos são impedidos pelo próprio banco (restrição EXCLUDE), mesmo com
--     duas solicitações chegando no mesmo instante.
-- ============================================================================

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
--  Configurações gerais (linha única)
-- ---------------------------------------------------------------------------
create table public.booking_settings (
  id                    boolean primary key default true check (id),
  timezone              text    not null default 'America/Sao_Paulo',
  slot_interval_minutes int     not null default 30  check (slot_interval_minutes between 5 and 240),
  min_notice_minutes    int     not null default 120 check (min_notice_minutes >= 0),
  max_days_ahead        int     not null default 60  check (max_days_ahead between 1 and 365),
  requires_approval     boolean not null default true,
  max_pending_per_phone int     not null default 3   check (max_pending_per_phone >= 1),
  updated_at            timestamptz not null default now()
);

insert into public.booking_settings (id) values (true);

comment on table public.booking_settings is
  'Regras da agenda: intervalo entre horários, antecedência mínima, janela de dias e aprovação manual.';

-- ---------------------------------------------------------------------------
--  Serviços (espelho dos serviços de src/config/site.ts — use npm run sync:services)
-- ---------------------------------------------------------------------------
create table public.services (
  id               text primary key check (id ~ '^[a-z0-9-]+$'),
  name             text not null,
  duration_minutes int  not null check (duration_minutes between 5 and 600),
  buffer_minutes   int  not null default 0 check (buffer_minutes between 0 and 240),
  active           boolean not null default true,
  sort_order       int  not null default 0,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
--  Horário de funcionamento (0 = domingo … 6 = sábado). Vários intervalos
--  por dia são permitidos (ex.: manhã e tarde, com pausa para almoço).
-- ---------------------------------------------------------------------------
create table public.business_hours (
  id         bigint generated always as identity primary key,
  weekday    smallint not null check (weekday between 0 and 6),
  opens_at   time not null,
  closes_at  time not null,
  check (closes_at > opens_at)
);

create index business_hours_weekday_idx on public.business_hours (weekday);

-- ---------------------------------------------------------------------------
--  Bloqueios de agenda (folgas, feriados, compromissos externos)
-- ---------------------------------------------------------------------------
create table public.time_off (
  id         bigint generated always as identity primary key,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index time_off_range_idx on public.time_off using gist (tstzrange(starts_at, ends_at, '[)'));

-- ---------------------------------------------------------------------------
--  Solicitações de agendamento
-- ---------------------------------------------------------------------------
create type public.booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled');

create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  service_id    text not null references public.services (id) on update cascade,
  service_name  text not null,
  client_name   text not null check (char_length(client_name) between 3 and 120),
  client_phone  text not null check (client_phone ~ '^[0-9]{10,13}$'),
  notes         text check (notes is null or char_length(notes) <= 500),
  starts_at     timestamptz not null,
  -- fim do atendimento + intervalo de preparo (é o período bloqueado na agenda)
  blocks_until  timestamptz not null,
  status        public.booking_status not null default 'pending',
  consent_at    timestamptz not null,
  ip_hash       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (blocks_until > starts_at),
  -- Impede dois atendimentos ativos sobrepostos — garantido pelo banco,
  -- inclusive para requisições simultâneas.
  constraint bookings_no_overlap exclude using gist (
    tstzrange(starts_at, blocks_until, '[)') with &&
  ) where (status in ('pending', 'confirmed'))
);

create index bookings_starts_at_idx on public.bookings (starts_at);
create index bookings_phone_idx on public.bookings (client_phone);

comment on column public.bookings.status is
  'pending = aguardando confirmação; confirmed = confirmado pela profissional; declined = recusado; cancelled = cancelado.';

-- updated_at automático
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.booking_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
--  RLS: tudo fechado para o público. Apenas service_role (servidor) acessa.
-- ---------------------------------------------------------------------------
alter table public.booking_settings enable row level security;
alter table public.services         enable row level security;
alter table public.business_hours   enable row level security;
alter table public.time_off         enable row level security;
alter table public.bookings         enable row level security;

revoke all on public.booking_settings, public.services, public.business_hours,
              public.time_off, public.bookings from anon, authenticated;

-- ---------------------------------------------------------------------------
--  Código curto e legível para a cliente (ex.: KW-7F3A2C)
-- ---------------------------------------------------------------------------
create or replace function public.generate_booking_code()
returns text
language plpgsql
set search_path = ''
as $$
declare
  alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- sem 0/O, 1/I
  resultado text;
  i int;
begin
  loop
    resultado := 'KW-';
    for i in 1..6 loop
      resultado := resultado || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.bookings b where b.code = resultado);
  end loop;
  return resultado;
end;
$$;

-- ---------------------------------------------------------------------------
--  Horários livres de um serviço em uma data (no fuso da profissional)
-- ---------------------------------------------------------------------------
create or replace function public.get_available_slots(p_service_id text, p_date date)
returns table (slot_start timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  cfg   public.booking_settings%rowtype;
  svc   public.services%rowtype;
  hoje  date;
begin
  select * into cfg from public.booking_settings where id;
  select * into svc from public.services where id = p_service_id and active;
  if not found then
    return;
  end if;

  hoje := (now() at time zone cfg.timezone)::date;
  if p_date < hoje or p_date > hoje + cfg.max_days_ahead then
    return;
  end if;

  return query
  with janelas as (
    select (p_date + bh.opens_at)  at time zone cfg.timezone as abre,
           (p_date + bh.closes_at) at time zone cfg.timezone as fecha
      from public.business_hours bh
     where bh.weekday = extract(dow from p_date)::int
  ),
  candidatos as (
    select gs as inicio
      from janelas j,
           generate_series(
             j.abre,
             j.fecha - make_interval(mins => svc.duration_minutes),
             make_interval(mins => cfg.slot_interval_minutes)
           ) gs
  )
  select c.inicio
    from candidatos c
   where c.inicio >= now() + make_interval(mins => cfg.min_notice_minutes)
     and not exists (
       select 1 from public.bookings b
        where b.status in ('pending', 'confirmed')
          and tstzrange(b.starts_at, b.blocks_until, '[)')
              && tstzrange(c.inicio, c.inicio + make_interval(mins => svc.duration_minutes + svc.buffer_minutes), '[)')
     )
     and not exists (
       select 1 from public.time_off t
        where tstzrange(t.starts_at, t.ends_at, '[)')
              && tstzrange(c.inicio, c.inicio + make_interval(mins => svc.duration_minutes), '[)')
     )
   order by c.inicio;
end;
$$;

-- ---------------------------------------------------------------------------
--  Resumo do mês: quantos horários livres há em cada dia
-- ---------------------------------------------------------------------------
create or replace function public.get_month_availability(p_service_id text, p_month date)
returns table (day date, free_slots int)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  d date;
  inicio date := date_trunc('month', p_month)::date;
begin
  for d in select generate_series(inicio, (inicio + interval '1 month' - interval '1 day')::date, interval '1 day')::date
  loop
    day := d;
    select count(*)::int into free_slots from public.get_available_slots(p_service_id, d);
    return next;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
--  Criação da reserva — valida tudo no servidor e trata concorrência
-- ---------------------------------------------------------------------------
create or replace function public.create_booking(
  p_service_id text,
  p_starts_at  timestamptz,
  p_name       text,
  p_phone      text,
  p_notes      text,
  p_ip_hash    text default null
)
returns table (id uuid, code text, status public.booking_status, starts_at timestamptz, service_name text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  cfg      public.booking_settings%rowtype;
  svc      public.services%rowtype;
  data_loc date;
  pend     int;
  nova     public.bookings%rowtype;
begin
  select * into cfg from public.booking_settings where booking_settings.id;
  select * into svc from public.services s where s.id = p_service_id and s.active;
  if not found then
    raise exception 'SERVICE_UNAVAILABLE' using errcode = 'P0001';
  end if;

  if p_phone !~ '^[0-9]{10,13}$' then
    raise exception 'INVALID_PHONE' using errcode = 'P0001';
  end if;

  -- Limite de solicitações em aberto por telefone (anti-spam)
  select count(*) into pend
    from public.bookings b
   where b.client_phone = p_phone
     and b.status = 'pending'
     and b.starts_at > now();
  if pend >= cfg.max_pending_per_phone then
    raise exception 'TOO_MANY_PENDING' using errcode = 'P0001';
  end if;

  -- O horário precisa estar entre os horários livres calculados agora
  data_loc := (p_starts_at at time zone cfg.timezone)::date;
  if not exists (
    select 1 from public.get_available_slots(p_service_id, data_loc) s where s.slot_start = p_starts_at
  ) then
    raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end if;

  begin
    insert into public.bookings (
      code, service_id, service_name, client_name, client_phone, notes,
      starts_at, blocks_until, status, consent_at, ip_hash
    ) values (
      public.generate_booking_code(), svc.id, svc.name, btrim(p_name), p_phone,
      nullif(btrim(coalesce(p_notes, '')), ''),
      p_starts_at,
      p_starts_at + make_interval(mins => svc.duration_minutes + svc.buffer_minutes),
      case when cfg.requires_approval then 'pending'::public.booking_status
           else 'confirmed'::public.booking_status end,
      now(), p_ip_hash
    )
    returning * into nova;
  exception
    when exclusion_violation then
      -- outra reserva ocupou o horário no mesmo instante
      raise exception 'SLOT_UNAVAILABLE' using errcode = 'P0001';
  end;

  return query select nova.id, nova.code, nova.status, nova.starts_at, nova.service_name;
end;
$$;

-- ---------------------------------------------------------------------------
--  Consulta de status pela cliente (exige código + telefone)
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_status(p_code text, p_phone text)
returns table (code text, status public.booking_status, starts_at timestamptz, service_name text, client_first_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.code, b.status, b.starts_at, b.service_name, split_part(b.client_name, ' ', 1)
    from public.bookings b
   where b.code = upper(btrim(p_code))
     and b.client_phone = p_phone
   limit 1;
$$;

-- ---------------------------------------------------------------------------
--  Permissões das funções: somente o servidor (service_role)
-- ---------------------------------------------------------------------------
revoke all on function public.get_available_slots(text, date)          from public, anon, authenticated;
revoke all on function public.get_month_availability(text, date)       from public, anon, authenticated;
revoke all on function public.create_booking(text, timestamptz, text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_booking_status(text, text)           from public, anon, authenticated;
revoke all on function public.generate_booking_code()                  from public, anon, authenticated;

grant execute on function public.get_available_slots(text, date)        to service_role;
grant execute on function public.get_month_availability(text, date)     to service_role;
grant execute on function public.create_booking(text, timestamptz, text, text, text, text) to service_role;
grant execute on function public.get_booking_status(text, text)         to service_role;

-- ---------------------------------------------------------------------------
--  Visão prática para a profissional (Supabase → Table Editor / SQL)
-- ---------------------------------------------------------------------------
create view public.agenda_proxima
with (security_invoker = true) as
select b.code                                                    as codigo,
       to_char(b.starts_at at time zone s.timezone, 'DD/MM/YYYY') as data,
       to_char(b.starts_at at time zone s.timezone, 'HH24:MI')    as horario,
       b.service_name                                            as servico,
       b.client_name                                             as cliente,
       b.client_phone                                            as telefone,
       b.status,
       b.notes                                                   as observacoes,
       b.id
  from public.bookings b
  cross join public.booking_settings s
 where b.starts_at >= now() - interval '1 day'
   and b.status in ('pending', 'confirmed')
 order by b.starts_at;

revoke all on public.agenda_proxima from anon, authenticated;

-- ---------------------------------------------------------------------------
--  Retenção (LGPD): remove solicitações antigas. Agende com pg_cron (ver README):
--    select cron.schedule('limpar-agendamentos', '0 4 1 * *', 'select public.purge_old_bookings(12)');
-- ---------------------------------------------------------------------------
create or replace function public.purge_old_bookings(p_months int default 12)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  removidos int;
begin
  delete from public.bookings b
   where b.starts_at < now() - make_interval(months => greatest(p_months, 1));
  get diagnostics removidos = row_count;
  return removidos;
end;
$$;

revoke all on function public.purge_old_bookings(int) from public, anon, authenticated;
grant execute on function public.purge_old_bookings(int) to service_role;
