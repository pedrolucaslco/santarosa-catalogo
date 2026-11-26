#!/usr/bin/env node
// Importa os produtos das pastas (public/products, public/liquida, public/black) para o Supabase.
//
//   node scripts/import-products.mjs                     # dry-run: só mostra o relatório
//   node scripts/import-products.mjs --apply             # grava no banco e sobe as imagens
//   node scripts/import-products.mjs --apply --only=black   # só uma coleção
//
// Pré-requisito: rodar supabase/produtos.sql. Lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.
// Coleções que já têm produtos são puladas (não duplica).

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SOURCES = [
	{ slug: 'catalogo', dir: 'public/products' },
	{ slug: 'liquida', dir: 'public/liquida' },
	{ slug: 'black', dir: 'public/black' },
];
const IMAGE_EXT = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ONLY = args.find((a) => a.startsWith('--only='))?.split('=')[1];

// ------------------------------------------------------------------ .env
function loadEnv() {
	const file = path.join(ROOT, '.env');
	if (!fs.existsSync(file)) return;
	for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
		const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
		if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
	}
}
loadEnv();
const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (APPLY && (!SUPABASE_URL || !KEY)) {
	console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.');
	process.exit(1);
}

// ------------------------------------------------------------------ parser (mesmo das APIs antigas)
function cleanProductName(name) {
	const withoutOrder = name.trim().replace(/^\d+\.\s*/, '');
	const parts = withoutOrder.split('_e_');
	const cleanName =
		parts.length > 2 ? parts.slice(0, -1).join(', ') + ' e ' + parts.slice(-1) : parts.join(' e ');
	return cleanName.replace(/_mais_/g, '+').replace(/\s+/g, ' ').trim();
}

const toNumber = (v) => parseFloat(v.replace(/\./g, '').replace(',', '.'));

/** Separa "(Disponível letra B e E)" do nome e devolve { name, notes }. */
function splitNotes(rawName) {
	const notes = [];
	const name = rawName
		.replace(/\(([^)]*)\)/g, (_, inner) => {
			const t = inner.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
			if (t) notes.push(t);
			return ' ';
		})
		.replace(/\s+/g, ' ')
		.trim();
	return { name: name || rawName.trim(), notes: notes.join('; ') };
}

function parseItems(nameWithoutExt) {
	const dePor = nameWithoutExt.match(/(.*) DE_?\s*R\$\s*(\d+,\d+)\s+POR_?\s*R\$\s*(\d+,\d+)/i);
	if (dePor) {
		const { name, notes } = splitNotes(cleanProductName(dePor[1]));
		return [{ name, notes, price: toNumber(dePor[3]), priceFrom: toNumber(dePor[2]) }];
	}
	const items = [];
	const re = /(.+?)\s*R\$\s*(\d+,\d+)/g;
	let m;
	while ((m = re.exec(nameWithoutExt)) !== null) {
		const { name, notes } = splitNotes(cleanProductName(m[1]));
		if (name) items.push({ name, notes, price: toNumber(m[2]), priceFrom: null });
	}
	return items;
}

// ------------------------------------------------------------------ leitura das pastas
function walk(dir) {
	const out = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) out.push(...walk(full));
		else out.push(full);
	}
	return out;
}

const categoryDisplay = (raw) => raw.replace(/^\d+\.\s*/, '').replace('pct', '%');
const norm = (s) =>
	s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const report = { ignored: [], noItems: [] };
const plan = [];

for (const src of SOURCES) {
	if (ONLY && ONLY !== src.slug) continue;
	const base = path.join(ROOT, src.dir);
	if (!fs.existsSync(base)) {
		console.warn(`(pulando ${src.slug}: pasta ${src.dir} não existe)`);
		continue;
	}
	const files = walk(base);
	const rawCategories = new Set();
	const entries = [];

	for (const file of files) {
		const ext = path.extname(file).toLowerCase();
		const rel = path.relative(base, file);
		if (!IMAGE_EXT[ext]) {
			report.ignored.push(`${src.slug}: ${rel}`);
			continue;
		}
		const items = parseItems(path.parse(file).name);
		if (items.length === 0) {
			report.noItems.push(`${src.slug}: ${rel}`);
			continue;
		}
		const dir = path.dirname(rel);
		const rawCategory = dir === '.' ? null : dir.replace(/\\/g, '/');
		if (rawCategory) rawCategories.add(rawCategory);
		entries.push({ file, ext, items, rawCategory, size: fs.statSync(file).size });
	}

	// Ordem das categorias = a mesma de hoje (localeCompare do nome da pasta).
	const categories = [...rawCategories].sort((a, b) => a.localeCompare(b)).map((raw, position) => ({
		raw,
		name: categoryDisplay(raw),
		position,
	}));

	plan.push({ ...src, entries, categories });
}

// ------------------------------------------------------------------ relatório
const MB = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log(APPLY ? '== IMPORTAÇÃO (apply) ==\n' : '== DRY-RUN (nada será gravado) ==\n');

