import { deleteImages, eq, imageUrl, inList, insert, patch, remove, select } from './db';
import type { AdminCategory, AdminCollection, AdminLink, AdminProduct, ProductKind } from './types';

interface CollectionRow {
	id: string;
	slug: string;
	name: string;
	active: boolean;
	position: number;
}

interface CategoryRow {
	id: string;
	collection_id: string;
	name: string;
	position: number;
}

interface ProductRow {
	id: string;
	kind: ProductKind;
	name: string;
	notes: string | null;
	price: number | string | null;
	price_from: number | string | null;
	image_path: string | null;
	active: boolean;
}

interface LinkRow {
	collection_id: string;
	product_id: string;
	category_id: string | null;
	price: number | string | null;
	price_from: number | string | null;
	active: boolean;
}

interface KitItemRow {
	kit_id: string;
	product_id: string;
	position: number;
}

const num = (v: number | string | null): number | null => (v === null || v === undefined ? null : Number(v));

export class ValidationError extends Error {}

// ------------------------------------------------------------------ leitura

export async function listCatalog(): Promise<{
	collections: AdminCollection[];
	categories: AdminCategory[];
	products: AdminProduct[];
}> {
	const [collections, categories, products, links, kitItems] = await Promise.all([
		select<CollectionRow>('catalog_collections?select=*&order=position.asc,name.asc'),
		select<CategoryRow>('catalog_categories?select=*&order=position.asc,name.asc'),
		select<ProductRow>('catalog_products?select=*&order=name.asc&limit=10000'),
		select<LinkRow>('catalog_collection_products?select=*&limit=50000'),
		select<KitItemRow>('catalog_kit_items?select=*&order=position.asc&limit=50000'),
	]);

	const linksByProduct = new Map<string, AdminLink[]>();

	for (const l of links) {
		const list = linksByProduct.get(l.product_id) ?? [];

		list.push({
			collectionId: l.collection_id,
			categoryId: l.category_id,
			price: num(l.price),
			priceFrom: num(l.price_from),
			active: l.active,
		});
		linksByProduct.set(l.product_id, list);
	}

	const itemsByKit = new Map<string, string[]>();

	for (const k of kitItems) {
		const list = itemsByKit.get(k.kit_id) ?? [];

		list.push(k.product_id);
		itemsByKit.set(k.kit_id, list);
	}

	return {
		collections: collections.map((c) => ({ id: c.id, slug: c.slug, name: c.name, active: c.active, position: c.position })),
		categories: categories.map((c) => ({
			id: c.id,
			collectionId: c.collection_id,
			name: c.name,
			position: c.position,
		})),
		products: products.map((p) => ({
			id: p.id,
			kind: p.kind,
			name: p.name,
			notes: p.notes ?? '',
			price: num(p.price),
			priceFrom: num(p.price_from),
			imagePath: p.image_path,
			imageUrl: imageUrl(p.image_path),
			active: p.active,
			links: linksByProduct.get(p.id) ?? [],
			items: itemsByKit.get(p.id) ?? [],
		})),
	};
}

// ------------------------------------------------------------------ produtos

