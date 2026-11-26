'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminLogin() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		setLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/admin/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});
			const data = await response.json().catch(() => null);

			if (!response.ok || !data?.ok) {
				setError(data?.error ?? 'Não foi possível entrar.');
				return;
			}

			router.refresh();
		} catch {
			setError('Não foi possível entrar.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			className="mx-auto mt-[12vh] flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-red-950/10 bg-white p-6"
		>
			<Image src="/logo-h.svg" alt="Santa Rosa Acessórios" width={160} height={52} priority className="mx-auto h-auto w-40" />
			<h1 className="text-xl font-semibold">Painel Santa Rosa</h1>

			<div className="flex flex-col gap-2">
				<Label htmlFor="admin-user">E-mail</Label>
				<Input
					id="admin-user"
					type="email"
					autoComplete="username"
					value={email}
					onChange={(event) => setEmail(event.target.value)}
					className="border-red-950/10 bg-stone-50 text-red-950"
					required
				/>
			</div>

			<div className="flex flex-col gap-2">
				<Label htmlFor="admin-pass">Senha</Label>
				<Input
					id="admin-pass"
					type="password"
					autoComplete="current-password"
					value={password}
					onChange={(event) => setPassword(event.target.value)}
					className="border-red-950/10 bg-stone-50 text-red-950"
					required
				/>
			</div>

			{error && (
				<p role="alert" className="text-sm text-red-700">
					{error}
				</p>
			)}

			<Button type="submit" disabled={loading} className="bg-red-950 text-white hover:bg-red-900">
				{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
				Entrar
			</Button>
		</form>
	);
}
