import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, clearSessionCookies, revokeSession } from '../_lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
	await revokeSession(req.cookies.get(ACCESS_COOKIE)?.value);

	const response = NextResponse.json({ ok: true });
	clearSessionCookies(response);

	return response;
}
