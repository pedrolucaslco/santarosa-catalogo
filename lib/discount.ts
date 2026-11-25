function parseBRL(value: string | number | null | undefined): number {
	if (typeof value === "number") return value;
	if (!value) return NaN;
	return parseFloat(String(value).replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."));
}

/** Percentual de desconto (inteiro) entre o preço "De" e o "Por". Retorna null se não houver desconto válido. */
export function getDiscountPercent(
	priceFrom: string | number | null | undefined,
	price: string | number | null | undefined,
): number | null {
	const from = parseBRL(priceFrom);
	const to = parseBRL(price);
	if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0 || to >= from) return null;
	const percent = Math.round((1 - to / from) * 100);
	return percent >= 1 ? percent : null;
}
