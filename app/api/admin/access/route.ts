import { NextRequest, NextResponse } from 'next/server';
import { getAccessAdmin, setLocked, setPassword } from '@/lib/catalog/access';
import { ValidationError } from '@/lib/catalog/admin';
import { requireAdmin } from '../_lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Senha e bloqueio das páginas de campanha.
//   GET   -> estado
//   PUT   { password }        -> define/troca a senha (invalida acessos já liberados)
//   PATCH { slug, locked }    -> ativa/desativa o bloqueio de uma coleção

async function handle(req: NextRequest, action?: (data: Record<string, unknown>) => Promise<void>) {
	const denied = await requireAdmin(req);

	if (denied) return denied;

	try {
		if (action) await action(((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>);

		return NextResponse.json({ ok: true, ...(await getAccessAdmin()) });
	} catch (error) {
		if (error instanceof ValidationError) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

		console.error('[admin/access] erro', error);

		return NextResponse.json({ ok: false, error: 'Erro ao acessar o banco (rodou supabase/acesso.sql?).' }, { status: 500 });
	}
}

export const GET = (req: NextRequest) => handle(req);
export const PUT = (req: NextRequest) => handle(req, (d) => setPassword(d.password));
export const PATCH = (req: NextRequest) => handle(req, (d) => setLocked(d.slug, d.locked));
