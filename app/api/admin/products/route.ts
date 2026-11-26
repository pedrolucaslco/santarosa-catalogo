import { NextRequest } from 'next/server';
import { createProduct, deleteProduct, parseProductInput, updateProduct, ValidationError } from '@/lib/catalog/admin';
import { handleCatalog } from '../_lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const body = async (req: NextRequest) => ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;

export async function POST(req: NextRequest) {
	const data = await body(req);

	return handleCatalog(req, async () => {
		await createProduct(parseProductInput(data.product));
	});
}

export async function PATCH(req: NextRequest) {
	const data = await body(req);

	return handleCatalog(req, async () => {
		if (typeof data.id !== 'string') throw new ValidationError('Produto inválido.');

		await updateProduct(data.id, parseProductInput(data.product));
	});
}

export async function DELETE(req: NextRequest) {
	const data = await body(req);

	return handleCatalog(req, async () => {
		if (typeof data.id !== 'string') throw new ValidationError('Produto inválido.');

		await deleteProduct(data.id);
	});
}
