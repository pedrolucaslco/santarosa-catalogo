import { NextRequest, NextResponse } from 'next/server';
import { adminConfigured, passwordLogin, setSessionCookies } from '../_lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
	if (!adminConfigured()) {
		return NextResponse.json({ ok: false, error: 'Admin não configurado.' }, { status: 500 });
	}

	const body = await req.json().catch(() => null);
	const email = typeof body?.email === 'string' ? body.email.trim() : '';
	const password = typeof body?.password === 'string' ? body.password : '';

	if (!email || !password) {
		return NextResponse.json({ ok: false, error: 'Informe e-mail e senha.' }, { status: 400 });
	}

	const result = await passwordLogin(email, password);

	if (!result.ok) {
		const map = {
			invalid: [401, 'E-mail ou senha inválidos.'],
			forbidden: [403, 'Este usuário não tem acesso ao admin.'],
			unavailable: [503, 'Serviço de login indisponível. Tente em instantes.'],
		} as const;
		const [status, error] = map[result.reason];

		return NextResponse.json({ ok: false, error }, { status });
	}

	const response = NextResponse.json({ ok: true });
	setSessionCookies(response, result.tokens);

	return response;
}
