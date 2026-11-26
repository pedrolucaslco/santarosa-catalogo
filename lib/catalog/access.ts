// Senha e bloqueio das campanhas (servidor, Node). Estado lido pelo middleware em lib/access.ts.
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { invalidateAccessCache, UNLOCKABLE_SLUGS } from '@/lib/access';
import { eq, patch, rest, select } from './db';
import { ValidationError } from './admin';

const scryptAsync = (password: string, salt: Buffer) =>
	new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key))));

async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);

	return `scrypt$${salt.toString('hex')}$${(await scryptAsync(password, salt)).toString('hex')}`;
}

async function matches(password: string, stored: string): Promise<boolean> {
	const [kind, salt, hash] = stored.split('$');

	if (kind !== 'scrypt' || !salt || !hash) return false;

	const expected = Buffer.from(hash, 'hex');
	const actual = await scryptAsync(password, Buffer.from(salt, 'hex'));

	return expected.length === actual.length && timingSafeEqual(expected, actual);
}

async function readAccess() {
	const [row] = await select<{ password_hash: string | null; version: string }>(
		'catalog_access?select=password_hash,version&id=eq.true'
	);

	return row ?? { password_hash: null, version: 'env' };
}

/** Confere a senha digitada. Devolve a versão para assinar o cookie, ou null se errada. */
export async function checkPassword(password: string): Promise<string | null> {
	const { password_hash, version } = await readAccess();

	if (password_hash) return (await matches(password, password_hash)) ? version : null;

	// Sem senha no banco: usa a do .env (transição).
	const envPassword = process.env.LIQUIDA_PASSWORD;

	return envPassword && password === envPassword ? 'env' : null;
}

export async function setPassword(password: unknown): Promise<void> {
	if (typeof password !== 'string' || password.length < 4) throw new ValidationError('A senha precisa ter ao menos 4 caracteres.');
	if (password.length > 100) throw new ValidationError('Senha muito longa.');

	await rest('catalog_access?on_conflict=id', {
		method: 'POST',
		headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
		body: JSON.stringify({ id: true, password_hash: await hashPassword(password), version: randomUUID() }),
	});
	invalidateAccessCache();
}

export async function setLocked(slug: unknown, locked: unknown): Promise<void> {
	if (typeof slug !== 'string' || typeof locked !== 'boolean') throw new ValidationError('Dados inválidos.');
	if (UNLOCKABLE_SLUGS.includes(slug)) throw new ValidationError('Esta página não usa o bloqueio por senha.');

	await patch('catalog_collections', `slug=${eq(slug)}`, { locked });
	invalidateAccessCache();
}

export async function getAccessAdmin() {
	const [collections, access] = await Promise.all([
		select<{ slug: string; name: string; locked: boolean }>('catalog_collections?select=slug,name,locked&order=position,name'),
		readAccess(),
	]);

	return {
		passwordSet: Boolean(access.password_hash),
		envFallback: !access.password_hash && Boolean(process.env.LIQUIDA_PASSWORD),
		collections: collections.filter((c) => !UNLOCKABLE_SLUGS.includes(c.slug)),
	};
}
