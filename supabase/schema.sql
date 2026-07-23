-- Execute este arquivo no SQL Editor do Supabase.
-- Ele cria convidados, presentes e funções RPC seguras para o site público.

create extension if not exists unaccent with schema extensions;

create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  first_name text not null,
  normalized_name text not null unique,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint guests_full_name_length check (char_length(full_name) between 2 and 120)
);

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  image_url text not null,
  purchase_url text,
  active boolean not null default true,
  chosen_by uuid references public.guests(id) on delete set null,
  chosen_at timestamptz,
  notification_sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.gifts add column if not exists notification_sent_at timestamptz;

create index if not exists gifts_active_chosen_idx on public.gifts(active, chosen_by);

alter table public.guests enable row level security;
alter table public.gifts enable row level security;

-- Nenhuma tabela é acessada diretamente pelo navegador.
revoke all on table public.guests from anon, authenticated;
revoke all on table public.gifts from anon, authenticated;

create or replace function public.enter_wedding(p_full_name text)
returns table (
  guest_id uuid,
  first_name text,
  full_name text,
  confirmed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clean text;
  v_normalized text;
  v_first_name text;
begin
  v_clean := regexp_replace(trim(coalesce(p_full_name, '')), '\s+', ' ', 'g');

  if char_length(v_clean) < 2 or char_length(v_clean) > 120 then
    raise exception 'Nome inválido';
  end if;

  v_normalized := lower(extensions.unaccent(v_clean));
  v_first_name := split_part(v_clean, ' ', 1);

  insert into public.guests (full_name, first_name, normalized_name)
  values (v_clean, v_first_name, v_normalized)
  on conflict (normalized_name)
  do update set last_seen_at = now();

  return query
  select g.id, g.first_name, g.full_name, g.confirmed
  from public.guests g
  where g.normalized_name = v_normalized;
end;
$$;

create or replace function public.confirm_presence(p_guest_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_rows integer;
begin
  update public.guests
  set confirmed = true,
      confirmed_at = coalesce(confirmed_at, now()),
      last_seen_at = now()
  where id = p_guest_id;

  get diagnostics v_rows = row_count;
  return v_rows = 1;
end;
$$;

drop function if exists public.list_public_gifts();

create function public.list_public_gifts()
returns table (
  gift_id uuid,
  name text,
  description text,
  price_cents integer,
  image_url text,
  is_chosen boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    g.id,
    g.name,
    g.description,
    g.price_cents,
    g.image_url,
    (g.chosen_by is not null) as is_chosen
  from public.gifts g
  where g.active = true
  order by g.created_at, g.name;
$$;

create or replace function public.choose_gift(p_gift_id uuid, p_guest_id uuid)
returns table (
  success boolean,
  gift_name text,
  purchase_url text,
  reason text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gift public.gifts%rowtype;
  v_existing_name text;
begin
  if not exists (select 1 from public.guests where id = p_guest_id) then
    return query select false, null::text, null::text, 'guest_not_found'::text;
    return;
  end if;

  -- UPDATE condicional atômico: somente uma pessoa consegue reservar o item.
  update public.gifts
  set chosen_by = p_guest_id,
      chosen_at = now()
  where id = p_gift_id
    and active = true
    and chosen_by is null
  returning * into v_gift;

  if not found then
    select g.name into v_existing_name
    from public.gifts g
    where g.id = p_gift_id;

    return query
    select false, v_existing_name, null::text, 'already_chosen'::text;
    return;
  end if;

  return query
  select true, v_gift.name, v_gift.purchase_url, null::text;
end;
$$;

revoke all on function public.enter_wedding(text) from public;
revoke all on function public.confirm_presence(uuid) from public;
revoke all on function public.list_public_gifts() from public;
revoke all on function public.choose_gift(uuid, uuid) from public;

grant execute on function public.enter_wedding(text) to anon, authenticated;
grant execute on function public.confirm_presence(uuid) to anon, authenticated;
grant execute on function public.list_public_gifts() to anon, authenticated;
grant execute on function public.choose_gift(uuid, uuid) to anon, authenticated;

insert into public.gifts (name, description, price_cents, image_url, purchase_url)
values
  ('Air Fryer 5L', 'Para deixar as refeições do novo lar mais práticas e saborosas.', 49990, './assets/gifts/air-fryer.svg', 'https://www.amazon.com.br/s?k=air+fryer+5l'),
  ('Jogo de Panelas', 'Um conjunto completo para os primeiros almoços em família.', 69990, './assets/gifts/panelas.svg', 'https://www.amazon.com.br/s?k=jogo+de+panelas'),
  ('Liquidificador', 'Para vitaminas, receitas e muitos cafés da manhã juntos.', 24990, './assets/gifts/liquidificador.svg', 'https://www.amazon.com.br/s?k=liquidificador'),
  ('Jogo de Cama', 'Conforto e aconchego para o quarto do casal.', 31990, './assets/gifts/jogo-de-cama.svg', 'https://www.amazon.com.br/s?k=jogo+de+cama+casal'),
  ('Cafeteira Elétrica', 'Para começar os dias com café e boas conversas.', 28990, './assets/gifts/cafeteira.svg', 'https://www.amazon.com.br/s?k=cafeteira+el%C3%A9trica'),
  ('Aparelho de Jantar', 'Para receber pessoas queridas à mesa no novo lar.', 54990, './assets/gifts/aparelho-de-jantar.svg', 'https://www.amazon.com.br/s?k=aparelho+de+jantar')
on conflict (name) do nothing;
