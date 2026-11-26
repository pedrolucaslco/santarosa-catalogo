import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { imageUrl, uploadImage } from '@/lib/catalog/db';
import { requireAdmin } from '../_lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_BYTES = 3 * 1024 * 1024; // a imagem já chega otimizada pelo navegador

export async function POST(req: NextRequest) {
	const denied = await requireAdmin(req);

	if (denied) return denied;

	const form = await req.formData().catch(() => null);
	const file = form?.get('file');

	if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'Envie uma imagem.' }, { status: 400 });

	const ext = TYPES[file.type];

	if (!ext) return NextResponse.json({ ok: false, error: 'Formato não suportado (use JPG, PNG ou WebP).' }, { status: 400 });
	if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'Imagem muito grande (máx. 3 MB).' }, { status: 400 });

	try {
		const path = `${randomUUID()}.${ext}`;

		await uploadImage(path, await file.arrayBuffer(), file.type);

		return NextResponse.json({ ok: true, path, url: imageUrl(path) });
	} catch (error) {
		console.error('[admin/upload] erro', error);

		return NextResponse.json({ ok: false, error: 'Erro ao enviar a imagem.' }, { status: 500 });
	}
}
