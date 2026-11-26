import { NextResponse } from 'next/server';
import { catalogConfigured } from '@/lib/catalog/db';
import { getCollectionProducts } from '@/lib/catalog/public';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
	if (!catalogConfigured()) {
		return NextResponse.json({ error: 'Supabase não configurado.' }, { status: 503 });
	}

	try {
		const products = await getCollectionProducts(params.slug);

		if (products === null) return NextResponse.json({ error: 'Coleção não encontrada.' }, { status: 404 });

		return NextResponse.json(products, {
			headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300' },
		});
	} catch (error) {
		console.error('[catalog] erro ao listar produtos', error);

		return NextResponse.json({ error: 'Erro ao ler produtos.' }, { status: 500 });
	}
}
