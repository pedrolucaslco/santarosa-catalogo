import { campaign } from '@/app/roleta/_lib/campaign';
import type { Prize } from '@/app/roleta/_lib/roulette';

// Acesso ao Supabase via PostgREST (fetch), usando a service role key só no servidor.
// A tabela roleta_prize_stock é a fonte da verdade dos prêmios; o campaign.ts só serve de semente.

export interface DbPrize {
	id: string;
	label: string;
	description: string;
	color: string;
	textColor: string;
	isWin: boolean;
	weight: number;
	/** null = ilimitado */
	maxCount: number | null;
	awarded: number;
	position: number;
}

interface DbRow {
	prize_id: string;
	label: string | null;
	description: string | null;
	color: string | null;
	text_color: string | null;
	is_win: boolean | null;
	weight: number | null;
	max_count: number | null;
	awarded: number;
	position: number;
}

const TABLE = 'roleta_prize_stock';

function config(): { url: string; key: string } | null {
	const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

	return url && key ? { url, key } : null;
}

export function stockConfigured(): boolean {
	return config() !== null;
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
	const cfg = config();

	if (!cfg) throw new Error('Supabase não configurado.');

	const response = await fetch(`${cfg.url}/rest/v1/${path}`, {
		...init,
		cache: 'no-store',
		headers: {
			apikey: cfg.key,
			Authorization: `Bearer ${cfg.key}`,
			'Content-Type': 'application/json',
			...init.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`Supabase ${response.status}: ${await response.text()}`);
	}

	return response;
}

const campaignFilter = (campaignId: string) => `campaign_id=eq.${encodeURIComponent(campaignId)}`;

async function fetchRows(campaignId: string): Promise<DbRow[]> {
	const response = await request(
		`${TABLE}?${campaignFilter(campaignId)}&select=prize_id,label,description,color,text_color,is_win,weight,max_count,awarded,position&order=position.asc,prize_id.asc`
	);

	return (await response.json()) as DbRow[];
}

function toDbPrize(row: DbRow): DbPrize {
	return {
		id: row.prize_id,
		label: row.label ?? row.prize_id,
		description: row.description ?? '',
		color: row.color ?? '#262626',
		textColor: row.text_color ?? '#ffffff',
		isWin: row.is_win ?? true,
		weight: row.weight ?? 10,
		maxCount: row.max_count,
		awarded: row.awarded,
		position: row.position,
	};
}

async function seedDefaults(campaignId: string): Promise<void> {
	const rows = campaign.prizes.map((prize, index) => ({
		campaign_id: campaignId,
		prize_id: prize.id,
		position: index,
		label: prize.label,
		description: prize.description ?? '',
		color: prize.color,
		text_color: prize.textColor,
		is_win: prize.isWin,
		weight: prize.weight,
		max_count: typeof prize.maxCount === 'number' ? prize.maxCount : null,
	}));

	// Sem `awarded` no payload: contadores já existentes são preservados.
	await request(`${TABLE}?on_conflict=campaign_id,prize_id`, {
		method: 'POST',
		headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
		body: JSON.stringify(rows),
	});
}

/** Lista os prêmios da campanha. Na primeira vez, semeia a partir do campaign.ts. */
export async function listPrizes(campaignId: string): Promise<DbPrize[]> {
	let rows = await fetchRows(campaignId);

	if (!rows.some((row) => row.label !== null)) {
		await seedDefaults(campaignId);
		rows = await fetchRows(campaignId);
	}

	return rows.filter((row) => row.label !== null).map(toDbPrize);
}

export async function claimPrize(campaignId: string, prizeId: string): Promise<boolean> {
	const response = await request('rpc/roleta_claim', {
		method: 'POST',
		body: JSON.stringify({ p_campaign: campaignId, p_prize: prizeId }),
	});

	return (await response.json()) === true;
}

/** Peso efetivo: limitado = restante; ilimitado = weight; esgotado = 0. */
export function effectiveWeights(prizes: readonly DbPrize[]): number[] {
	return prizes.map((prize) =>
		prize.maxCount === null ? Math.max(0, prize.weight) : Math.max(0, prize.maxCount - prize.awarded)
	);
}

export function toPublicPrize(prize: DbPrize): Prize {
	return {
		id: prize.id,
		label: prize.label,
		description: prize.description || undefined,
		color: prize.color,
		textColor: prize.textColor,
		weight: prize.weight,
		isWin: prize.isWin,
	};
}

// ---------- Admin ----------

export interface PrizeInput {
	label: string;
	description: string;
	color: string;
	textColor: string;
	isWin: boolean;
	weight: number;
	maxCount: number | null;
}

function inputToRow(input: Partial<PrizeInput>): Record<string, unknown> {
	const row: Record<string, unknown> = {};

	if (input.label !== undefined) row.label = input.label;
	if (input.description !== undefined) row.description = input.description;
	if (input.color !== undefined) row.color = input.color;
	if (input.textColor !== undefined) row.text_color = input.textColor;
	if (input.isWin !== undefined) row.is_win = input.isWin;
	if (input.weight !== undefined) row.weight = input.weight;
	if (input.maxCount !== undefined) row.max_count = input.maxCount;

	return row;
}

export async function createPrize(campaignId: string, id: string, input: PrizeInput): Promise<void> {
	const existing = await listPrizes(campaignId);
	const position = existing.reduce((max, prize) => Math.max(max, prize.position), -1) + 1;

	await request(TABLE, {
		method: 'POST',
		headers: { Prefer: 'return=minimal' },
		body: JSON.stringify({ campaign_id: campaignId, prize_id: id, position, ...inputToRow(input) }),
	});
}

export async function updatePrize(
	campaignId: string,
	id: string,
	input: Partial<PrizeInput>
): Promise<void> {
	await request(`${TABLE}?${campaignFilter(campaignId)}&prize_id=eq.${encodeURIComponent(id)}`, {
		method: 'PATCH',
		headers: { Prefer: 'return=minimal' },
		body: JSON.stringify(inputToRow(input)),
	});
}

export async function deletePrize(campaignId: string, id: string): Promise<void> {
	await request(`${TABLE}?${campaignFilter(campaignId)}&prize_id=eq.${encodeURIComponent(id)}`, {
		method: 'DELETE',
		headers: { Prefer: 'return=minimal' },
	});
}

/** Define a ordem pela lista de ids (índice = posição). */
export async function reorderPrizes(campaignId: string, ids: readonly string[]): Promise<void> {
	await Promise.all(
		ids.map((id, position) =>
			request(`${TABLE}?${campaignFilter(campaignId)}&prize_id=eq.${encodeURIComponent(id)}`, {
				method: 'PATCH',
				headers: { Prefer: 'return=minimal' },
				body: JSON.stringify({ position }),
			})
		)
	);
}

/** Zera o contador de um prêmio, ou de todos quando prizeId é omitido. */
export async function resetAwarded(campaignId: string, prizeId?: string): Promise<void> {
	const prizeFilter = prizeId ? `&prize_id=eq.${encodeURIComponent(prizeId)}` : '';

	await request(`${TABLE}?${campaignFilter(campaignId)}${prizeFilter}`, {
		method: 'PATCH',
		headers: { Prefer: 'return=minimal' },
		body: JSON.stringify({ awarded: 0 }),
	});
}
