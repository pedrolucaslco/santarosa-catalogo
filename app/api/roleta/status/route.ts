import { NextRequest, NextResponse } from 'next/server';
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

	return NextResponse.json({
		spinsUsed: state.spinsUsed,
		canSpin: state.spinsUsed === 0 || Boolean(unlock),
		lastPrize: state.lastPrize ?? null,
	});
}
