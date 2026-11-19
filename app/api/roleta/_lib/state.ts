import { createHash, createHmac, randomUUID, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import type { StoredPrize } from '@/app/roleta/_lib/roulette';

export interface RouletteState {
	v: 1;
	campaign: string;
	spinsUsed: number;
	lastPrize?: StoredPrize;
}

export interface UnlockState {
	v: 1;
	campaign: string;
	nonce: string;
	exp: number;
}

export const UNLOCK_MAX_AGE = 60 * 10;
const STATE_MAX_AGE = 60 * 60 * 24 * 180;

export function getSecret(): string | null {
	const secret = process.env.ROLETA_COOKIE_SECRET?.trim();
	return secret ? secret : null;
}

export function sanitizeCampaignId(campaignId: string): string {
	const sanitized = campaignId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
	return sanitized || 'default';
}

export function stateCookieName(campaignId: string): string {
	return `roleta_state_${sanitizeCampaignId(campaignId)}`;
}

export function unlockCookieName(campaignId: string): string {
	return `roleta_unlock_${sanitizeCampaignId(campaignId)}`;
}

function sign(payload: unknown, secret: string): string {
	const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
	const signature = createHmac('sha256', secret).update(data).digest('base64url');

	return `${data}.${signature}`;
}

function verify<T>(token: string | undefined, secret: string): T | null {
	if (!token) return null;

	const [data, signature] = token.split('.');

	if (!data || !signature) return null;

	const expectedSignature = createHmac('sha256', secret).update(data).digest('base64url');
	const provided = Buffer.from(signature);
	const expected = Buffer.from(expectedSignature);

	if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
		return null;
	}

	try {
		return JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as T;
	} catch {
		return null;
	}
}

export function readState(req: NextRequest, campaignId: string, secret: string): RouletteState {
	const token = req.cookies.get(stateCookieName(campaignId))?.value;
	const payload = verify<RouletteState>(token, secret);

	if (
		!payload ||
		payload.v !== 1 ||
		payload.campaign !== campaignId ||
		typeof payload.spinsUsed !== 'number' ||
		payload.spinsUsed < 0
	) {
		return { v: 1, campaign: campaignId, spinsUsed: 0 };
	}

	return payload;
}

export function readUnlock(req: NextRequest, campaignId: string, secret: string): UnlockState | null {
	const token = req.cookies.get(unlockCookieName(campaignId))?.value;
	const payload = verify<UnlockState>(token, secret);

	if (
		!payload ||
		payload.v !== 1 ||
		payload.campaign !== campaignId ||
		typeof payload.exp !== 'number' ||
		payload.exp <= Date.now()
	) {
		return null;
	}

	return payload;
}

export function setStateCookie(
	res: NextResponse,
	campaignId: string,
	state: RouletteState,
	secret: string
): void {
	res.cookies.set(stateCookieName(campaignId), sign(state, secret), {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: STATE_MAX_AGE,
	});
}

export function setUnlockCookie(
	res: NextResponse,
	campaignId: string,
	unlock: UnlockState,
	secret: string
): void {
	res.cookies.set(unlockCookieName(campaignId), sign(unlock, secret), {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: UNLOCK_MAX_AGE,
	});
}

export function clearUnlockCookie(res: NextResponse, campaignId: string): void {
	res.cookies.set(unlockCookieName(campaignId), '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 0,
		expires: new Date(0),
	});
}

export function verifyPassword(password: string, expected: string): boolean {
	const provided = createHash('sha256').update(password).digest();
	const expectedHash = createHash('sha256').update(expected).digest();

	return timingSafeEqual(provided, expectedHash);
}

export function makeSpinId(): string {
	return randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
}
