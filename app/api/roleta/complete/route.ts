import { randomInt } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { campaign } from '@/app/roleta/_lib/campaign';
import { isCampaignExpired, pickPrize, type StoredPrize } from '@/app/roleta/_lib/roulette';
import {
	clearUnlockCookie,
	getSecret,
	makeSpinId,
	readState,
	readUnlock,
	sanitizeCampaignId,
	setStateCookie,
	type RouletteState,
} from '../_lib/state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RANDOM_RANGE = 2 ** 32;

function secureRandom(): number {
	return randomInt(0, RANDOM_RANGE) / RANDOM_RANGE;
}

export async function POST(req: NextRequest) {
	const secret = getSecret();

	if (!secret) {
		return NextResponse.json(
			{ ok: false, error: 'Configuração da roleta indisponível.' },
			{ status: 500 }
		);
	}

	const body = await req.json().catch(() => null);
	const rawCampaign = typeof body?.campaignId === 'string' ? body.campaignId.trim() : '';

	if (!rawCampaign || sanitizeCampaignId(rawCampaign) !== campaign.id) {
		return NextResponse.json({ ok: false, error: 'Dados inválidos.' }, { status: 400 });
	}

	if (campaign.maintenance || isCampaignExpired(campaign.endDate)) {
		return NextResponse.json({ ok: false, reason: 'unavailable' }, { status: 409 });
	}

	if (campaign.prizes.length === 0) {
		return NextResponse.json(
			{ ok: false, error: 'Configuração da roleta indisponível.' },
			{ status: 500 }
		);
	}

	const campaignId = campaign.id;
	const state = readState(req, campaignId, secret);
	const unlock = readUnlock(req, campaignId, secret);
	const isFreeSpin = state.spinsUsed === 0;

	if (!isFreeSpin && !unlock) {
		return NextResponse.json({ ok: false, reason: 'already_spun' }, { status: 409 });
	}

	// O sorteio acontece aqui no servidor; o navegador só anima até a fatia sorteada.
	const { prize, index: prizeIndex } = pickPrize(campaign.prizes, secureRandom);

	const storedPrize: StoredPrize = {
		id: prize.id,
		label: prize.label,
		description: prize.description,
		color: prize.color,
		textColor: prize.textColor,
		isWin: prize.isWin,
		at: new Date().toISOString(),
		spinId: makeSpinId(),
	};

	const nextState: RouletteState = {
		v: 1,
		campaign: campaignId,
		spinsUsed: state.spinsUsed + 1,
		lastPrize: storedPrize,
	};

	// O primeiro giro é gratuito e não consome uma liberação da atendente.
	// Se já existia uma liberação, ela continua valendo para o próximo giro.
	const unlockStillPending = isFreeSpin ? Boolean(unlock) : false;
	const canSpin = unlockStillPending;

	const response = NextResponse.json({
		ok: true,
		spinId: storedPrize.spinId,
		prizeIndex,
		status: {
			spinsUsed: nextState.spinsUsed,
			canSpin,
			lastPrize: storedPrize,
		},
	});

	setStateCookie(response, campaignId, nextState, secret);

	if (!isFreeSpin && unlock) {
		clearUnlockCookie(response, campaignId);
	}

	return response;
}
