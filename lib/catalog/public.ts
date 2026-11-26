import { eq, imageUrl, inList, select } from './db';
import { effectivePrice, formatBRL, type PricePair } from './price';
import type { PublicItem, PublicProduct } from './types';

interface CollectionRow {
	id: string;
}

interface LinkRow {
	category_id: string | null;
	price: number | null;
	price_from: number | null;
	product: {
		id: string;
		kind: 'product' | 'kit';
		name: string;
		notes: string | null;
		price: number | null;
		price_from: number | null;
		image_path: string | null;
	};
}

interface CategoryRow {
	id: string;
	name: string;
	position: number;
}

interface KitItemRow {
	kit_id: string;
	position: number;
	item: { id: string; name: string; notes: string | null; price: number | null; price_from: number | null };
}

interface ItemLinkRow {
	product_id: string;
	price: number | null;
	price_from: number | null;
}

const toNumber = (value: number | string | null): number | null =>
	value === null || value === undefined ? null : Number(value);

function toItem(name: string, notes: string | null, pair: PricePair): PublicItem {
	const price = pair.price ?? 0;
	const hasFrom = pair.priceFrom !== null && pair.priceFrom > price;

	return {
		name,
		price: formatBRL(price),
		priceFrom: hasFrom ? formatBRL(pair.priceFrom as number) : 0,
		isDePor: hasFrom ? 'DE POR' : false,
		notes: notes ?? '',
	};
}

/** Produtos ativos de uma coleção, no formato consumido pelas páginas. null = coleção inexistente/inativa. */
export async function getCollectionProducts(slug: string): Promise<PublicProduct[] | null> {
	const [collection] = await select<CollectionRow>(
		`catalog_collections?slug=${eq(slug)}&active=eq.true&select=id&limit=1`
	);

	if (!collection) return null;

	const [links, categories] = await Promise.all([
		select<LinkRow>(
			`catalog_collection_products?collection_id=${eq(collection.id)}&active=eq.true` +
				`&select=category_id,price,price_from,product:catalog_products!inner(id,kind,name,notes,price,price_from,image_path)` +
				`&product.active=eq.true&limit=5000`
		),
		select<CategoryRow>(`catalog_categories?collection_id=${eq(collection.id)}&select=id,name,position`),
	]);

	const categoryById = new Map(categories.map((c) => [c.id, c]));
	const kitIds = links.filter((l) => l.product.kind === 'kit').map((l) => l.product.id);

	const kitItems = kitIds.length
		? await select<KitItemRow>(
				`catalog_kit_items?kit_id=${inList(kitIds)}` +
					`&select=kit_id,position,item:catalog_products!product_id(id,name,notes,price,price_from)&order=position.asc`
			)
		: [];

	// Preço de cada componente nesta coleção (se ele também estiver vinculado a ela).
	const itemIds = Array.from(new Set(kitItems.map((k) => k.item.id)));
	const itemLinks = itemIds.length
		? await select<ItemLinkRow>(
				`catalog_collection_products?collection_id=${eq(collection.id)}&product_id=${inList(itemIds)}` +
					`&select=product_id,price,price_from`
			)
		: [];
	const itemLinkById = new Map(itemLinks.map((l) => [l.product_id, l]));

	const products: PublicProduct[] = links.map((link) => {
		const p = link.product;
		const category = link.category_id ? categoryById.get(link.category_id) : undefined;
		const own = effectivePrice(
			{ price: toNumber(p.price), priceFrom: toNumber(p.price_from) },
			{ price: toNumber(link.price), priceFrom: toNumber(link.price_from) }
		);

		let items: PublicItem[];
		let pair = own;

		if (p.kind === 'kit') {
			const components = kitItems.filter((k) => k.kit_id === p.id);

			items = components.map((k) => {
				const l = itemLinkById.get(k.item.id);
				const pairItem = effectivePrice(
					{ price: toNumber(k.item.price), priceFrom: toNumber(k.item.price_from) },
					l ? { price: toNumber(l.price), priceFrom: toNumber(l.price_from) } : null
				);

				return toItem(k.item.name, k.item.notes, pairItem);
			});

			// Kit sem preço próprio: soma dos itens (e "de" só se todos tiverem "de").
			if (own.price === null) {
				const sum = items.reduce((acc, i) => acc + parseFloat(i.price.replace(',', '.')), 0);
				const allFrom = items.length > 0 && items.every((i) => i.priceFrom !== 0);
				const sumFrom = allFrom
					? items.reduce((acc, i) => acc + parseFloat(String(i.priceFrom).replace(',', '.')), 0)
					: null;

				pair = { price: sum, priceFrom: sumFrom };
			}
		} else {
			items = [toItem(p.name, p.notes, pair)];
		}

		const top = toItem(p.name, p.notes, pair);

		return {
			id: p.id,
			name: p.name,
			price: top.price,
			priceFrom: top.priceFrom,
			url: imageUrl(p.image_path),
			category: category?.name ?? null,
			categoryPosition: category?.position ?? 9999,
			notes: p.notes ?? '',
			items,
			isDePor: top.isDePor,
		};
	});

	const value = (p: PublicProduct) => parseFloat(p.price.replace(',', '.')) || 0;

	// Mesma ordenação de hoje: preço crescente, depois nome.
	products.sort((a, b) => value(a) - value(b) || a.name.localeCompare(b.name));

	return products;
}
