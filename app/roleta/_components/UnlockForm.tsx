'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { campaign } from '../_lib/campaign';

export function UnlockForm() {
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!password.trim() || loading) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/roleta/unlock', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ campaignId: campaign.id, password }),
				cache: 'no-store',
			});
			const data = await response.json().catch(() => null);

			if (response.ok && data?.ok) {
				window.location.replace('/roleta');
				return;
			}

			if (response.status === 429 || response.status === 500) {
				setError(
					typeof data?.error === 'string'
						? data.error
						: 'Não foi possível liberar agora. Tente novamente.'
				);
				return;
			}

			setError('Senha incorreta. Tente novamente.');
		} catch {
			setError('Não foi possível liberar agora. Tente novamente.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="mt-8 w-full rounded-3xl border border-[var(--roleta-border)] bg-[var(--roleta-card)] p-6 shadow-sm">
			<div className="flex flex-col items-center text-center">
				<div
					className="flex h-12 w-12 items-center justify-center rounded-full"
					style={{
						background: 'var(--roleta-highlight-bg)',
						color: 'var(--roleta-highlight-text)',
					}}
				>
					<LockKeyhole className="h-5 w-5" />
				</div>
				<h1 className="roleta-highlight-title mt-4 text-3xl text-[var(--roleta-text)]">
					Liberar nova tentativa
				</h1>
				<p className="mt-2 text-sm leading-6 text-[var(--roleta-muted)]">
					Acesso restrito à equipe. Digite a senha da atendente para liberar um giro.
				</p>
				<div
					className="mt-3 h-1 w-16 rounded-full"
					style={{ background: 'var(--roleta-highlight-bg)' }}
				/>
			</div>

			<form onSubmit={handleSubmit} className="mt-6 space-y-4">
				<div className="space-y-2">
					<Label htmlFor="roleta-unlock-password" className="text-[var(--roleta-text)]">
						Senha
					</Label>
					<div className="relative">
						<Input
							id="roleta-unlock-password"
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder="Senha da atendente"
							autoComplete="current-password"
							disabled={loading}
							className="h-12 border-[var(--roleta-border)] bg-[#171717] pr-12 text-base text-[var(--roleta-text)] placeholder:text-[var(--roleta-muted)]/60 focus-visible:ring-[var(--roleta-primary)]"
							autoFocus
						/>
						<button
							type="button"
							onClick={() => setShowPassword((value) => !value)}
							disabled={loading}
							aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
							className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[var(--roleta-muted)] transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
						>
							{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
				</div>

				{error && (
					<p
						role="alert"
						className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200"
					>
						{error}
					</p>
				)}

				<Button
					type="submit"
					disabled={loading || !password.trim()}
					className="h-12 w-full text-sm font-semibold text-white hover:opacity-90"
					style={{ background: 'var(--roleta-highlight-bg)' }}
				>
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Validando...
						</>
					) : (
						'Liberar tentativa'
					)}
				</Button>
			</form>

			<Link
				href="/roleta"
				className="mt-5 flex items-center justify-center gap-1.5 text-xs font-medium text-[var(--roleta-muted)] transition-colors hover:text-[var(--roleta-text)]"
			>
				<ArrowLeft className="h-3.5 w-3.5" />
				Voltar para a roleta
			</Link>
		</div>
	);
}
