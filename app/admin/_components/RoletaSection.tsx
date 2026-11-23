'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SLICE_COLORS, TEXT_COLORS } from '@/app/roleta/_lib/palette';
import { ArrowDown, ArrowUp, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';

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

type Changes = Partial<Omit<AdminPrize, 'id' | 'awarded'>>;

const cell =
	'w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-sm text-white placeholder:text-white/30 hover:border-white/15 focus:border-[#D3972F] focus:bg-black/30 focus:outline-none';

/** Texto/número editável direto na célula: salva ao sair do campo ou com Enter. */
function TextCell({
	value,
	onCommit,
	type = 'text',
	maxLength,
	min,
	max,
	placeholder,
	className = '',
	label,
}: {
	value: string;
	onCommit: (value: string) => void;
	type?: 'text' | 'number';
	maxLength?: number;
	min?: number;
	max?: number;
	placeholder?: string;
	className?: string;
	label: string;
}) {
	const [draft, setDraft] = useState(value);
	const focused = useRef(false);

	useEffect(() => {
		if (!focused.current) setDraft(value);
	}, [value]);

	const commit = () => {
		focused.current = false;
		if (draft !== value) onCommit(draft);
	};

	return (
		<input
			aria-label={label}
			type={type}
			value={draft}
			maxLength={maxLength}
			min={min}
			max={max}
			placeholder={placeholder}
			inputMode={type === 'number' ? 'numeric' : undefined}
			onFocus={() => (focused.current = true)}
			onChange={(e) => setDraft(e.target.value)}
			onBlur={commit}
			onKeyDown={(e) => {
				if (e.key === 'Enter') e.currentTarget.blur();
				if (e.key === 'Escape') {
					setDraft(value);
					e.currentTarget.blur();
				}
			}}
			className={`${cell} ${className}`}
		/>
	);
}

export function RoletaSection() {
	const router = useRouter();
	const [prizes, setPrizes] = useState<AdminPrize[]>([]);
	const [loading, setLoading] = useState(true);
	const [pending, setPending] = useState(0);
	const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

	const call = useCallback(
		async (method: string, url: string, body?: unknown, success?: string) => {
			setPending((n) => n + 1);
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
					// Recarrega para descartar o valor recusado da célula.
					if (method !== 'GET') void call('GET', '/api/admin/prizes');
					return;
				}

				setPrizes(data.prizes);
				if (success) setMessage({ type: 'ok', text: success });
			} catch {
				setMessage({ type: 'error', text: 'Falha de conexão.' });
			} finally {
				setPending((n) => n - 1);
				setLoading(false);
			}
		},
		[router]
	);

	useEffect(() => {
		void call('GET', '/api/admin/prizes');
	}, [call]);

	const patch = (prize: AdminPrize, changes: Changes, success = 'Salvo.') =>
		void call('PATCH', '/api/admin/prizes', { id: prize.id, changes }, success);

	const move = (index: number, direction: -1 | 1) => {
		const order = prizes.map((p) => p.id);
		const target = index + direction;

		if (target < 0 || target >= order.length) return;

		[order[index], order[target]] = [order[target], order[index]];
		void call('PATCH', '/api/admin/prizes', { order }, 'Ordem atualizada.');
	};

	const addStock = (prize: AdminPrize, amount: number) => {
		if (prize.maxCount === null || !Number.isFinite(amount) || amount <= 0) return;

		patch(prize, { maxCount: prize.maxCount + amount }, `+${amount} em "${prize.label}".`);
	};

	const remove = (prize: AdminPrize) => {
		if (!window.confirm(`Excluir "${prize.label}"? Isso remove a fatia da roleta.`)) return;

		void call('DELETE', '/api/admin/prizes', { id: prize.id }, 'Prêmio excluído.');
	};

	const resetOne = (prize: AdminPrize) => {
		if (!window.confirm(`Zerar o contador de "${prize.label}"? Ele volta a ter todo o estoque.`)) return;

		void call('POST', '/api/admin/reset', { id: prize.id }, 'Contador zerado.');
	};

	const resetAll = () => {
		if (!window.confirm('Zerar o contador de TODOS os prêmios? Todo o estoque volta ao máximo.')) return;

		void call('POST', '/api/admin/reset', {}, 'Todos os contadores foram zerados.');
	};

	const add = () =>
		void call('POST', '/api/admin/prizes', { label: 'Novo prêmio', maxCount: 1 }, 'Linha adicionada. Edite o nome direto na tabela.');

	const limited = prizes.filter((p) => p.maxCount !== null);
	const totalMax = limited.reduce((sum, p) => sum + (p.maxCount ?? 0), 0);
	const totalAwarded = prizes.reduce((sum, p) => sum + p.awarded, 0);

	return (
		<div className="flex flex-col gap-5">
			<header className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h1 className="text-2xl font-semibold">Roleta</h1>
					<p className="text-sm text-white/60">Clique em qualquer célula para editar. Salva sozinho ao sair do campo. Role a tabela para o lado para ver todas as colunas.</p>
				</div>
				<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
					<span className="flex items-center gap-1.5 text-xs text-white/50" aria-live="polite">
						{pending > 0 && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
						{pending > 0 ? 'Salvando…' : ''}
					</span>
					<button type="button" onClick={resetAll} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10">
						<RotateCcw className="h-4 w-4" /> Zerar contadores
					</button>
					<button type="button" onClick={add} className="flex items-center gap-1.5 rounded-lg bg-[#D3972F] px-3 py-2 text-sm font-medium hover:bg-[#B07D24]">
						<Plus className="h-4 w-4" /> Nova linha
					</button>
				</div>
			</header>

			<div className="grid grid-cols-3 gap-2 sm:gap-3">
				<Stat label="Já sorteados" value={String(totalAwarded)} />
				<Stat label="Estoque total" value={String(totalMax)} />
				<Stat label="Disponíveis" value={String(Math.max(0, totalMax - limited.reduce((s, p) => s + Math.min(p.awarded, p.maxCount ?? 0), 0)))} />
			</div>

			{message && (
				<p
					role={message.type === 'error' ? 'alert' : 'status'}
					className={`rounded-xl border px-4 py-2.5 text-sm ${
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
				<div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#202020]">
					<table className="w-full min-w-[1650px] border-collapse text-left text-sm">
						<thead>
							<tr className="border-b border-white/10 text-xs uppercase tracking-wider text-white/45">
								<th className="w-16 px-3 py-3 font-medium">Ordem</th>
								<th className="min-w-[130px] px-3 py-3 font-medium">Cores</th>
								<th className="min-w-[260px] px-3 py-3 font-medium">Nome na roleta</th>
								<th className="min-w-[260px] px-3 py-3 font-medium">Descrição (resultado)</th>
								<th className="min-w-[150px] px-3 py-3 font-medium">Tipo</th>
								<th className="min-w-[150px] px-3 py-3 font-medium">Limite</th>
								<th className="w-24 px-3 py-3 font-medium">Máximo</th>
								<th className="min-w-[300px] px-3 py-3 font-medium">Saíram</th>
								<th className="min-w-[270px] px-3 py-3 font-medium">Adicionar estoque</th>
								<th className="w-20 px-3 py-3 font-medium">Peso</th>
								<th className="w-20 px-3 py-3" />
							</tr>
						</thead>
						<tbody>
							{prizes.map((prize, index) => {
								const unlimited = prize.maxCount === null;
								const remaining = unlimited ? null : Math.max(0, (prize.maxCount ?? 0) - prize.awarded);
								const pct = unlimited || !prize.maxCount ? 0 : Math.min(100, (prize.awarded / prize.maxCount) * 100);
								const soldOut = remaining === 0;

								return (
									<tr key={prize.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
										<td className="px-3 py-2">
											<div className="flex">
												<button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Subir" className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20">
													<ArrowUp className="h-4 w-4" />
												</button>
												<button type="button" disabled={index === prizes.length - 1} onClick={() => move(index, 1)} aria-label="Descer" className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20">
													<ArrowDown className="h-4 w-4" />
												</button>
											</div>
										</td>
										<td className="px-3 py-2">
											<div className="flex items-center gap-2">
												<ColorPicker label="Cor da fatia" value={prize.color} options={SLICE_COLORS} onPick={(color) => patch(prize, { color })} />
												<ColorPicker label="Cor do texto" value={prize.textColor} options={TEXT_COLORS} onPick={(textColor) => patch(prize, { textColor })} round />
											</div>
										</td>
										<td className="px-1 py-2">
											<TextCell label="Nome" value={prize.label} maxLength={40} onCommit={(label) => patch(prize, { label: label.trim() })} />
										</td>
										<td className="px-1 py-2">
											<TextCell label="Descrição" value={prize.description} maxLength={140} placeholder="Vazio" onCommit={(description) => patch(prize, { description })} />
										</td>
										<td className="px-1 py-2">
											<select
												aria-label="Tipo"
												value={prize.isWin ? 'win' : 'lose'}
												onChange={(e) => patch(prize, { isWin: e.target.value === 'win' })}
												className={`${cell} cursor-pointer`}
											>
												<option value="win">Prêmio</option>
												<option value="lose">Sem prêmio</option>
											</select>
										</td>
										<td className="px-1 py-2">
											<select
												aria-label="Limite"
												value={unlimited ? 'unlimited' : 'limited'}
												onChange={(e) =>
													patch(prize, { maxCount: e.target.value === 'unlimited' ? null : Math.max(prize.awarded, 1) })
												}
												className={`${cell} cursor-pointer`}
											>
												<option value="limited">Limitado</option>
												<option value="unlimited">Ilimitado</option>
											</select>
										</td>
										<td className="px-1 py-2">
											{unlimited ? (
												<span className="px-2 text-white/30">∞</span>
											) : (
												<TextCell label="Quantidade máxima" type="number" min={0} max={100000} value={String(prize.maxCount)} onCommit={(v) => patch(prize, { maxCount: v.trim() === '' ? 0 : Number(v) })} />
											)}
										</td>
										<td className="px-3 py-2">
											<div className="flex items-baseline justify-between gap-2">
												<span>
													<strong className="text-base">{prize.awarded}</strong>
													<span className="text-white/50">{unlimited ? ' sorteados' : ` de ${prize.maxCount}`}</span>
												</span>
												{!unlimited && (
													<span className={`text-xs ${soldOut ? 'font-semibold text-red-300' : 'text-white/60'}`}>
														{soldOut ? 'Esgotado' : `restam ${remaining}`}
													</span>
												)}
											</div>
											{!unlimited && (
												<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
													<div className={`h-full ${soldOut ? 'bg-red-400' : pct > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${pct}%` }} />
												</div>
											)}
										</td>
										<td className="px-3 py-2">
											{unlimited ? (
												<span className="text-white/30">—</span>
											) : (
												<AddStock onAdd={(n) => addStock(prize, n)} />
											)}
										</td>
										<td className="px-1 py-2">
											{unlimited ? (
												<TextCell label="Peso" type="number" min={1} max={1000} value={String(prize.weight)} onCommit={(v) => patch(prize, { weight: Number(v) })} />
											) : (
												<span className="px-2 text-white/30" title="Peso só vale para prêmios ilimitados">—</span>
											)}
										</td>
										<td className="px-3 py-2">
											<div className="flex justify-end">
												<button type="button" onClick={() => resetOne(prize)} aria-label="Zerar contador" title="Zerar contador" className="rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
													<RotateCcw className="h-4 w-4" />
												</button>
												<button type="button" disabled={prizes.length <= 1} onClick={() => remove(prize)} aria-label="Excluir" title="Excluir" className="rounded p-1.5 text-red-300/70 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-20">
													<Trash2 className="h-4 w-4" />
												</button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			<p className="text-xs leading-5 text-white/50">
				“Saíram” é quantas vezes o prêmio já foi sorteado. Para liberar mais, use +1/+5/+10 ou edite o máximo. Reduzir o máximo
				abaixo do que já saiu esgota o prêmio sem apagar o histórico. Zerar contadores não libera novos giros para quem já
				participou: o controle de 1 giro por participante continua nos cookies e nas liberações da atendente.
			</p>
		</div>
	);
}

function AddStock({ onAdd }: { onAdd: (amount: number) => void }) {
	const [custom, setCustom] = useState(false);
	const [value, setValue] = useState('');

	const close = () => {
		setCustom(false);
		setValue('');
	};

	const confirm = () => {
		const amount = Number(value);

		if (Number.isInteger(amount) && amount > 0) onAdd(amount);
		close();
	};

	if (custom) {
		return (
			<div className="flex items-center gap-1">
				<input
					autoFocus
					type="number"
					min={1}
					inputMode="numeric"
					aria-label="Quantidade a adicionar"
					placeholder="Qtd"
					value={value}
					onChange={(e) => setValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') confirm();
						if (e.key === 'Escape') close();
					}}
					className="w-16 rounded-md border border-[#D3972F] bg-black/30 px-2 py-1 text-xs text-white focus:outline-none"
				/>
				<button type="button" onClick={confirm} aria-label="Confirmar" className="rounded-md bg-[#D3972F] px-2 py-1 text-xs font-medium hover:bg-[#B07D24]">
					OK
				</button>
				<button type="button" onClick={close} aria-label="Cancelar" className="rounded-md px-1.5 py-1 text-xs text-white/50 hover:bg-white/10">
					✕
				</button>
			</div>
		);
	}

	return (
		<div className="flex gap-1">
			{[1, 5, 10].map((n) => (
				<button key={n} type="button" onClick={() => onAdd(n)} className="rounded-md border border-white/15 px-2 py-1 text-xs hover:border-[#D3972F] hover:bg-[#D3972F]/15">
					+{n}
				</button>
			))}
			<button type="button" onClick={() => setCustom(true)} className="rounded-md border border-white/15 px-2 py-1 text-xs hover:border-[#D3972F] hover:bg-[#D3972F]/15">
				+ Outro
			</button>
		</div>
	);
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-white/10 bg-[#202020] px-3 py-2.5 sm:px-4 sm:py-3">
			<p className="text-xs text-white/50">{label}</p>
			<p className="text-xl sm:text-2xl font-semibold">{value}</p>
		</div>
	);
}

function ColorPicker({
	label,
	value,
	options,
	onPick,
	round,
}: {
	label: string;
	value: string;
	options: readonly { value: string; name: string }[];
	onPick: (v: string) => void;
	round?: boolean;
}) {
	return (
		<div role="radiogroup" aria-label={label} className="flex items-center gap-1">
			{options.map((option) => {
				const selected = option.value.toLowerCase() === value.toLowerCase();

				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={selected}
						aria-label={`${label}: ${option.name}`}
						title={`${label}: ${option.name}`}
						onClick={() => !selected && onPick(option.value)}
						style={{ background: option.value }}
						className={`h-6 w-6 border ${round ? 'rounded-full' : 'rounded-md'} ${
							selected ? 'border-white ring-2 ring-[#D3972F]' : 'border-white/20 hover:border-white/60'
						}`}
					/>
				);
			})}
		</div>
	);
}
