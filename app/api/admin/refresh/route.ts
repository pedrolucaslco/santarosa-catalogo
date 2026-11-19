import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookies, REFRESH_COOKIE, refreshSession, setSessionCookies } from '../_lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Renova o access token (que expira em ~1h) usando o refresh token. */
export async function POST(req: NextRequest) {
	const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
	const result = refreshToken ? await refreshSession(refreshToken) : null;

	if (!result?.ok) {
		const response = NextResponse.json({ ok: false }, { status: 401 });
		clearSessionCookies(response);

		return response;
	}

	const response = NextResponse.json({ ok: true });
	setSessionCookies(response, result.tokens);

	return response;
}
