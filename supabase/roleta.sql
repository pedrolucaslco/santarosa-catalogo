-- Estoque de prêmios da roleta. Rodar no SQL Editor do Supabase.
create table if not exists public.roleta_prize_stock (
  campaign_id text not null,
  prize_id    text not null,
  max_count   int  not null check (max_count >= 0),
  awarded     int  not null default 0 check (awarded >= 0),
  primary key (campaign_id, prize_id)
);

alter table public.roleta_prize_stock enable row level security;
-- Sem policies: só a service role key (servidor) acessa.

-- Reserva 1 unidade de forma atômica. Retorna true se ainda havia estoque.
create or replace function public.roleta_claim(p_campaign text, p_prize text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  update public.roleta_prize_stock
     set awarded = awarded + 1
   where campaign_id = p_campaign
     and prize_id = p_prize
     and awarded < max_count;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.roleta_claim(text, text) from public, anon, authenticated;