export interface ProductInput {
	kind: ProductKind;
	name: string;
	notes: string;
	price: number | null;
	priceFrom: number | null;
	active: boolean;
	imagePath: string | null;
	links: AdminLink[];
	items: string[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_PATH = /^[A-Za-z0-9._-]{1,120}$/;

function money(value: unknown, label: string): number | null {
	if (value === null || value === undefined || value === '') return null;

	const n = Number(value);

	if (!Number.isFinite(n) || n < 0 || n > 1_000_000) throw new ValidationError(`${label} inválido.`);

	return Math.round(n * 100) / 100;
}

function checkPair(price: number | null, priceFrom: number | null, label: string) {
	if (priceFrom !== null && (price === null || priceFrom <= price)) {
		throw new ValidationError(`${label}: o preço "de" precisa ser maior que o preço "por".`);
	}
}

export function parseProductInput(raw: unknown): ProductInput {
	if (!raw || typeof raw !== 'object') throw new ValidationError('Dados inválidos.');

	const d = raw as Record<string, unknown>;
	const kind: ProductKind = d.kind === 'kit' ? 'kit' : 'product';
	const name = typeof d.name === 'string' ? d.name.trim() : '';
	const notes = typeof d.notes === 'string' ? d.notes.trim() : '';

	if (!name || name.length > 140) throw new ValidationError('Nome obrigatório (até 140 caracteres).');
	if (notes.length > 200) throw new ValidationError('Observações muito longas (máx. 200).');

	const price = money(d.price, 'Preço');
	const priceFrom = money(d.priceFrom, 'Preço "de"');

	if (kind === 'product' && price === null) throw new ValidationError('Informe o preço do produto.');
	checkPair(price, priceFrom, 'Produto');

	let imagePath: string | null = null;

	if (typeof d.imagePath === 'string' && d.imagePath) {
		if (!IMAGE_PATH.test(d.imagePath)) throw new ValidationError('Imagem inválida.');
		imagePath = d.imagePath;
	}

	const links: AdminLink[] = [];
	const seen = new Set<string>();

	for (const l of Array.isArray(d.links) ? d.links : []) {
		const link = l as Record<string, unknown>;
		const collectionId = typeof link.collectionId === 'string' ? link.collectionId : '';

		if (!UUID.test(collectionId) || seen.has(collectionId)) throw new ValidationError('Coleção inválida.');
		seen.add(collectionId);

		const categoryId = typeof link.categoryId === 'string' && link.categoryId ? link.categoryId : null;

		if (categoryId && !UUID.test(categoryId)) throw new ValidationError('Categoria inválida.');

		const linkPrice = money(link.price, 'Preço da coleção');
		const linkFrom = money(link.priceFrom, 'Preço "de" da coleção');

		if (linkPrice === null && linkFrom !== null) {
			throw new ValidationError('Preço "de" da coleção exige o preço "por" da coleção.');
		}
		checkPair(linkPrice, linkFrom, 'Coleção');

		links.push({
			collectionId,
			categoryId,
			price: linkPrice,
			priceFrom: linkFrom,
			active: link.active !== false,
		});
	}

	const items: string[] = [];

	if (kind === 'kit') {
		for (const id of Array.isArray(d.items) ? d.items : []) {
			if (typeof id !== 'string' || !UUID.test(id) || items.includes(id)) throw new ValidationError('Itens do kit inválidos.');
			items.push(id);
		}

		if (items.length < 2) throw new ValidationError('Um kit precisa de pelo menos 2 produtos.');
	}

	return { kind, name, notes, price, priceFrom, active: d.active !== false, imagePath, links, items };
}

async function assertKitItems(items: string[], selfId?: string) {
	if (items.length === 0) return;
	if (selfId && items.includes(selfId)) throw new ValidationError('Um kit não pode conter a si mesmo.');

	const rows = await select<{ id: string; kind: ProductKind }>(
		`catalog_products?id=${inList(items)}&select=id,kind`
	);

	if (rows.length !== items.length) throw new ValidationError('Algum produto do kit não existe mais.');
	if (rows.some((r) => r.kind !== 'product')) throw new ValidationError('Kits só podem conter produtos (não outros kits).');
}

async function assertCategories(links: AdminLink[]) {
	const ids = links.map((l) => l.categoryId).filter((id): id is string => Boolean(id));

	if (ids.length === 0) return;

	const rows = await select<{ id: string; collection_id: string }>(
		`catalog_categories?id=${inList(ids)}&select=id,collection_id`
	);

	for (const l of links) {
		if (!l.categoryId) continue;

		const row = rows.find((r) => r.id === l.categoryId);

		if (!row || row.collection_id !== l.collectionId) {
			throw new ValidationError('A categoria não pertence à coleção escolhida.');
		}
	}
}

async function writeRelations(id: string, input: ProductInput) {
	await remove('catalog_collection_products', `product_id=${eq(id)}`);
	await remove('catalog_kit_items', `kit_id=${eq(id)}`);

	if (input.links.length) {
		await insert(
			'catalog_collection_products',
			input.links.map((l) => ({
				collection_id: l.collectionId,
				product_id: id,
				category_id: l.categoryId,
				price: l.price,
				price_from: l.price === null ? null : l.priceFrom,
				active: l.active,
			}))
		);
	}

	if (input.items.length) {
		await insert(
			'catalog_kit_items',
			input.items.map((productId, position) => ({ kit_id: id, product_id: productId, position }))
		);
	}
}

const columns = (i: ProductInput) => ({
	kind: i.kind,
	name: i.name,
	notes: i.notes || null,
	price: i.price,
	price_from: i.priceFrom,
	image_path: i.imagePath,
	active: i.active,
});

export async function createProduct(input: ProductInput): Promise<string> {
	await assertKitItems(input.items);
	await assertCategories(input.links);

	const [row] = await insert<{ id: string }>('catalog_products', columns(input));

	await writeRelations(row.id, input);

	return row.id;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
	const [current] = await select<ProductRow>(`catalog_products?id=${eq(id)}&select=*`);

	if (!current) throw new ValidationError('Produto não encontrado.');

	if (current.kind === 'product' && input.kind === 'kit') {
		const used = await select(`catalog_kit_items?product_id=${eq(id)}&select=kit_id&limit=1`);

		if (used.length) throw new ValidationError('Este produto faz parte de um kit e não pode virar kit.');
	}

	await assertKitItems(input.items, id);
	await assertCategories(input.links);
	await patch('catalog_products', `id=${eq(id)}`, columns(input));
	await writeRelations(id, input);

	if (current.image_path && current.image_path !== input.imagePath) await deleteImages([current.image_path]);
}

export async function deleteProduct(id: string): Promise<void> {
	const [current] = await select<ProductRow>(`catalog_products?id=${eq(id)}&select=*`);

	if (!current) throw new ValidationError('Produto não encontrado.');

	const kits = await select<{ kit: { name: string } }>(
		`catalog_kit_items?product_id=${eq(id)}&select=kit:catalog_products!kit_id(name)`
	);

	if (kits.length) {
		throw new ValidationError(`Este produto faz parte dos kits: ${kits.map((k) => k.kit.name).join(', ')}. Remova-o dos kits antes.`);
	}

	await remove('catalog_products', `id=${eq(id)}`);
	await deleteImages([current.image_path]);
}

// ------------------------------------------------------- coleções e categorias

function text(value: unknown, label: string, max = 60): string {
	const v = typeof value === 'string' ? value.trim() : '';

	if (!v || v.length > max) throw new ValidationError(`${label} obrigatório (até ${max} caracteres).`);

	return v;
}

export async function createCollection(raw: Record<string, unknown>): Promise<void> {
	const name = text(raw.name, 'Nome');
	const slug = text(raw.slug, 'Endereço (slug)', 40).toLowerCase();

	if (!/^[a-z0-9-]+$/.test(slug)) throw new ValidationError('Slug só pode ter letras minúsculas, números e hífen.');

	const existing = await select(`catalog_collections?slug=${eq(slug)}&select=id&limit=1`);

	if (existing.length) throw new ValidationError('Já existe uma coleção com esse slug.');

	const all = await select<{ position: number }>('catalog_collections?select=position');

	await insert('catalog_collections', { name, slug, position: Math.max(-1, ...all.map((c) => c.position)) + 1 });
}

export async function updateCollection(id: string, raw: Record<string, unknown>): Promise<void> {
	const changes: Record<string, unknown> = {};

	if (raw.name !== undefined) changes.name = text(raw.name, 'Nome');
	if (raw.active !== undefined) {
		if (typeof raw.active !== 'boolean') throw new ValidationError('Valor inválido.');
		changes.active = raw.active;
	}
	if (Object.keys(changes).length === 0) throw new ValidationError('Nada para alterar.');

	await patch('catalog_collections', `id=${eq(id)}`, changes);
}

export async function deleteCollection(id: string): Promise<void> {
	await remove('catalog_collections', `id=${eq(id)}`);
}

export async function createCategory(raw: Record<string, unknown>): Promise<void> {
	const collectionId = typeof raw.collectionId === 'string' ? raw.collectionId : '';

	if (!UUID.test(collectionId)) throw new ValidationError('Coleção inválida.');

	const name = text(raw.name, 'Nome');
	const all = await select<{ position: number }>(`catalog_categories?collection_id=${eq(collectionId)}&select=position`);

	await insert('catalog_categories', {
		collection_id: collectionId,
		name,
		position: Math.max(-1, ...all.map((c) => c.position)) + 1,
	});
}

export async function updateCategory(id: string, raw: Record<string, unknown>): Promise<void> {
	await patch('catalog_categories', `id=${eq(id)}`, { name: text(raw.name, 'Nome') });
}

export async function deleteCategory(id: string): Promise<void> {
	await remove('catalog_categories', `id=${eq(id)}`);
}

/** Define a posição das categorias de uma coleção pela ordem recebida. */
export async function reorderCategories(collectionId: string, order: string[]): Promise<void> {
	const current = await select<{ id: string }>(`catalog_categories?collection_id=${eq(collectionId)}&select=id`);

	if (order.length !== current.length || !order.every((id) => current.some((c) => c.id === id))) {
		throw new ValidationError('Ordem inválida.');
	}

	await Promise.all(order.map((id, position) => patch('catalog_categories', `id=${eq(id)}`, { position })));
}
