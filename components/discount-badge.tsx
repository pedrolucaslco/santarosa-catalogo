import { getDiscountPercent } from "@/lib/discount";

type DiscountItem = {
	priceFrom?: string | number | null;
	price?: string | number | null;
};

/** Selo de desconto para ficar sobre a imagem do card (canto inferior direito). */
export function DiscountBadge({ items }: { items: DiscountItem[] }) {
	const percents = items
		.map((item) => getDiscountPercent(item.priceFrom, item.price))
		.filter((p): p is number => p !== null);
	if (percents.length === 0) return null;

	const max = Math.max(...percents);
	const label = items.length > 1 ? `até -${max}%` : `-${max}%`;

	return (
		<span className="absolute bottom-2 right-2 rounded-md bg-white px-1.5 py-0.5 text-xs font-bold leading-none text-stone-900 shadow-sm">
			{label}
		</span>
	);
}
