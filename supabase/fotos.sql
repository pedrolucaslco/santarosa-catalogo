-- Mais de uma foto por produto. Rodar no SQL Editor do Supabase. Pode rodar mais de uma vez.
-- image_path continua sendo a foto principal (capa); as demais ficam, em ordem, em extra_images.
alter table public.catalog_products
  add column if not exists extra_images text[] not null default '{}';
