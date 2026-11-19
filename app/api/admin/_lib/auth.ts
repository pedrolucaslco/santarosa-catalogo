import { NextRequest, NextResponse } from 'next/server';

// Autenticação do admin via Supabase Auth (GoTrue REST). Sem dependência extra.
// Quem é admin: usuário com app_metadata.role = "admin" (só a service role consegue definir isso,
// o próprio usuário não edita). Outros papéis/áreas podem reaproveitar o mesmo campo depois.

export const ACCESS_COOKIE = 'sb_admin_access';
export const REFRESH_COOKIE = 'sb_admin_refresh';
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30;

export interface AdminUser {
	id: string;
	email: string;
}

interface SupabaseUser {
	id: string;
	email?: string;
	app_metadata?: { role?: string; roles?: string[] };
}

interface TokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	user: SupabaseUser;
}

function config(): { url: string; anonKey: string } | null {
	const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
	const anonKey = process.env.SUPABASE_ANON_KEY?.trim();

	return url && anonKey ? { url, anonKey } : null;
}

export function adminConfigured(): boolean {
	return config() !== null;
}

function isAdmin(user: SupabaseUser): boolean {
	return user.app_metadata?.role === 'admin' || Boolean(user.app_metadata?.roles?.includes('admin'));
}

async function auth(path: string, init: RequestInit): Promise<Response> {
	const cfg = config();

	if (!cfg) throw new Error('Supabase Auth não configurado.');

	return fetch(`${cfg.url}/auth/v1/${path}`, {
		...init,
		cache: 'no-store',
		headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json', ...init.headers },
	});
}

export type LoginResult =
	| { ok: true; tokens: TokenResponse }
	| { ok: false; reason: 'invalid' | 'forbidden' | 'unavailable' };

async function tokenGrant(grant: 'password' | 'refresh_token', body: object): Promise<LoginResult> {
	try {
		const response = await auth(`token?grant_type=${grant}`, { method: 'POST', body: JSON.stringify(body) });

		if (response.status === 429) return { ok: false, reason: 'unavailable' };
		if (!response.ok) return { ok: false, reason: 'invalid' };

		const tokens = (await response.json()) as TokenResponse;

		return isAdmin(tokens.user) ? { ok: true, tokens } : { ok: false, reason: 'forbidden' };
	} catch {
		return { ok: false, reason: 'unavailable' };
	}
}

export const passwordLogin = (email: string, password: string) => tokenGrant('password', { email, password });
export const refreshSession = (refreshToken: string) =>
	tokenGrant('refresh_token', { refresh_token: refreshToken });

/** Valida o access token no Supabase (autoritativo) e exige o papel de admin. */
export async function verifyAdmin(accessToken: string | undefined): Promise<AdminUser | null> {
	if (!accessToken || !config()) return null;

	try {
		const response = await auth('user', { headers: { Authorization: `Bearer ${accessToken}` } });

		if (!response.ok) return null;

		const user = (await response.json()) as SupabaseUser;

		return isAdmin(user) ? { id: user.id, email: user.email ?? '' } : null;
	} catch {
		return null;
	}
}

export async function revokeSession(accessToken: string | undefined): Promise<void> {
	if (!accessToken) return;

	try {
		await auth('logout', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
	} catch {
		// melhor esforço: os cookies são apagados de qualquer forma
	}
}

const cookieBase = {
	httpOnly: true,
	sameSite: 'strict' as const,
	secure: process.env.NODE_ENV === 'production',
	path: '/',
};

export function setSessionCookies(res: NextResponse, tokens: TokenResponse): void {
	res.cookies.set(ACCESS_COOKIE, tokens.access_token, { ...cookieBase, maxAge: tokens.expires_in });
	res.cookies.set(REFRESH_COOKIE, tokens.refresh_token, { ...cookieBase, maxAge: REFRESH_MAX_AGE });
}

export function clearSessionCookies(res: NextResponse): void {
	for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
		res.cookies.set(name, '', { ...cookieBase, maxAge: 0, expires: new Date(0) });
	}
}

/** Retorna 401 quando não há admin autenticado, ou null se estiver tudo certo. */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
	if (await verifyAdmin(req.cookies.get(ACCESS_COOKIE)?.value)) return null;

	return NextResponse.json({ ok: false, error: 'Não autorizado.' }, { status: 401 });
}
