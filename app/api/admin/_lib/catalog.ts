import { NextRequest, NextResponse } from 'next/server';
import { listCatalog, ValidationError } from '@/lib/catalog/admin';
import { requireAdmin } from './auth';

/** Autentica, executa a ação e devolve o catálogo atualizado (mesmo padrão do admin da roleta). */
export async function handleCatalog(req: NextRequest, action: () => Promise<void> | void) {
	const denied = await requireAdmin(req);

	if (denied) return denied;

	try {
		await action();

		return NextResponse.json({ ok: true, ...(await listCatalog()) });
	} catch (error) {
		if (error instanceof ValidationError) {
			return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
		}

		console.error('[admin/catalog] erro', error);

		return NextResponse.json({ ok: false, error: 'Erro ao acessar o banco.' }, { status: 500 });
	}
}
