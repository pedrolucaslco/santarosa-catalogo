// Acesso ao Supabase (PostgREST + Storage) só no servidor, com a service role key.
// Mesmo estilo de app/api/roleta/_lib/stock.ts.

export const IMAGE_BUCKET = 'products';

function config(): { url: string; key: string } | null {
	const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

	return url && key ? { url, key } : null;
}

export function catalogConfigured(): boolean {
	return config() !== null;
}

function need(): { url: string; key: string } {
	const cfg = config();

	if (!cfg) throw new Error('Supabase não configurado.');

	return cfg;
}

/** Chamada ao PostgREST. `path` é o que vem depois de /rest/v1/. */
export async function rest(path: string, init: RequestInit = {}): Promise<Response> {
	const { url, key } = need();

	const response = await fetch(`${url}/rest/v1/${path}`, {
		...init,
		cache: 'no-store',
		headers: {
			apikey: key,
			Authorization: `Bearer ${key}`,
			'Content-Type': 'application/json',
			...init.headers,
		},
	});

	if (!response.ok) {
		throw new Error(`Supabase ${response.status}: ${await response.text()}`);
	}

	return response;
}

export async function select<T>(path: string): Promise<T[]> {
	return (await (await rest(path)).json()) as T[];
}

/** Insere e devolve as linhas criadas. */
export async function insert<T>(table: string, rows: object | object[]): Promise<T[]> {
	const response = await rest(table, {
		method: 'POST',
		headers: { Prefer: 'return=representation' },
		body: JSON.stringify(rows),
	});

	return (await response.json()) as T[];
}

export async function patch(table: string, filter: string, changes: object): Promise<void> {
	await rest(`${table}?${filter}`, {
		method: 'PATCH',
		headers: { Prefer: 'return=minimal' },
		body: JSON.stringify(changes),
	});
}

export async function remove(table: string, filter: string): Promise<void> {
	await rest(`${table}?${filter}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
}

export const eq = (value: string) => `eq.${encodeURIComponent(value)}`;
export const inList = (values: string[]) => `in.(${values.map((v) => encodeURIComponent(v)).join(',')})`;

// ---------------------------------------------------------------- Storage

/** URL pública de uma imagem do bucket. */
export function imageUrl(path: string | null | undefined): string {
	const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');

	if (!url || !path) return '';

	return `${url}/storage/v1/object/public/${IMAGE_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export async function uploadImage(path: string, body: ArrayBuffer | Blob, contentType: string): Promise<void> {
	const { url, key } = need();

	const response = await fetch(`${url}/storage/v1/object/${IMAGE_BUCKET}/${path}`, {
		method: 'POST',
		cache: 'no-store',
		headers: {
			apikey: key,
			Authorization: `Bearer ${key}`,
			'Content-Type': contentType,
			'Cache-Control': 'public, max-age=31536000, immutable',
			'x-upsert': 'true',
		},
		body,
	});

	if (!response.ok) throw new Error(`Storage ${response.status}: ${await response.text()}`);
}

/** Remove imagens do bucket (melhor esforço: não lança se falhar). */
export async function deleteImages(paths: (string | null | undefined)[]): Promise<void> {
	const list = paths.filter((p): p is string => Boolean(p));

	if (list.length === 0) return;

	try {
		const { url, key } = need();

		await fetch(`${url}/storage/v1/object/${IMAGE_BUCKET}`, {
			method: 'DELETE',
			cache: 'no-store',
			headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ prefixes: list }),
		});
	} catch (error) {
		console.error('[catalog] falha ao remover imagens', error);
	}
}
