// Formatos compartilhados entre API, admin e páginas.

export type ProductKind = 'product' | 'kit';

/** Formato entregue às páginas públicas (compatível com as APIs antigas baseadas em arquivos). */
export interface PublicItem {
	name: string;
	price: string; // "99,90"
	priceFrom: string | 0; // "139,90" ou 0
	isDePor: 'DE POR' | false;
	notes: string;
}

export interface PublicProduct {
	id: string;
	name: string;
	price: string;
	priceFrom: string | 0;
	url: string;
	category: string | null;
	categoryPosition: number;
	notes: string;
	items: PublicItem[];
	isDePor: 'DE POR' | false;
}

// ---- Admin

export interface AdminCollection {
	id: string;
	slug: string;
	name: string;
	active: boolean;
	position: number;
}

export interface AdminCategory {
	id: string;
	collectionId: string;
	name: string;
	position: number;
}

export interface AdminLink {
	collectionId: string;
	categoryId: string | null;
	price: number | null;
	priceFrom: number | null;
	active: boolean;
}

export interface AdminProduct {
	id: string;
	kind: ProductKind;
	name: string;
	notes: string;
	price: number | null;
	priceFrom: number | null;
	imagePath: string | null;
	imageUrl: string;
	active: boolean;
	links: AdminLink[];
	/** Ids dos produtos do kit, em ordem. */
	items: string[];
}
