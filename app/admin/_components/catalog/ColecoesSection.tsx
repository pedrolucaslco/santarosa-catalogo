'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { StatusMessage, Spinner } from './Message';
import { btnPrimary, field, iconBtn } from './ui';
import type { CatalogApi } from './useCatalog';

/** Input que salva ao sair do campo / Enter (como as células da roleta). */
function InlineText({ value, onCommit, label }: { value: string; onCommit: (v: string) => void; label: string }) {
	const [draft, setDraft] = useState(value);

	return (
		<input
			aria-label={label}
			className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-red-950 hover:border-red-950/15 focus:border-red-950 focus:bg-white focus:outline-none"
			value={draft}
			maxLength={60}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={() => {
				const v = draft.trim();

				if (!v) setDraft(value);
				else if (v !== value) onCommit(v);
			}}
			onKeyDown={(e) => {
				if (e.key === 'Enter') e.currentTarget.blur();
				if (e.key === 'Escape') {
					setDraft(value);
					e.currentTarget.blur();
				}
			}}
		/>
	);
}

const slugify = (s: string) =>
	s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function ColecoesSection({ api }: { api: CatalogApi }) {
	const { data, loading, pending, message } = api;
	const [newName, setNewName] = useState('');
	const [newSlug, setNewSlug] = useState('');
	const [newCategory, setNewCategory] = useState<Record<string, string>>({});

	const countFor = (collectionId: string) => data.products.filter((p) => p.links.some((l) => l.collectionId === collectionId)).length;

	const createCollection = async () => {
		const ok = await api.call('POST', '/api/admin/catalog', { type: 'collection', name: newName, slug: newSlug || slugify(newName) }, 'Coleção criada.');

		if (ok) {
			setNewName('');
			setNewSlug('');
		}
	};

	const move = (collectionId: string, ids: string[], index: number, direction: -1 | 1) => {
		const order = [...ids];
		const target = index + direction;

		if (target < 0 || target >= order.length) return;

		[order[index], order[target]] = [order[target], order[index]];
		void api.call('PATCH', '/api/admin/catalog', { type: 'category', collectionId, order }, 'Ordem atualizada.');
	};

	return (
		<div className="flex flex-col gap-5">
			<header className="flex items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Coleções e categorias</h1>
					<p className="text-sm text-stone-600">As categorias aparecem na página na ordem abaixo. Edite o nome direto no campo.</p>
				</div>
				<span className="flex items-center gap-1.5 text-xs text-stone-500" aria-live="polite">
					{pending > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
				</span>
			</header>

			<StatusMessage message={message} />

			{loading ? (
				<Spinner />
			) : (
				<div className="flex flex-col gap-4">
					{data.collections.map((c) => {
						const cats = data.categories.filter((cat) => cat.collectionId === c.id);
						const ids = cats.map((cat) => cat.id);

						return (
							<section key={c.id} className="rounded-2xl border border-red-950/10 bg-white p-4">
								<div className="flex flex-wrap items-center gap-3">
									<div className="min-w-[200px] flex-1">
										<InlineText label="Nome da coleção" value={c.name} onCommit={(name) => void api.call('PATCH', '/api/admin/catalog', { type: 'collection', id: c.id, name }, 'Salvo.')} />
										<p className="px-2 text-xs text-stone-500">
											slug <code>{c.slug}</code> · {countFor(c.id)} produtos · API <code>/api/collections/{c.slug}/products</code>
										</p>
									</div>
									<label className="flex cursor-pointer items-center gap-2 text-sm">
										<input type="checkbox" checked={c.active} className="h-4 w-4 accent-[#875F53]" onChange={(e) => void api.call('PATCH', '/api/admin/catalog', { type: 'collection', id: c.id, active: e.target.checked }, e.target.checked ? 'Coleção ativada.' : 'Coleção desativada.')} />
										Ativa
									</label>
									<button type="button" aria-label="Excluir coleção" className={iconBtn} onClick={() => {
										if (window.confirm(`Excluir a coleção "${c.name}"? Os produtos continuam existindo, só saem dela.`)) void api.call('DELETE', '/api/admin/catalog', { type: 'collection', id: c.id }, 'Coleção excluída.');
									}}>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>

								<ul className="mt-3 flex flex-col">
									{cats.map((cat, index) => (
										<li key={cat.id} className="flex items-center gap-1 border-t border-red-950/10 py-1">
											<button type="button" disabled={index === 0} onClick={() => move(c.id, ids, index, -1)} aria-label="Subir" className={iconBtn}><ArrowUp className="h-4 w-4" /></button>
											<button type="button" disabled={index === cats.length - 1} onClick={() => move(c.id, ids, index, 1)} aria-label="Descer" className={iconBtn}><ArrowDown className="h-4 w-4" /></button>
											<div className="flex-1">
												<InlineText label="Nome da categoria" value={cat.name} onCommit={(name) => void api.call('PATCH', '/api/admin/catalog', { type: 'category', id: cat.id, name }, 'Salvo.')} />
											</div>
											<span className="shrink-0 text-xs text-stone-500">
												{data.products.filter((p) => p.links.some((l) => l.categoryId === cat.id)).length}
											</span>
											<button type="button" aria-label="Excluir categoria" className={iconBtn} onClick={() => {
												if (window.confirm(`Excluir a categoria "${cat.name}"? Os produtos ficam sem categoria.`)) void api.call('DELETE', '/api/admin/catalog', { type: 'category', id: cat.id }, 'Categoria excluída.');
											}}>
												<Trash2 className="h-4 w-4" />
											</button>
										</li>
									))}
									{cats.length === 0 && <li className="py-2 text-xs text-stone-500">Sem categorias — os produtos aparecem em “Mais opções”.</li>}
								</ul>

								<form className="mt-2 flex gap-2" onSubmit={async (e) => {
									e.preventDefault();
									const name = (newCategory[c.id] ?? '').trim();

									if (!name) return;
									if (await api.call('POST', '/api/admin/catalog', { type: 'category', collectionId: c.id, name }, 'Categoria criada.')) setNewCategory((s) => ({ ...s, [c.id]: '' }));
								}}>
									<input className={field} placeholder="Nova categoria" maxLength={60} value={newCategory[c.id] ?? ''} onChange={(e) => setNewCategory((s) => ({ ...s, [c.id]: e.target.value }))} />
									<button type="submit" className={btnPrimary}><Plus className="h-4 w-4" /> Adicionar</button>
								</form>
							</section>
						);
					})}

					<form className="rounded-2xl border border-dashed border-red-950/15 p-4" onSubmit={(e) => { e.preventDefault(); void createCollection(); }}>
						<p className="text-sm font-medium">Nova coleção</p>
						<p className="text-xs text-stone-500">Cria a coleção e a API <code>/api/collections/&lt;slug&gt;/products</code>. A página pública (rota) de uma coleção nova ainda precisa ser criada no código.</p>
						<div className="mt-2 flex flex-wrap gap-2">
							<input className={`${field} min-w-[200px] flex-1`} placeholder="Nome (ex.: Dia das Mães)" maxLength={60} value={newName} onChange={(e) => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }} />
							<input className={`${field} w-48`} placeholder="slug" maxLength={40} value={newSlug} onChange={(e) => setNewSlug(slugify(e.target.value))} />
							<button type="submit" disabled={!newName.trim() || !newSlug} className={btnPrimary}><Plus className="h-4 w-4" /> Criar</button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
