import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
	getSecret,
	sanitizeCampaignId,
	setUnlockCookie,
	verifyPassword,
	type UnlockState,
} from '../_lib/state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;
const BLOCK_MS = 60_000;

interface AttemptEntry {
	count: number;
	firstAt: number;
	blockedUntil: number;
}

const attempts = new Map<string, AttemptEntry>();

function getClientKey(req: NextRequest): string {
	const forwarded = req.headers.get('x-forwarded-for');
	const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
	const userAgent = (req.headers.get('user-agent') || 'unknown').slice(0, 80);

	return `${ip}:${userAgent}`;
}

function checkRateLimit(key: string): { blocked: boolean; retryAfter: number } {
	const entry = attempts.get(key);

	if (!entry) return { blocked: false, retryAfter: 0 };

	const now = Date.now();

	if (entry.blockedUntil > now) {
		return { blocked: true, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
	}

	if (entry.blockedUntil > 0 || now - entry.firstAt > ATTEMPT_WINDOW_MS) {
		attempts.delete(key);
	}

	return { blocked: false, retryAfter: 0 };
}

function registerFailure(key: string): void {
	const now = Date.now();
	const entry = attempts.get(key);

	if (entry && entry.blockedUntil > now) return;

	if (!entry || now - entry.firstAt > ATTEMPT_WINDOW_MS) {
		attempts.set(key, { count: 1, firstAt: now, blockedUntil: 0 });
		return;
	}

	const count = entry.count + 1;

	if (count >= MAX_ATTEMPTS) {
		attempts.set(key, { count: 0, firstAt: now, blockedUntil: now + BLOCK_MS });
		return;
	}

	attempts.set(key, { ...entry, count });
}

export async function POST(req: NextRequest) {
	const secret = getSecret();
	const expectedPassword = process.env.ROLETA_UNLOCK_PASSWORD;

	if (!secret || !expectedPassword) {
		return NextResponse.json(
			{ ok: false, error: 'Configuração da roleta indisponível.' },
			{ status: 500 }
		);
	}

	const body = await req.json().catch(() => null);
	const rawCampaign = typeof body?.campaignId === 'string' ? body.campaignId.trim() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!rawCampaign || !password) {
		return NextResponse.json({ ok: false, error: 'Dados inválidos.' }, { status: 400 });
	}

	const campaignId = sanitizeCampaignId(rawCampaign);
	const rateLimitKey = `${campaignId}:${getClientKey(req)}`;
	const rateLimit = checkRateLimit(rateLimitKey);

	if (rateLimit.blocked) {
		return NextResponse.json(
			{ ok: false, error: 'Muitas tentativas. Aguarde um instante e tente novamente.' },
			{ status: 429, headers: { 'Retry-After': String(rateLimit.retryAfter) } }
		);
	}

	if (!verifyPassword(password, expectedPassword)) {
		registerFailure(rateLimitKey);
		return NextResponse.json({ ok: false }, { status: 401 });
	}

	attempts.delete(rateLimitKey);

	const unlock: UnlockState = {
		v: 1,
		campaign: campaignId,
		nonce: randomUUID(),
		exp: Date.now() + 10 * 60 * 1000,
	};

	const response = NextResponse.json({ ok: true });
	setUnlockCookie(response, campaignId, unlock, secret);

	return response;
}
