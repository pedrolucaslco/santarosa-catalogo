'use client';

import { useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import { optimizeImage } from '@/lib/catalog/optimize-image';
import { parseBRL } from '@/lib/catalog/price';
import type { AdminProduct, ProductKind } from '@/lib/catalog/types';
import type { CatalogApi } from './useCatalog';
import { brl, btn, btnPrimary, field, iconBtn, money } from './ui';

interface LinkForm {
	on: boolean;
	categoryId: string;
	price: string;
	priceFrom: string;
	active: boolean;
}

interface Form {
	kind: ProductKind;
	name: string;
	notes: string;
	price: string;
	priceFrom: string;
	active: boolean;
	imagePath: string | null;
	imageUrl: string;
	links: Record<string, LinkForm>;
	items: string[];
}

function initialForm(api: CatalogApi, product: AdminProduct | null, kind: ProductKind): Form {
	const links: Record<string, LinkForm> = {};

	for (const c of api.data.collections) {
		const existing = product?.links.find((l) => l.collectionId === c.id);

		links[c.id] = {
			on: Boolean(existing),
			categoryId: existing?.categoryId ?? '',
			price: brl(existing?.price),
			priceFrom: brl(existing?.priceFrom),
			active: existing?.active ?? true,
		};
	}

	return {
		kind: product?.kind ?? kind,
		name: product?.name ?? '',
		notes: product?.notes ?? '',
		price: brl(product?.price),
		priceFrom: brl(product?.priceFrom),
		active: product?.active ?? true,
		imagePath: product?.imagePath ?? null,
		imageUrl: product?.imageUrl ?? '',
		links,
		items: product?.items ?? [],
	};
}

export function ProductEditor({
	api,
	product,
	kind,
	onClose,
}: {
	api: CatalogApi;
	product: AdminProduct | null;
	kind: ProductKind;
	onClose: () => void;
}) {
	const [form, setForm] = useState<Form>(() => initialForm(api, product, kind));
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [itemSearch, setItemSearch] = useState('');
	const fileRef = useRef<HTMLInputElement>(null);
	const isKit = form.kind === 'kit';
	const { collections, categories, products } = api.data;

	const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));
	const setLink = (id: string, changes: Partial<LinkForm>) =>
		setForm((f) => ({ ...f, links: { ...f.links, [id]: { ...f.links[id], ...changes } } }));

	const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
	const itemsSum = form.items.reduce((acc, id) => acc + (productById.get(id)?.price ?? 0), 0);

	const candidates = useMemo(() => {
		const q = itemSearch.trim().toLowerCase();

		return products
			.filter((p) => p.kind === 'product' && !form.items.includes(p.id) && (!q || p.name.toLowerCase().includes(q)))
			.slice(0, 8);
	}, [products, form.items, itemSearch]);

	async function uploadFile(file: File) {
		setUploading(true);
		setError(null);

		try {
			const optimized = await optimizeImage(file);
			const send = () => {
				const body = new FormData();

				body.append('file', optimized);

				return fetch('/api/admin/upload', { method: 'POST', body });
			};

			let response = await send();

			if (response.status === 401 && (await fetch('/api/admin/refresh', { method: 'POST' })).ok) {
				response = await send();
			}

			const json = await response.json().catch(() => null);

			if (!response.ok || !json?.ok) throw new Error(json?.error ?? 'Erro ao enviar a imagem.');

			setForm((f) => ({ ...f, imagePath: json.path, imageUrl: json.url }));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Erro ao enviar a imagem.');
		} finally {
			setUploading(false);
		}
	}

	async function save() {
		setError(null);

		const payload = {
			kind: form.kind,
			name: form.name,
			notes: form.notes,
			price: parseBRL(form.price),
			priceFrom: parseBRL(form.priceFrom),
			active: form.active,
			imagePath: form.imagePath,
			items: form.items,
			links: Object.entries(form.links)
				.filter(([, l]) => l.on)
				.map(([collectionId, l]) => ({
					collectionId,
					categoryId: l.categoryId || null,
					price: parseBRL(l.price),
					priceFrom: parseBRL(l.priceFrom),
					active: l.active,
				})),
		};

		setSaving(true);

		const ok = product
			? await api.call('PATCH', '/api/admin/products', { id: product.id, product: payload }, 'Produto salvo.')
			: await api.call('POST', '/api/admin/products', { product: payload }, 'Produto criado.');

		setSaving(false);

		if (ok) onClose();
		else setError(null);
	}

	const shownError = error ?? (api.message?.type === 'error' ? api.message.text : null);

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-3 sm:p-6" role="dialog" aria-modal="true">
			<div className="mx-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-[#202020] p-4 sm:p-6">
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-xl font-semibold">
						{product ? 'Editar' : 'Novo'} {isKit ? 'kit' : 'produto'}
					</h2>
					<button type="button" onClick={onClose} aria-label="Fechar" className={iconBtn}>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex gap-4">
						<div className="shrink-0">
							<div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
								{form.imageUrl ? (
									// eslint-disable-next-line @next/next/no-img-element
									<img src={form.imageUrl} alt="" className="h-full w-full object-cover" />
								) : (
									<ImagePlus className="h-8 w-8 text-white/25" />
								)}
							</div>
							<input
								ref={fileRef}
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => {
									const file = e.target.files?.[0];

									if (file) void uploadFile(file);
									e.target.value = '';
								}}
							/>
							<div className="mt-2 flex gap-1">
								<button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className={`${btn} flex-1 justify-center px-2 py-1.5 text-xs`}>
									{uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
									{form.imageUrl ? 'Trocar' : 'Enviar foto'}
								</button>
								{form.imageUrl && (
									<button type="button" onClick={() => setForm((f) => ({ ...f, imagePath: null, imageUrl: '' }))} aria-label="Remover foto" className={iconBtn}>
										<Trash2 className="h-4 w-4" />
									</button>
								)}
							</div>
						</div>

						<div className="flex min-w-0 flex-1 flex-col gap-3">
							<label className="text-xs text-white/60">
								Nome
								<input className={`${field} mt-1`} value={form.name} maxLength={140} onChange={(e) => set('name', e.target.value)} />
							</label>
							<label className="text-xs text-white/60">
								Observações (aparecem abaixo do nome)
								<input className={`${field} mt-1`} value={form.notes} maxLength={200} placeholder="Ex.: Disponível letra B e E" onChange={(e) => set('notes', e.target.value)} />
							</label>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<label className="text-xs text-white/60">
							{isKit ? 'Preço do kit (vazio = soma dos itens)' : 'Preço “por” (R$)'}
							<input className={`${field} mt-1`} inputMode="decimal" value={form.price} placeholder={isKit ? brl(itemsSum) : '99,90'} onChange={(e) => set('price', e.target.value)} />
						</label>
						<label className="text-xs text-white/60">
							Preço “de” (R$) — opcional, riscado
							<input className={`${field} mt-1`} inputMode="decimal" value={form.priceFrom} placeholder="Sem promoção" onChange={(e) => set('priceFrom', e.target.value)} />
						</label>
					</div>

					{isKit && (
						<div className="rounded-xl border border-white/10 p-3">
							<p className="text-sm font-medium">Produtos do kit <span className="font-normal text-white/50">(soma: {money(itemsSum)})</span></p>
							<ul className="mt-2 flex flex-col gap-1">
								{form.items.map((id) => (
									<li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-black/20 px-3 py-1.5 text-sm">
										<span className="truncate">{productById.get(id)?.name ?? 'Produto removido'}</span>
										<span className="flex shrink-0 items-center gap-2 text-white/60">
											{money(productById.get(id)?.price)}
											<button type="button" aria-label="Remover do kit" className={iconBtn} onClick={() => set('items', form.items.filter((i) => i !== id))}>
												<X className="h-4 w-4" />
											</button>
										</span>
									</li>
								))}
							</ul>
							<input className={`${field} mt-2`} placeholder="Buscar produto para adicionar…" value={itemSearch} onChange={(e) => setItemSearch(e.target.value)} />
							<ul className="mt-1 flex flex-col">
								{candidates.map((p) => (
									<li key={p.id}>
										<button type="button" onClick={() => set('items', [...form.items, p.id])} className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-white/5">
											<span className="truncate">{p.name}</span>
											<span className="flex shrink-0 items-center gap-1 text-white/50">
												{money(p.price)} <Plus className="h-4 w-4" />
											</span>
										</button>
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="rounded-xl border border-white/10 p-3">
						<p className="text-sm font-medium">Coleções</p>
						<p className="text-xs text-white/50">Marque onde o produto aparece. Preço da coleção vazio = usa o preço do produto; se preencher, o par “por”/“de” da coleção substitui o do produto.</p>
						<div className="mt-3 flex flex-col gap-2">
							{collections.map((c) => {
								const l = form.links[c.id];
								const cats = categories.filter((cat) => cat.collectionId === c.id);

								return (
									<div key={c.id} className={`rounded-lg border p-2.5 ${l.on ? 'border-[#D3972F]/40 bg-[#D3972F]/5' : 'border-white/10'}`}>
										<label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
											<input type="checkbox" checked={l.on} onChange={(e) => setLink(c.id, { on: e.target.checked })} className="h-4 w-4 accent-[#D3972F]" />
											{c.name}
											{!c.active && <span className="text-xs font-normal text-white/40">(coleção inativa)</span>}
										</label>
										{l.on && (
											<div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
												<select aria-label="Categoria" className={field} value={l.categoryId} onChange={(e) => setLink(c.id, { categoryId: e.target.value })}>
													<option value="">Sem categoria</option>
													{cats.map((cat) => (
														<option key={cat.id} value={cat.id}>{cat.name}</option>
													))}
												</select>
												<input aria-label="Preço por nesta coleção" className={field} inputMode="decimal" placeholder="Preço aqui" value={l.price} onChange={(e) => setLink(c.id, { price: e.target.value })} />
												<input aria-label="Preço de nesta coleção" className={field} inputMode="decimal" placeholder="De aqui" disabled={!l.price} value={l.priceFrom} onChange={(e) => setLink(c.id, { priceFrom: e.target.value })} />
												<label className="flex items-center gap-2 text-xs text-white/70">
													<input type="checkbox" checked={l.active} onChange={(e) => setLink(c.id, { active: e.target.checked })} className="h-4 w-4 accent-[#D3972F]" />
													Visível aqui
												</label>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</div>

					<label className="flex cursor-pointer items-center gap-2 text-sm">
						<input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} className="h-4 w-4 accent-[#D3972F]" />
						Ativo (desmarque para ocultar de todas as páginas sem apagar)
					</label>

					{shownError && (
						<p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
							{shownError}
						</p>
					)}

					<div className="flex justify-end gap-2">
						<button type="button" onClick={onClose} className={btn}>Cancelar</button>
						<button type="button" disabled={saving || uploading} onClick={() => void save()} className={btnPrimary}>
							{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
