// Bloqueio por senha das páginas de campanha. Só Web Crypto + fetch: roda no middleware (edge) e no Node.

export const ACCESS_COOKIE = 'liquida_auth';
export const ACCESS_TTL_SECONDS = 60 * 60; // 1 hora

/** Páginas que NÃO passam por este bloqueio (a home usa outro fluxo). */
export const UNLOCKABLE_SLUGS = ['catalogo'];

export interface AccessState {
	/** slugs bloqueados */
	locked: string[];
	/** muda quando a senha muda; invalida cookies antigos */
	version: string;
}

function dbConfig() {
	const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, '');
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

	return url && key ? { url, key } : null;
}

let cache: { at: number; state: AccessState } | null = null;
const CACHE_MS = 10_000;

/** Estado atual do bloqueio (cache de 10 s). Sem Supabase configurado, cai no .env antigo. Falha de banco => bloqueia. */
export async function getAccessState(): Promise<AccessState> {
	const cfg = dbConfig();

	if (!cfg) {
		return {
			locked: process.env.LIQUIDA_LOCKED === 'true' ? ['liquida', 'black'] : [],
			version: 'env',
		};
	}

	if (cache && Date.now() - cache.at < CACHE_MS) return cache.state;

	try {
		const headers = { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` };
		const [cols, acc] = await Promise.all([
			fetch(`${cfg.url}/rest/v1/catalog_collections?select=slug&locked=eq.true`, { headers, cache: 'no-store' }),
			fetch(`${cfg.url}/rest/v1/catalog_access?select=version,password_hash&id=eq.true`, { headers, cache: 'no-store' }),
		]);

		if (!cols.ok || !acc.ok) throw new Error(`Supabase ${cols.status}/${acc.status}`);

		const locked = ((await cols.json()) as { slug: string }[]).map((c) => c.slug);
		const row = ((await acc.json()) as { version: string; password_hash: string | null }[])[0];
		const state: AccessState = { locked, version: row?.password_hash ? row.version : 'env' };

		cache = { at: Date.now(), state };

		return state;
	} catch (error) {
		console.error('[access] falha ao ler estado', error);

		// Fail closed: usa o último estado conhecido ou bloqueia as campanhas conhecidas.
		return cache?.state ?? { locked: ['liquida', 'black'], version: '?' };
	}
}

export function invalidateAccessCache() {
	cache = null;
}

const enc = new TextEncoder();

function secret(): string {
	return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.LIQUIDA_PASSWORD || 'dev-secret';
}

async function sign(payload: string): Promise<string> {
	const key = await crypto.subtle.importKey('raw', enc.encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));

	return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Cookie assinado: "<expira>.<assinatura>", preso à versão da senha. */
export async function createAccessToken(version: string): Promise<string> {
	const exp = Math.floor(Date.now() / 1000) + ACCESS_TTL_SECONDS;

	return `${exp}.${await sign(`${exp}.${version}`)}`;
}

export async function verifyAccessToken(token: string | undefined, version: string): Promise<boolean> {
	if (!token) return false;

	const [exp, sig] = token.split('.');

	if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;

	const expected = await sign(`${exp}.${version}`);

	if (expected.length !== sig.length) return false;

	let diff = 0;

	for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);

	return diff === 0;
}
