-- Migração do painel /admin da roleta. Rodar no SQL Editor do Supabase
-- (depois de supabase/roleta.sql). Pode rodar mais de uma vez.
alter table public.roleta_prize_stock
  add column if not exists position    int  not null default 0,
  add column if not exists label       text,
  add column if not exists description text,
  add column if not exists color       text,
  add column if not exists text_color  text,
  add column if not exists is_win      boolean not null default true,
  add column if not exists weight      int  not null default 10;

-- max_count nulo = prêmio ilimitado.
alter table public.roleta_prize_stock alter column max_count drop not null;
