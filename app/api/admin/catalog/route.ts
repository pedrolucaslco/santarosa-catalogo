import { NextRequest } from 'next/server';
import {
	createCategory,
	createCollection,
	deleteCategory,
	deleteCollection,
	reorderCategories,
	updateCategory,
	updateCollection,
	ValidationError,
} from '@/lib/catalog/admin';
import { handleCatalog } from '../_lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Coleções e categorias. `type` escolhe a entidade: "collection" | "category".

const body = async (req: NextRequest) => ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

export async function GET(req: NextRequest) {
	return handleCatalog(req, () => undefined);
}

export async function POST(req: NextRequest) {
	const data = await body(req);

	return handleCatalog(req, async () => {
		if (data.type === 'collection') return createCollection(data);
		if (data.type === 'category') return createCategory(data);

		throw new ValidationError('Tipo inválido.');
	});
}

export async function PATCH(req: NextRequest) {
	const data = await body(req);

	return handleCatalog(req, async () => {
		if (data.type === 'collection') return updateCollection(str(data.id), data);
		if (data.type === 'category') {
			if (Array.isArray(data.order)) {
				return reorderCategories(str(data.collectionId), (data.order as unknown[]).map(str));
			}

			return updateCategory(str(data.id), data);
		}

		throw new ValidationError('Tipo inválido.');
	});
}

export async function DELETE(req: NextRequest) {
	const data = await body(req);

	return handleCatalog(req, async () => {
		if (data.type === 'collection') return deleteCollection(str(data.id));
		if (data.type === 'category') return deleteCategory(str(data.id));

		throw new ValidationError('Tipo inválido.');
	});
}