const nameIndex = new Map();
for (const p of plan) {
	const kits = p.entries.filter((e) => e.items.length > 1);
	const withNotes = p.entries.filter((e) => e.items.some((i) => i.notes));
	const total = p.entries.reduce((a, e) => a + e.size, 0);
	console.log(`[${p.slug}] ${p.entries.length} arquivos, ${MB(total)}, ${p.categories.length} categorias, ${kits.length} kits, ${withNotes.length} com observações`);
	for (const c of p.categories) console.log(`   ${c.position}. ${c.name}  (pasta: ${c.raw})`);
	for (const k of kits) console.log(`   kit: ${k.items.map((i) => `${i.name} R$${i.price}`).join(' + ')}`);
	for (const e of withNotes.slice(0, 5)) console.log(`   obs: ${e.items.map((i) => `${i.name} → "${i.notes}"`).join(' | ')}`);
	if (withNotes.length > 5) console.log(`   … e mais ${withNotes.length - 5} com observações`);
	for (const e of p.entries) {
		const key = norm(e.items.map((i) => i.name).join(' + '));
		const list = nameIndex.get(key) ?? [];
		list.push(`${p.slug} (R$${e.items[0].price}${e.items[0].priceFrom ? ` / de ${e.items[0].priceFrom}` : ''})`);
		nameIndex.set(key, list);
	}
	console.log('');
}

const dupes = [...nameIndex.entries()].filter(([, v]) => v.length > 1);
console.log(`Possíveis duplicados (mesmo nome em mais de um lugar): ${dupes.length}`);
for (const [name, where] of dupes) console.log(`   ${name}  →  ${where.join(', ')}`);
if (report.ignored.length) console.log(`\nArquivos ignorados (não são imagem suportada): ${report.ignored.length}\n   ` + report.ignored.join('\n   '));
if (report.noItems.length) console.log(`\nArquivos sem preço no nome (ignorados, como nas APIs antigas): ${report.noItems.length}\n   ` + report.noItems.join('\n   '));

if (!APPLY) {
	console.log('\nNada foi gravado. Rode com --apply para importar.');
	process.exit(0);
}

// ------------------------------------------------------------------ gravação
async function rest(p, init = {}) {
	const res = await fetch(`${SUPABASE_URL}/rest/v1/${p}`, {
		...init,
		headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', ...init.headers },
	});
	if (!res.ok) throw new Error(`Supabase ${res.status} em ${p}: ${await res.text()}`);
	return res;
}
const insert = async (table, rows) =>
	(await rest(table, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(rows) })).json();

async function upload(file, ext) {
	const key = `${randomUUID()}${ext === '.jpeg' ? '.jpg' : ext}`;
	const res = await fetch(`${SUPABASE_URL}/storage/v1/object/products/${key}`, {
		method: 'POST',
		headers: {
			apikey: KEY,
			Authorization: `Bearer ${KEY}`,
			'Content-Type': IMAGE_EXT[ext],
			'Cache-Control': 'public, max-age=31536000, immutable',
		},
		body: fs.readFileSync(file),
	});
	if (!res.ok) throw new Error(`Storage ${res.status} (${path.basename(file)}): ${await res.text()}`);
	return key;
}

async function pool(items, size, fn) {
	let i = 0;
	await Promise.all(
		Array.from({ length: size }, async () => {
			while (i < items.length) {
				const idx = i++;
				await fn(items[idx], idx);
			}
		})
	);
}

console.log('\n== Gravando ==');
for (const p of plan) {
	const [collection] = await (await rest(`catalog_collections?slug=eq.${p.slug}&select=id`)).json();
	if (!collection) {
		console.log(`[${p.slug}] coleção não existe no banco (rode supabase/produtos.sql). Pulando.`);
		continue;
	}
	const existing = await (await rest(`catalog_collection_products?collection_id=eq.${collection.id}&select=product_id&limit=1`)).json();
	if (existing.length) {
		console.log(`[${p.slug}] já tem produtos no banco. Pulando para não duplicar.`);
		continue;
	}

	const categoryIds = new Map();
	if (p.categories.length) {
		const created = await insert(
			'catalog_categories',
			p.categories.map((c) => ({ collection_id: collection.id, name: c.name, position: c.position }))
		);
		created.forEach((row, i) => categoryIds.set(p.categories[i].raw, row.id));
	}

	let done = 0;
	await pool(p.entries, 6, async (entry) => {
		const imagePath = await upload(entry.file, entry.ext);
		const categoryId = entry.rawCategory ? categoryIds.get(entry.rawCategory) : null;
		let mainId;

		if (entry.items.length === 1) {
			const [i] = entry.items;
			const [row] = await insert('catalog_products', {
				kind: 'product', name: i.name, notes: i.notes || null, price: i.price, price_from: i.priceFrom, image_path: imagePath,
			});
			mainId = row.id;
		} else {
			// Vários itens no nome do arquivo => kit (foto do kit) + um produto sem foto por item.
			const components = await insert(
				'catalog_products',
				entry.items.map((i) => ({ kind: 'product', name: i.name, notes: i.notes || null, price: i.price, price_from: i.priceFrom }))
			);
			const [kit] = await insert('catalog_products', {
				kind: 'kit', name: entry.items.map((i) => i.name).join(' + '), price: null, image_path: imagePath,
			});
			await insert('catalog_kit_items', components.map((c, position) => ({ kit_id: kit.id, product_id: c.id, position })));
			mainId = kit.id;
		}

		await insert('catalog_collection_products', { collection_id: collection.id, product_id: mainId, category_id: categoryId });
		done++;
		if (done % 25 === 0) console.log(`[${p.slug}] ${done}/${p.entries.length}`);
	});
	console.log(`[${p.slug}] ${done}/${p.entries.length} importados.`);
}
console.log('\nConcluído.');
