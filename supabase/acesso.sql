-- Senha e bloqueio das páginas de campanha (/liquida, /black, ...), gerenciados pelo /admin.
-- Rodar no SQL Editor do Supabase. Pode rodar mais de uma vez.

-- Por coleção: protegida por senha ou pública. Na primeira execução, liquida e black ficam
-- protegidas (comportamento atual); depois disso o admin é quem manda.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'catalog_collections' and column_name = 'locked'
  ) then
    alter table public.catalog_collections add column locked boolean not null default false;
    update public.catalog_collections set locked = true where slug in ('liquida', 'black');
  end if;
end $$;

-- Linha única com a senha (hash scrypt, nunca em texto puro) e a "versão" que invalida
-- os acessos já liberados quando a senha muda.
create table if not exists public.catalog_access (
  id            boolean primary key default true check (id),
  password_hash text,
  version       text not null default gen_random_uuid()::text
);
insert into public.catalog_access (id) values (true) on conflict (id) do nothing;

alter table public.catalog_access enable row level security;
-- Sem policies: só a service role (servidor) acessa.
