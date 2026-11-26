# Plano: CRUD de produtos no admin (Supabase)

Status: **etapas 1–4 implementadas (não commitadas); falta rodar o SQL, importar e validar (etapa 5).** Decisões marcadas com ✅ já foram alinhadas; as marcadas com ❓ estão em aberto.

## Objetivo

Trocar a leitura de pastas/nomes de arquivo (`public/products`, `public/liquida`, `public/black`) por dados no Supabase, gerenciados por um CRUD no `/admin`. Hoje: 306 produtos no catálogo, 42 na liquida, 83 na black (~33 MB de imagens).

## Decisões já alinhadas ✅

1. **Imagens no Supabase Storage**, com upload pelo admin e **otimização no navegador** antes de enviar (redimensiona/comprime), sem dependência nova no servidor.
2. **Uma tabela de produtos + coleções** (`catalogo`, `liquida`, `black`, e as próximas). Criar campanha nova = cadastro, sem API nova.
3. **Cada produto é um item.** **Kits** juntam 2+ produtos num card só, com **foto própria** e **preço = soma dos produtos** (com preço de kit manual opcional).
4. **Um produto pode estar em várias coleções**, com **preço sobreposto por coleção**; sem sobreposição usa o preço normal do produto.
5. **Categorias por coleção**, com nome e posição próprios (some o "3." do nome).
6. Campos: nome, preço, preço "de", **ativo/oculto**, **observações** (opções/cores) e foto.
7. **Ordenação** continua por preço (menor → maior) dentro da categoria. Ordem manual fica para depois.
8. **Preço por coleção substitui o par inteiro** (preço "por" + preço "de"); "de" vazio no vínculo = sem "de".
9. **Observações aparecem no card**, em texto pequeno abaixo do nome.
10. **Importação com relatório**: o padrão é importar tudo separado; possíveis duplicados vão para o relatório e só são juntados os que você confirmar.
11. **Depois de validado, as imagens de `public/products`, `liquida` e `black` saem do repositório** (o histórico do git preserva).

## Modelo de dados (proposta)

```
collections          id, slug (unique), name, active, position
categories           id, collection_id → collections, name, position
products             id (uuid), kind ('product'|'kit'), name, notes,
                     price numeric, price_from numeric null,
                     image_path null, active, created_at, updated_at
kit_items            kit_id → products, product_id → products, position
collection_products  collection_id, product_id, category_id,
                     price null, price_from null,   -- sobreposição por coleção
                     active                          -- ocultar só nesta coleção
                     primary key (collection_id, product_id)
```

- Kit é uma linha em `products` com `kind = 'kit'`; assim vínculo a coleções, categoria, sobreposição de preço e ativo/oculto funcionam igual ao produto.
- `image_path` é opcional: produtos que só existem como componente de kit podem não ter foto.
- RLS ligado e **sem policies** (só a service role, no servidor), como a roleta. O bucket de imagens é público para leitura.
- SQL em `supabase/produtos.sql`, no mesmo formato dos outros.

### Regra de preço efetivo ✅

Para um produto numa coleção:
- Se `collection_products.price` estiver preenchido → usa `price` e `price_from` **do vínculo** (o par inteiro é sobreposto; `price_from` vazio = sem "de").
- Senão → usa `price` e `price_from` do produto.
- Kit: se não houver preço manual (no kit ou no vínculo), `price` = soma dos preços efetivos dos itens naquela coleção.

## API pública

- Um endpoint único `GET /api/collections/[slug]/products`, devolvendo o **mesmo formato de hoje** (`id, name, price, priceFrom, url, category, items, isDePor`). As páginas só trocam a URL do `fetch`.
- Só devolve produtos/vínculos ativos, categorias ordenadas por `position` e produtos por preço.
- `url` da imagem aponta para o Storage.
- Depois de validado, remover `/api/products`, `/api/liquida-products`, `/api/black-products` (e checar o `/api/gallery`).

## Admin

Novas seções no `AdminShell` (que já tem login e estrutura de seções):

1. **Produtos**: lista com miniatura, busca, filtro por coleção/categoria/ativo; criar/editar (nome, observações, preço, preço "de", foto com upload otimizado, ativo, vínculos com coleções + categoria + preço sobreposto); criar/editar **kits** (escolher produtos, foto própria); excluir com confirmação (remove a foto do Storage).
2. **Coleções e categorias**: criar/renomear coleções, criar/renomear/reordenar categorias.

Rotas em `/api/admin/...`, protegidas pelo `auth.ts` que já existe (Supabase Auth, `app_metadata.role = admin`).

## Migração dos dados atuais

Script único `scripts/import-products` (com `--dry-run` primeiro):

1. Lê as 3 pastas e reaproveita o parser atual de nome de arquivo.
2. Cria coleções (`catalogo`, `liquida`, `black`) e categorias (nome sem prefixo numérico; posição pelo número).
3. Sobe as imagens para o Storage e cria produtos e vínculos.
4. Os 4 itens com vários nomes no catálogo (ex.: Pulseira Baiana + Bolinhas) viram **kits**, e cada item vira um produto sem foto.
5. Texto entre parênteses no nome do arquivo (ex.: "Disponível letra B e E") vai para **observações**.
6. Mostra um relatório (duplicados, nomes estranhos, 2 arquivos que hoje a API ignora) antes de gravar.

## Etapas de execução

1. SQL (`supabase/produtos.sql`) + bucket de Storage.
2. Script de importação (dry-run → revisão → importar).
3. API pública nova + páginas lendo dela (pastas continuam no repo como fallback).
4. CRUD no admin: coleções/categorias, produtos, kits, upload.
5. Validação lado a lado; depois remover APIs antigas e (se quiser) as imagens de `public/`.

## Decisões finais ✅

- Textos/banner/datas de cada campanha continuam no código.
- Senha de acesso agora é gerenciada no admin (seção **Acesso**): senha única (hash scrypt) + liga/desliga por coleção. `supabase/acesso.sql` cria `catalog_access` e `catalog_collections.locked`. `LIQUIDA_PASSWORD` só vale como transição, enquanto nenhuma senha estiver definida no banco; `LIQUIDA_LOCKED` só vale sem Supabase configurado.
- `/api/gallery` e a seção "galeria" da página principal saem na limpeza final.

## Como rodar (etapa 5)

1. SQL Editor do Supabase: rodar `supabase/produtos.sql` (cria tabelas, RLS, bucket `products` e as 3 coleções).
2. `node scripts/import-products.mjs` (dry-run, só relatório) → revisar → `node scripts/import-products.mjs --apply`.
3. Conferir `/admin` (Produtos, Coleções) e as páginas `/`, `/liquida`, `/black` (já leem da API nova, com fallback nas pastas se o banco estiver vazio).
4. Limpeza (só depois de validar): remover `/api/products`, `/api/liquida-products`, `/api/black-products`, `/api/gallery` + seção galeria, e as imagens de `public/products`, `public/liquida`, `public/black`.
