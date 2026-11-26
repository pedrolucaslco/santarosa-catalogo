export interface PricePair {
	price: number | null;
	priceFrom: number | null;
}

/** Regra de preço por coleção: se o vínculo tem preço, o PAR (por, de) do vínculo substitui o do produto. */
export function effectivePrice(product: PricePair, link?: PricePair | null): PricePair {
	if (link && link.price !== null) return { price: link.price, priceFrom: link.priceFrom };

	return { price: product.price, priceFrom: product.priceFrom };
}

/** 99.9 -> "99,90" */
export function formatBRL(value: number): string {
	return value.toFixed(2).replace('.', ',');
}

/** "1.299,90" | "99,90" | "99.9" -> number | null */
export function parseBRL(value: string | number | null | undefined): number | null {
	if (value === null || value === undefined || value === '') return null;
	if (typeof value === 'number') return Number.isFinite(value) ? value : null;

	const text = value.trim().replace(/[^\d,.-]/g, '');
	const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
	const n = parseFloat(normalized);

	return Number.isFinite(n) ? n : null;
}
