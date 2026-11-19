'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AdminPrize {
	id: string;
	label: string;
	description: string;
	color: string;
	textColor: string;
	isWin: boolean;
	weight: number;
	maxCount: number | null;
	awarded: number;
}

interface Draft {
	label: string;
	description: string;
	color: string;
	textColor: string;
	maxCount: string; // vazio = ilimitado
	weight: string;
}

const toDraft = (prize: AdminPrize): Draft => ({
	label: prize.label,
	description: prize.description,
	color: prize.color,
	textColor: prize.textColor,
	maxCount: prize.maxCount === null ? '' : String(prize.maxCount),
	weight: String(prize.weight),
});

const isDirty = (prize: AdminPrize, draft: Draft) =>
	JSON.stringify(toDraft(prize)) !== JSON.stringify(draft);

export function AdminPanel() {
	const router = useRouter();
	const [prizes, setPrizes] = useState<AdminPrize[]>([]);
	const [drafts, setDrafts] = useState<Record<string, Draft>>({});
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

	const applyPrizes = useCallback((next: AdminPrize[]) => {
		setPrizes(next);
		setDrafts(Object.fromEntries(next.map((prize) => [prize.id, toDraft(prize)])));
	}, []);

	const call = useCallback(
		async (method: string, url: string, body?: unknown, success?: string) => {
			setBusy(true);
			setMessage(null);

			try {
				const send = () =>
					fetch(url, {
						method,
						headers: { 'Content-Type': 'application/json' },
						body: body === undefined ? undefined : JSON.stringify(body),
					});

				let response = await send();

				// Sessão expirada: tenta renovar uma vez antes de pedir login de novo.
				if (response.status === 401) {
					const refreshed = await fetch('/api/admin/refresh', { method: 'POST' });

					if (refreshed.ok) response = await send();
				}

				const data = await response.json().catch(() => null);

				if (response.status === 401) {
					router.refresh();
					return;
				}

				if (!response.ok || !data?.ok) {
					setMessage({ type: 'error', text: data?.error ?? 'Algo deu errado.' });
					return;
				}

				applyPrizes(data.prizes);
				if (success) setMessage({ type: 'ok', text: success });
			} catch {
				setMessage({ type: 'error', text: 'Falha de conexão.' });
			} finally {
				setBusy(false);
				setLoading(false);
			}
		},
		[applyPrizes, router]
	);

	useEffect(() => {
		void call('GET', '/api/admin/prizes');
	}, [call]);

	const setField = (id: string, field: keyof Draft, value: string) =>
		setDrafts((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));

	const save = (prize: AdminPrize) => {
		const draft = drafts[prize.id];
		const max = draft.maxCount.trim();

		void call(
			'PATCH',
			'/api/admin/prizes',
			{
				id: prize.id,
				changes: {
					label: draft.label,
					description: draft.description,
					color: draft.color,
					textColor: draft.textColor,
					maxCount: max === '' ? null : Number(max),
					weight: Number(draft.weight),
				},
			},
			`"${draft.label}" salvo.`
		);
	};

	const move = (index: number, direction: -1 | 1) => {
		const order = prizes.map((prize) => prize.id);
		const target = index + direction;

		if (target < 0 || target >= order.length) return;

		[order[index], order[target]] = [order[target], order[index]];
		void call('PATCH', '/api/admin/prizes', { order }, 'Ordem atualizada.');
	};

	const remove = (prize: AdminPrize) => {
		if (!window.confirm(`Excluir "${prize.label}"? Isso remove a fatia da roleta.`)) return;

		void call('DELETE', '/api/admin/prizes', { id: prize.id }, 'Prêmio excluído.');
	};

	const resetOne = (prize: AdminPrize) => {
		if (!window.confirm(`Zerar o contador de "${prize.label}"?`)) return;

		void call('POST', '/api/admin/reset', { id: prize.id }, 'Contador zerado.');
	};

	const resetAll = () => {
		if (!window.confirm('Zerar o contador de TODOS os prêmios? Todo o estoque volta ao máximo.')) return;

		void call('POST', '/api/admin/reset', {}, 'Todos os contadores foram zerados.');
	};

	const add = () =>
		void call(
			'POST',
			'/api/admin/prizes',
			{ label: 'Novo prêmio', maxCount: 1 },
			'Prêmio adicionado. Edite o nome e salve.'
		);

	const logout = async () => {
		await fetch('/api/admin/logout', { method: 'POST' });
		router.refresh();
	};

	const totalMax = prizes.reduce((sum, prize) => sum + (prize.maxCount ?? 0), 0);
	const totalAwarded = prizes.reduce((sum, prize) => sum + prize.awarded, 0);
	const hasUnlimited = prizes.some((prize) => prize.maxCount === null);

	return (
		<div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Admin da roleta</h1>
					<p className="text-sm text-white/60">
						{hasUnlimited
							? `${totalAwarded} giros sorteados`
							: `${totalAwarded} de ${totalMax} prêmios já sorteados`}
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					<Button type="button" onClick={add} disabled={busy} className="bg-[#D3972F] text-white hover:bg-[#B07D24]">
						<Plus className="mr-1 h-4 w-4" /> Adicionar prêmio
					</Button>
					<Button type="button" onClick={resetAll} disabled={busy} variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
						<RotateCcw className="mr-1 h-4 w-4" /> Zerar todos os contadores
					</Button>
					<Button type="button" onClick={() => void logout()} variant="ghost" className="text-white/70 hover:bg-white/10 hover:text-white">
						Sair
					</Button>
				</div>
			</header>

			{message && (
				<p
					role={message.type === 'error' ? 'alert' : 'status'}
					className={`rounded-xl border px-4 py-3 text-sm ${
						message.type === 'error'
							? 'border-red-500/30 bg-red-500/10 text-red-200'
							: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
					}`}
				>
					{message.text}
				</p>
			)}

			{loading ? (
				<div className="flex justify-center py-16">
					<Loader2 className="h-6 w-6 animate-spin text-[#D3972F]" />
				</div>
			) : (
				<ul className="flex flex-col gap-3">
					{prizes.map((prize, index) => {
						const draft = drafts[prize.id];

						if (!draft) return null;

						const remaining = prize.maxCount === null ? null : Math.max(0, prize.maxCount - prize.awarded);

						return (
							<li key={prize.id} className="rounded-2xl border border-white/10 bg-[#202020] p-4">
								<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<span
											className="h-5 w-5 rounded-full border border-white/20"
											style={{ background: draft.color }}
											aria-hidden
										/>
										<span className="text-sm text-white/70">
											Saíram <strong className="text-white">{prize.awarded}</strong>
											{prize.maxCount === null ? ' (ilimitado)' : ` de ${prize.maxCount}`}
											{remaining !== null && (
												<span className={remaining === 0 ? ' text-red-300' : ''}>
													{' '}
													· restam {remaining}
												</span>
											)}
										</span>
									</div>
									<div className="flex gap-1">
										<Button type="button" size="icon" variant="ghost" disabled={busy || index === 0} onClick={() => move(index, -1)} aria-label="Subir" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
											<ArrowUp className="h-4 w-4" />
										</Button>
										<Button type="button" size="icon" variant="ghost" disabled={busy || index === prizes.length - 1} onClick={() => move(index, 1)} aria-label="Descer" className="h-8 w-8 text-white/70 hover:bg-white/10 hover:text-white">
											<ArrowDown className="h-4 w-4" />
										</Button>
									</div>
								</div>

								<div className="grid gap-3 sm:grid-cols-2">
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`label-${prize.id}`}>Nome na roleta</Label>
										<Input id={`label-${prize.id}`} value={draft.label} maxLength={40} onChange={(e) => setField(prize.id, 'label', e.target.value)} className="border-white/10 bg-black/30 text-white" />
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`desc-${prize.id}`}>Descrição (tela do resultado)</Label>
										<Input id={`desc-${prize.id}`} value={draft.description} maxLength={140} onChange={(e) => setField(prize.id, 'description', e.target.value)} className="border-white/10 bg-black/30 text-white" />
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`max-${prize.id}`}>Quantidade máxima (vazio = ilimitado)</Label>
										<Input id={`max-${prize.id}`} type="number" min={0} inputMode="numeric" value={draft.maxCount} onChange={(e) => setField(prize.id, 'maxCount', e.target.value)} className="border-white/10 bg-black/30 text-white" />
									</div>
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={`weight-${prize.id}`}>Peso (só vale se ilimitado)</Label>
										<Input id={`weight-${prize.id}`} type="number" min={1} max={1000} value={draft.weight} onChange={(e) => setField(prize.id, 'weight', e.target.value)} className="border-white/10 bg-black/30 text-white" />
									</div>
									<div className="flex items-end gap-4">
										<div className="flex flex-col gap-1.5">
											<Label htmlFor={`color-${prize.id}`}>Cor da fatia</Label>
											<input id={`color-${prize.id}`} type="color" value={draft.color} onChange={(e) => setField(prize.id, 'color', e.target.value)} className="h-10 w-16 cursor-pointer rounded-md border border-white/10 bg-black/30" />
										</div>
										<div className="flex flex-col gap-1.5">
											<Label htmlFor={`tcolor-${prize.id}`}>Cor do texto</Label>
											<input id={`tcolor-${prize.id}`} type="color" value={draft.textColor} onChange={(e) => setField(prize.id, 'textColor', e.target.value)} className="h-10 w-16 cursor-pointer rounded-md border border-white/10 bg-black/30" />
										</div>
									</div>
									<div className="flex flex-wrap items-end justify-end gap-2">
										<Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => resetOne(prize)} className="border-white/20 bg-transparent text-white hover:bg-white/10">
											<RotateCcw className="mr-1 h-4 w-4" /> Zerar
										</Button>
										<Button type="button" size="sm" variant="outline" disabled={busy || prizes.length <= 1} onClick={() => remove(prize)} className="border-red-500/40 bg-transparent text-red-300 hover:bg-red-500/10">
											<Trash2 className="mr-1 h-4 w-4" /> Excluir
										</Button>
										<Button type="button" size="sm" disabled={busy || !isDirty(prize, draft)} onClick={() => save(prize)} className="bg-[#D3972F] text-white hover:bg-[#B07D24]">
											<Save className="mr-1 h-4 w-4" /> Salvar
										</Button>
									</div>
								</div>
							</li>
						);
					})}
				</ul>
			)}

			<p className="text-xs leading-5 text-white/50">
				Reduzir a quantidade máxima abaixo do que já saiu esgota o prêmio, sem apagar o histórico.
				Zerar contadores não libera novos giros para quem já participou: o controle de 1 giro por
				participante continua nos cookies e nas liberações da atendente.
			</p>
		</div>
	);
}
