import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { campaign } from '@/app/roleta/_lib/campaign';
import { isAllowedColor } from '@/app/roleta/_lib/palette';
import {
	createPrize,
	deletePrize,
	listPrizes,
	reorderPrizes,
	updatePrize,
	type PrizeInput,
} from '@/app/api/roleta/_lib/stock';
import { requireAdmin } from '../_lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEX = /^#[0-9a-fA-F]{6}$/;

type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function parseInput(raw: unknown, partial: boolean): ParseResult<Partial<PrizeInput>> {
	if (!raw || typeof raw !== 'object') return { ok: false, error: 'Dados inválidos.' };

	const data = raw as Record<string, unknown>;
	const out: Partial<PrizeInput> = {};

	if (!partial || data.label !== undefined) {
		const label = typeof data.label === 'string' ? data.label.trim() : '';

		if (!label || label.length > 40) return { ok: false, error: 'Nome obrigatório (até 40 caracteres).' };
		out.label = label;
	}

	if (data.description !== undefined) {
		const description = typeof data.description === 'string' ? data.description.trim() : '';

		if (description.length > 140) return { ok: false, error: 'Descrição muito longa (máx. 140).' };
		out.description = description;
	}

	for (const field of ['color', 'textColor'] as const) {
		if (data[field] !== undefined) {
			const value = data[field];

			if (typeof value !== 'string' || !HEX.test(value) || !isAllowedColor(field, value)) {
				return { ok: false, error: 'Cor não permitida. Escolha uma das cores da paleta.' };
			}
			out[field] = value;
		}
	}

	if (data.isWin !== undefined) {
		if (typeof data.isWin !== 'boolean') return { ok: false, error: 'Valor inválido.' };
		out.isWin = data.isWin;
	}

	if (data.weight !== undefined) {
		const weight = data.weight;

		if (!Number.isInteger(weight) || (weight as number) < 1 || (weight as number) > 1000) {
			return { ok: false, error: 'Peso deve ser um inteiro de 1 a 1000.' };
		}
		out.weight = weight as number;
	}

	if (data.maxCount !== undefined) {
		const max = data.maxCount;

		if (max !== null && (!Number.isInteger(max) || (max as number) < 0 || (max as number) > 100000)) {
			return { ok: false, error: 'Quantidade máxima inválida.' };
		}
		out.maxCount = max as number | null;
	}

	return { ok: true, value: out };
}

function slug(label: string): string {
	const base = label
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 30);

	return `${base || 'premio'}-${randomBytes(2).toString('hex')}`;
}

function failure(error: unknown) {
	console.error('[admin] erro', error);

	return NextResponse.json({ ok: false, error: 'Erro ao acessar o banco.' }, { status: 500 });
}

export async function GET(req: NextRequest) {
	const denied = await requireAdmin(req);
	if (denied) return denied;

	try {
		return NextResponse.json({ ok: true, prizes: await listPrizes(campaign.id) });
	} catch (error) {
		return failure(error);
	}
}

export async function POST(req: NextRequest) {
	const denied = await requireAdmin(req);
	if (denied) return denied;

	const body = await req.json().catch(() => null);
	const parsed = parseInput(
		{ description: '', color: '#262626', textColor: '#ffffff', isWin: true, weight: 10, maxCount: 1, ...body },
		false
	);

	if (!parsed.ok) return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });

	try {
		await createPrize(campaign.id, slug(parsed.value.label as string), parsed.value as PrizeInput);

		return NextResponse.json({ ok: true, prizes: await listPrizes(campaign.id) });
	} catch (error) {
		return failure(error);
	}
}

export async function PATCH(req: NextRequest) {
	const denied = await requireAdmin(req);
	if (denied) return denied;

	const body = await req.json().catch(() => null);

	try {
		if (Array.isArray(body?.order)) {
			const current = await listPrizes(campaign.id);
			const order = body.order as unknown[];
			const valid =
				order.length === current.length &&
				order.every((id) => typeof id === 'string' && current.some((prize) => prize.id === id));

			if (!valid) return NextResponse.json({ ok: false, error: 'Ordem inválida.' }, { status: 400 });

			await reorderPrizes(campaign.id, order as string[]);
		} else {
			const id = typeof body?.id === 'string' ? body.id : '';
			const parsed = parseInput(body?.changes, true);

			if (!id || !parsed.ok) {
				return NextResponse.json(
					{ ok: false, error: parsed.ok ? 'Prêmio inválido.' : parsed.error },
					{ status: 400 }
				);
			}

			const current = await listPrizes(campaign.id);

			if (!current.some((prize) => prize.id === id)) {
				return NextResponse.json({ ok: false, error: 'Prêmio não encontrado.' }, { status: 404 });
			}

			await updatePrize(campaign.id, id, parsed.value);
		}

		return NextResponse.json({ ok: true, prizes: await listPrizes(campaign.id) });
	} catch (error) {
		return failure(error);
	}
}

export async function DELETE(req: NextRequest) {
	const denied = await requireAdmin(req);
	if (denied) return denied;

	const body = await req.json().catch(() => null);
	const id = typeof body?.id === 'string' ? body.id : '';

	try {
		const current = await listPrizes(campaign.id);

		if (!current.some((prize) => prize.id === id)) {
			return NextResponse.json({ ok: false, error: 'Prêmio não encontrado.' }, { status: 404 });
		}

		if (current.length <= 1) {
			return NextResponse.json(
				{ ok: false, error: 'A roleta precisa de pelo menos um prêmio.' },
				{ status: 400 }
			);
		}

		await deletePrize(campaign.id, id);

		return NextResponse.json({ ok: true, prizes: await listPrizes(campaign.id) });
	} catch (error) {
		return failure(error);
	}
}
