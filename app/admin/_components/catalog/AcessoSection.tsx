'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Lock, LockOpen } from 'lucide-react';
import { StatusMessage, Spinner } from './Message';
import { btnPrimary, field } from './ui';
import type { Message } from './useCatalog';

interface AccessData {
	passwordSet: boolean;
	envFallback: boolean;
	collections: { slug: string; name: string; locked: boolean }[];
}

/** Senha e bloqueio das páginas de campanha (/liquida, /black, ...). */
export function AcessoSection() {
	const router = useRouter();
	const [data, setData] = useState<AccessData | null>(null);
	const [message, setMessage] = useState<Message>(null);
	const [busy, setBusy] = useState(false);
	const [password, setPassword] = useState('');
	const [show, setShow] = useState(false);

	const call = useCallback(
		async (method: 'GET' | 'PUT' | 'PATCH', body?: unknown, success?: string): Promise<boolean> => {
			setBusy(true);
			setMessage(null);

			try {
				const send = () =>
					fetch('/api/admin/access', {
						method,
						headers: { 'Content-Type': 'application/json' },
						body: body === undefined ? undefined : JSON.stringify(body),
					});
				let response = await send();

				if (response.status === 401) {
					const refreshed = await fetch('/api/admin/refresh', { method: 'POST' });

					if (refreshed.ok) response = await send();
				}

				const json = await response.json().catch(() => null);

				if (response.status === 401) {
					router.refresh();
					return false;
				}

				if (!response.ok || !json?.ok) {
					setMessage({ type: 'error', text: json?.error ?? 'Algo deu errado.' });
					return false;
				}

				setData({ passwordSet: json.passwordSet, envFallback: json.envFallback, collections: json.collections });
				if (success) setMessage({ type: 'ok', text: success });

				return true;
			} catch {
				setMessage({ type: 'error', text: 'Falha de conexão.' });
				return false;
			} finally {
				setBusy(false);
			}
		},
		[router]
	);

	useEffect(() => {
		void call('GET');
	}, [call]);

	const savePassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (await call('PUT', { password }, 'Senha atualizada. Quem já tinha acesso precisará digitar a nova.')) setPassword('');
	};

	if (!data) return message ? <StatusMessage message={message} /> : <Spinner />;

	return (
		<div className="space-y-6">
			<header>
				<h2 className="text-lg font-semibold">Acesso por senha</h2>
				<p className="text-sm text-white/50">Controle quais páginas de campanha pedem senha. A senha é a mesma para todas.</p>
			</header>

			<StatusMessage message={message} />

			<form onSubmit={(e) => void savePassword(e)} className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
				<h3 className="flex items-center gap-2 text-sm font-medium">
					<KeyRound className="h-4 w-4 text-[#D3972F]" /> {data.passwordSet ? 'Trocar senha' : 'Definir senha'}
				</h3>
				{!data.passwordSet && (
					<p className="text-xs text-amber-200/80">
						{data.envFallback
							? 'Nenhuma senha definida aqui: está valendo a senha antiga do .env. Defina uma para deixar de depender dela.'
							: 'Nenhuma senha definida: enquanto isso, as páginas bloqueadas não aceitam nenhuma senha.'}
					</p>
				)}
				<div className="relative max-w-sm">
					<input
						type={show ? 'text' : 'password'}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						placeholder="Nova senha (mín. 4 caracteres)"
						autoComplete="new-password"
						className={`${field} pr-10`}
						disabled={busy}
					/>
					<button
						type="button"
						aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
						onClick={() => setShow((v) => !v)}
						className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/50 hover:text-white"
					>
						{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
					</button>
				</div>
				<button type="submit" className={btnPrimary} disabled={busy || password.length < 4}>
					Salvar senha
				</button>
			</form>

			<div className="overflow-hidden rounded-xl border border-white/10">
				{data.collections.length === 0 && <p className="p-4 text-sm text-white/50">Nenhuma coleção encontrada.</p>}
				{data.collections.map((c) => (
					<div key={c.slug} className="flex items-center justify-between gap-3 border-b border-white/10 p-4 last:border-0">
						<div className="min-w-0">
							<p className="font-medium">{c.name}</p>
							<p className="text-xs text-white/40">/{c.slug}</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={c.locked}
							disabled={busy}
							onClick={() =>
								void call('PATCH', { slug: c.slug, locked: !c.locked }, c.locked ? `/${c.slug} liberada ao público.` : `/${c.slug} protegida por senha.`)
							}
							className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm disabled:opacity-40 ${
								c.locked ? 'border-[#D3972F]/50 bg-[#D3972F]/10 text-[#DEB163]' : 'border-white/15 text-white/70'
							}`}
						>
							{c.locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
							{c.locked ? 'Protegida por senha' : 'Pública'}
						</button>
					</div>
				))}
			</div>
			<p className="text-xs text-white/40">A mudança vale em até 10 segundos. A página inicial (/) não usa este bloqueio.</p>
		</div>
	);
}
