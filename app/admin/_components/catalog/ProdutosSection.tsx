'use client';

import { useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { AdminProduct, ProductKind } from '@/lib/catalog/types';
import { StatusMessage, Spinner } from './Message';
import { ProductEditor } from './ProductEditor';
import { btn, btnPrimary, field, iconBtn, money } from './ui';
import type { CatalogApi } from './useCatalog';

const PAGE = 100;

export function ProdutosSection({ api }: { api: CatalogApi }) {
	const { data, loading, pending, message } = api;
	const [search, setSearch] = useState('');
	const [collection, setCollection] = useState('all');
	const [status, setStatus] = useState<'all' | 'active' | 'hidden'>('all');
	const [limit, setLimit] = useState(PAGE);
	const [editing, setEditing] = useState<{ product: AdminProduct | null; kind: ProductKind } | null>(null);

	const collectionName = (id: string) => data.collections.find((c) => c.id === id)?.name ?? '?';
	const categoryName = (id: string | null) => data.categories.find((c) => c.id === id)?.name;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();

		return data.products.filter((p) => {
			if (q && !p.name.toLowerCase().includes(q) && !p.notes.toLowerCase().includes(q)) return false;
			if (status === 'active' && !p.active) return false;
			if (status === 'hidden' && p.active) return false;
			if (collection === 'none') return p.links.length === 0;
			if (collection !== 'all') return p.links.some((l) => l.collectionId === collection);

			return true;
		});
	}, [data.products, search, collection, status]);

	const toInput = (p: AdminProduct, active: boolean) => ({
		kind: p.kind,
		name: p.name,
		notes: p.notes,
		price: p.price,
		priceFrom: p.priceFrom,
		active,
		imagePath: p.imagePath,
		items: p.items,
		links: p.links,
	});

	const toggle = (p: AdminProduct) =>
		void api.call('PATCH', '/api/admin/products', { id: p.id, product: toInput(p, !p.active) }, p.active ? 'Produto ocultado.' : 'Produto reativado.');

	const remove = (p: AdminProduct) => {
		if (!window.confirm(`Excluir "${p.name}"? Isso apaga o produto e a foto. Para só esconder, use o olho.`)) return;

		void api.call('DELETE', '/api/admin/products', { id: p.id }, 'Produto excluído.');
	};

	return (
		<div className="flex flex-col gap-5">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Produtos</h1>
					<p className="text-sm text-white/60">Produtos e kits de todas as coleções. {data.products.length} no total.</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="flex items-center gap-1.5 text-xs text-white/50" aria-live="polite">
						{pending > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
					</span>
					<button type="button" onClick={() => setEditing({ product: null, kind: 'kit' })} className={btn}>
						<Package className="h-4 w-4" /> Novo kit
					</button>
					<button type="button" onClick={() => setEditing({ product: null, kind: 'product' })} className={btnPrimary}>
						<Plus className="h-4 w-4" /> Novo produto
					</button>
				</div>
			</header>

			<div className="flex flex-wrap gap-2">
				<div className="relative min-w-[220px] flex-1">
					<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
					<input className={`${field} pl-9`} placeholder="Buscar por nome ou observação" value={search} onChange={(e) => { setSearch(e.target.value); setLimit(PAGE); }} />
				</div>
				<select aria-label="Coleção" className={`${field} w-auto`} value={collection} onChange={(e) => { setCollection(e.target.value); setLimit(PAGE); }}>
					<option value="all">Todas as coleções</option>
					{data.collections.map((c) => (
						<option key={c.id} value={c.id}>{c.name}</option>
					))}
					<option value="none">Sem coleção</option>
				</select>
				<select aria-label="Situação" className={`${field} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setLimit(PAGE); }}>
					<option value="all">Todos</option>
					<option value="active">Ativos</option>
					<option value="hidden">Ocultos</option>
				</select>
			</div>

			<StatusMessage message={editing ? null : message} />

			{loading ? (
				<Spinner />
			) : data.products.length === 0 ? (
				<p className="rounded-2xl border border-white/10 bg-[#202020] px-4 py-10 text-center text-sm text-white/60">
					Nenhum produto ainda. Rode <code>node scripts/import-products.mjs --apply</code> para importar as pastas atuais, ou crie um produto.
				</p>
			) : (
				<div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#202020]">
					<table className="w-full min-w-[820px] border-collapse text-left text-sm">
						<thead>
							<tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
								<th className="w-16 px-3 py-3 font-medium" />
								<th className="px-3 py-3 font-medium">Produto</th>
								<th className="w-36 px-3 py-3 font-medium">Preço</th>
								<th className="px-3 py-3 font-medium">Coleções</th>
								<th className="w-32 px-3 py-3" />
							</tr>
						</thead>
						<tbody>
							{filtered.slice(0, limit).map((p) => (
								<tr key={p.id} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.02] ${p.active ? '' : 'opacity-50'}`}>
									<td className="px-3 py-2">
										<div className="h-12 w-12 overflow-hidden rounded-lg bg-black/30">
											{p.imageUrl && (
												// eslint-disable-next-line @next/next/no-img-element
												<img src={p.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
											)}
										</div>
									</td>
									<td className="px-3 py-2">
										<p className="font-medium">
											{p.name}
											{p.kind === 'kit' && <span className="ml-2 rounded-full bg-[#D3972F]/20 px-2 py-0.5 text-[11px] text-[#DEB163]">kit · {p.items.length} itens</span>}
										</p>
										{p.notes && <p className="text-xs text-white/50">{p.notes}</p>}
									</td>
									<td className="px-3 py-2">
										{p.priceFrom !== null && <p className="text-xs text-white/40 line-through">{money(p.priceFrom)}</p>}
										<p>{p.price === null ? 'soma dos itens' : money(p.price)}</p>
									</td>
									<td className="px-3 py-2">
										<div className="flex flex-wrap gap-1">
											{p.links.length === 0 && <span className="text-xs text-white/30">Sem coleção</span>}
											{p.links.map((l) => (
												<span key={l.collectionId} className={`rounded-full border px-2 py-0.5 text-[11px] ${l.active ? 'border-white/15 text-white/70' : 'border-white/10 text-white/30 line-through'}`}>
													{collectionName(l.collectionId)}
													{categoryName(l.categoryId) ? ` · ${categoryName(l.categoryId)}` : ''}
													{l.price !== null ? ` · ${money(l.price)}` : ''}
												</span>
											))}
										</div>
									</td>
									<td className="px-3 py-2">
										<div className="flex justify-end">
											<button type="button" className={iconBtn} aria-label={p.active ? 'Ocultar' : 'Reativar'} title={p.active ? 'Ocultar' : 'Reativar'} onClick={() => toggle(p)}>
												{p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
											</button>
											<button type="button" className={iconBtn} aria-label="Editar" title="Editar" onClick={() => setEditing({ product: p, kind: p.kind })}>
												<Pencil className="h-4 w-4" />
											</button>
											<button type="button" className={iconBtn} aria-label="Excluir" title="Excluir" onClick={() => remove(p)}>
												<Trash2 className="h-4 w-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{filtered.length === 0 && <p className="px-4 py-8 text-center text-sm text-white/50">Nenhum produto com esses filtros.</p>}
					{filtered.length > limit && (
						<div className="border-t border-white/10 p-3 text-center">
							<button type="button" className={btn} onClick={() => setLimit((n) => n + PAGE)}>
								Mostrar mais ({filtered.length - limit} restantes)
							</button>
						</div>
					)}
				</div>
			)}

			{editing && <ProductEditor api={api} product={editing.product} kind={editing.kind} onClose={() => setEditing(null)} />}
		</div>
	);
}
