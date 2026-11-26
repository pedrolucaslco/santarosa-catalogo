#!/usr/bin/env node
// Compara a API antiga (pastas) com a nova (Supabase), por coleção.
//   node scripts/compare-products.mjs [http://localhost:3100]
const BASE = process.argv[2] ?? 'http://localhost:3100';
const PAIRS = [
	{ slug: 'catalogo', old: '/api/products' },
	{ slug: 'liquida', old: '/api/liquida-products' },
	{ slug: 'black', old: '/api/black-products' },
];

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const price = (v) => (v ? String(v).replace(/\s/g, '') : '');
const cat = (c) => norm(String(c ?? '').replace(/^\d+\.\s*/, ''));
// chave de comparação: categoria | nomes dos itens | preço | de
const key = (p) => {
	const items = p.items?.length ? p.items : [{ name: p.name, price: p.price, priceFrom: p.priceFrom }];
	return `${cat(p.category)}|${items.map((i) => `${norm(i.name)}@${price(i.price)}/${price(i.priceFrom)}`).join('+')}`;
};

const get = async (path) => {
	const res = await fetch(BASE + path);
	if (!res.ok) throw new Error(`${path} -> ${res.status}`);
	return res.json();
};
const count = (list) => list.reduce((m, p) => m.set(key(p), (m.get(key(p)) ?? 0) + 1), new Map());

let bad = 0;
for (const { slug, old } of PAIRS) {
	let a, b;
	try {
		[a, b] = await Promise.all([get(old), get(`/api/collections/${slug}/products`)]);
	} catch (e) {
		console.log(`[${slug}] erro: ${e.message}`);
		bad++;
		continue;
	}
	const ca = count(a), cb = count(b);
	const onlyOld = [...ca].filter(([k, n]) => n > (cb.get(k) ?? 0)).map(([k]) => k);
	const onlyNew = [...cb].filter(([k, n]) => n > (ca.get(k) ?? 0)).map(([k]) => k);
	// Diferença esperada: a observação saiu do nome (nome novo é prefixo do antigo, mesma categoria/preço).
	const split = (k) => { const [c, rest] = k.split('|'); const [n, p] = rest.split('@'); return { c, n, p }; };
	const expected = [];
	for (const o of [...onlyOld]) {
		const so = split(o);
		const i = onlyNew.findIndex((n) => { const sn = split(n); return sn.c === so.c && sn.p === so.p && so.n.startsWith(sn.n); });
		if (i >= 0) { expected.push(o); onlyNew.splice(i, 1); onlyOld.splice(onlyOld.indexOf(o), 1); }
	}
	console.log(`[${slug}] antiga: ${a.length} | nova: ${b.length} | só na antiga: ${onlyOld.length} | só na nova: ${onlyNew.length} | observações movidas p/ campo próprio: ${expected.length}`);
	for (const k of onlyOld) console.log('   - antiga:', k);
	for (const k of onlyNew) console.log('   + nova:  ', k);
	if (onlyOld.length || onlyNew.length || a.length !== b.length) bad++;
}
process.exit(bad ? 1 : 0);
