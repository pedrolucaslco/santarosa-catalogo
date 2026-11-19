import { NextRequest, NextResponse } from 'next/server';
import { campaign } from '@/app/roleta/_lib/campaign';
import { effectiveWeights, listPrizes, stockConfigured, toPublicPrize, type DbPrize } from '../_lib/stock';
import { getSecret, readState, readUnlock, sanitizeCampaignId } from '../_lib/state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
	const rawCampaign = req.nextUrl.searchParams.get('campaign')?.trim();

	if (!rawCampaign) {
		return NextResponse.json({ error: 'O parâmetro campaign é obrigatório.' }, { status: 400 });
	}

	const secret = getSecret();

	if (!secret) {
		return NextResponse.json({ error: 'Configuração da roleta indisponível.' }, { status: 500 });
	}

	const campaignId = sanitizeCampaignId(rawCampaign);
	const state = readState(req, campaignId, secret);
	const unlock = readUnlock(req, campaignId, secret);

	let soldOut = false;
	let prizes: DbPrize[] = [];

	if (stockConfigured() && campaignId === campaign.id) {
		try {
			prizes = await listPrizes(campaignId);
			soldOut = prizes.length > 0 && effectiveWeights(prizes).every((weight) => weight <= 0);
		} catch (error) {
			console.error('[roleta] falha ao ler o estoque', error);
		}
	}

	return NextResponse.json({
		prizes: prizes.map(toPublicPrize),
		soldOut,
		spinsUsed: state.spinsUsed,
		canSpin: !soldOut && (state.spinsUsed === 0 || Boolean(unlock)),
		lastPrize: state.lastPrize ?? null,
	});
}
