import { NextRequest, NextResponse } from 'next/server';
import { campaign } from '@/app/roleta/_lib/campaign';
import { listPrizes, resetAwarded } from '@/app/api/roleta/_lib/stock';
import { requireAdmin } from '../_lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Zera o contador de um prêmio (body.id) ou de todos (sem id). */
export async function POST(req: NextRequest) {
	const denied = await requireAdmin(req);
	if (denied) return denied;

	const body = await req.json().catch(() => null);
	const id = typeof body?.id === 'string' ? body.id : undefined;

	try {
		if (id) {
			const current = await listPrizes(campaign.id);

			if (!current.some((prize) => prize.id === id)) {
				return NextResponse.json({ ok: false, error: 'Prêmio não encontrado.' }, { status: 404 });
			}
		}

		await resetAwarded(campaign.id, id);

		return NextResponse.json({ ok: true, prizes: await listPrizes(campaign.id) });
	} catch (error) {
		console.error('[admin] erro ao resetar', error);

		return NextResponse.json({ ok: false, error: 'Erro ao acessar o banco.' }, { status: 500 });
	}
}
