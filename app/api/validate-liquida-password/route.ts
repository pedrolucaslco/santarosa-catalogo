import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, ACCESS_TTL_SECONDS, createAccessToken } from '@/lib/access';
import { checkPassword } from '@/lib/catalog/access';

export const runtime = 'nodejs';

// Freio simples contra tentativas em massa: 10 erros por IP a cada 5 min (memória do processo).
const fails = new Map<string, { n: number; until: number }>();

export async function POST(req: Request) {
	const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
	const entry = fails.get(ip);

	if (entry && entry.until > Date.now() && entry.n >= 10) {
		return NextResponse.json({ valid: false, error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 });
	}

	const { password } = (await req.json().catch(() => ({}))) as { password?: unknown };
	let version: string | null = null;

	try {
		version = typeof password === 'string' ? await checkPassword(password) : null;
	} catch (error) {
		console.error('[validate-liquida-password]', error);

		return NextResponse.json({ valid: false, error: 'Erro ao validar a senha.' }, { status: 500 });
	}

	if (!version) {
		const active = entry && entry.until > Date.now() ? entry : { n: 0, until: Date.now() + 5 * 60_000 };

		fails.set(ip, { n: active.n + 1, until: active.until });

		return NextResponse.json({ valid: false });
	}

	fails.delete(ip);

	const response = NextResponse.json({ valid: true });

	response.cookies.set(ACCESS_COOKIE, await createAccessToken(version), {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
		maxAge: ACCESS_TTL_SECONDS,
	});

	return response;
}
