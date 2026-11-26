-- CRUD de produtos do catálogo. Rodar no SQL Editor do Supabase. Pode rodar mais de uma vez.
--
-- Modelo:
--   catalog_collections          coleções/campanhas (catalogo, liquida, black, ...)
--   catalog_categories           categorias de cada coleção (nome + posição)
--   catalog_products             produtos e kits (kind = 'product' | 'kit')
--   catalog_kit_items            produtos que compõem um kit
--   catalog_collection_products  vínculo produto <-> coleção (categoria, preço sobreposto, ativo)
--
-- Acesso: RLS ligado e SEM policies nas tabelas => só a service role (servidor) lê/escreve.
-- As imagens ficam no bucket público "products" (leitura pública, escrita só pelo servidor).

create extension if not exists pgcrypto;

create table if not exists public.catalog_collections (
  id        uuid primary key default gen_random_uuid(),
  slug      text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name      text not null,
  active    boolean not null default true,
  position  int not null default 0
);

create table if not exists public.catalog_categories (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.catalog_collections(id) on delete cascade,
  name          text not null,
  position      int not null default 0
);
create index if not exists catalog_categories_collection_idx on public.catalog_categories (collection_id, position);

create table if not exists public.catalog_products (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null default 'product' check (kind in ('product', 'kit')),
  name        text not null,
  notes       text,
  -- Preço normal. Em kits, nulo = soma dos itens.
  price       numeric(10,2) check (price is null or price >= 0),
  -- Preço "de" (riscado). Nulo = sem promoção.
  price_from  numeric(10,2) check (price_from is null or price_from >= 0),
  image_path  text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint catalog_products_price_required check (kind = 'kit' or price is not null)
);

create table if not exists public.catalog_kit_items (
  kit_id     uuid not null references public.catalog_products(id) on delete cascade,
  product_id uuid not null references public.catalog_products(id) on delete restrict,
  position   int not null default 0,
  primary key (kit_id, product_id),
  constraint catalog_kit_items_not_self check (kit_id <> product_id)
);
create index if not exists catalog_kit_items_product_idx on public.catalog_kit_items (product_id);

create table if not exists public.catalog_collection_products (
  collection_id uuid not null references public.catalog_collections(id) on delete cascade,
  product_id    uuid not null references public.catalog_products(id) on delete cascade,
  category_id   uuid references public.catalog_categories(id) on delete set null,
  -- Sobreposição de preço nesta coleção: se `price` estiver preenchido, o PAR (price, price_from)
  -- do vínculo substitui o do produto ("de" vazio = sem "de").
  price         numeric(10,2) check (price is null or price >= 0),
  price_from    numeric(10,2) check (price_from is null or price_from >= 0),
  active        boolean not null default true,
  primary key (collection_id, product_id)
);
create index if not exists catalog_collection_products_product_idx on public.catalog_collection_products (product_id);

-- updated_at automático
create or replace function public.catalog_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalog_products_touch on public.catalog_products;
create trigger catalog_products_touch
  before update on public.catalog_products
  for each row execute function public.catalog_touch_updated_at();

alter table public.catalog_collections         enable row level security;
alter table public.catalog_categories          enable row level security;
alter table public.catalog_products            enable row level security;
alter table public.catalog_kit_items           enable row level security;
alter table public.catalog_collection_products enable row level security;
-- Sem policies: só a service role key (servidor) acessa.

-- Bucket público de imagens (leitura pública; upload/remoção só pela service role).
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

-- Coleções iniciais (idempotente).
insert into public.catalog_collections (slug, name, position) values
  ('catalogo', 'Catálogo', 0),
  ('liquida',  'Liquida',  1),
  ('black',    'Black Friday', 2)
on conflict (slug) do nothing;
