'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Dices, FolderTree, KeyRound, LogOut, Package, type LucideIcon } from 'lucide-react';
import { RoletaSection } from './RoletaSection';
import { AcessoSection } from './catalog/AcessoSection';
import { ColecoesSection } from './catalog/ColecoesSection';
import { ProdutosSection } from './catalog/ProdutosSection';
import { useCatalog } from './catalog/useCatalog';

interface Section {
	id: string;
	label: string;
	icon: LucideIcon;
}

// Para crescer o dashboard: adicione a seção aqui e renderize abaixo.
const SECTIONS: Section[] = [
	{ id: 'produtos', label: 'Produtos', icon: Package },
	{ id: 'colecoes', label: 'Coleções', icon: FolderTree },
	{ id: 'acesso', label: 'Acesso', icon: KeyRound },
	{ id: 'roleta', label: 'Roleta', icon: Dices },
];

const initials = (email: string | null) => (email ? email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?' : '?');

function Avatar({ email }: { email: string | null }) {
	return (
		<span
			aria-hidden
			className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-950 text-sm font-semibold text-white"
		>
			{initials(email)}
		</span>
	);
}

export function AdminShell({ email }: { email: string | null }) {
	const router = useRouter();
	const [activeId, setActiveId] = useState(SECTIONS[0].id);
	const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];
	const catalog = useCatalog();

	const logout = async () => {
		await fetch('/api/admin/logout', { method: 'POST' });
		router.refresh();
	};

	return (
		<div className="flex min-h-[100svh] flex-col md:flex-row">
			<aside className="z-10 flex shrink-0 flex-col border-b border-red-950/10 bg-white shadow-sm md:sticky md:top-0 md:h-[100svh] md:w-60 md:border-b-0 md:border-r">
				<div className="flex items-center justify-between gap-3 px-4 py-3 md:block md:px-5 md:py-6">
					<div className="md:flex md:justify-center">
						<Image src="/logo-h.svg" alt="Santa Rosa Acessórios" width={160} height={52} priority className="h-auto w-32 md:w-36" />
					</div>
					<div className="flex items-center gap-2 md:hidden">
						<Avatar email={email} />
						<button
							type="button"
							onClick={() => void logout()}
							aria-label="Sair"
							className="rounded-lg p-2 text-stone-600 hover:bg-red-950/5 hover:text-red-950"
						>
							<LogOut className="h-4 w-4" />
						</button>
					</div>
				</div>

				<nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
					{SECTIONS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveId(id)}
							aria-current={id === active.id ? 'page' : undefined}
							className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
								id === active.id ? 'bg-red-950 font-medium text-white' : 'text-stone-600 hover:bg-red-950/5 hover:text-red-950'
							}`}
						>
							<Icon className="h-4 w-4" /> {label}
						</button>
					))}
				</nav>

				<div className="hidden items-center gap-3 border-t border-red-950/10 p-4 md:flex">
					<Avatar email={email} />
					<div className="min-w-0 flex-1">
						<p className="truncate text-sm font-medium" title={email ?? undefined}>{email ?? 'Administrador'}</p>
						<p className="text-xs text-stone-500">Administrador</p>
					</div>
					<button
						type="button"
						onClick={() => void logout()}
						aria-label="Sair"
						title="Sair"
						className="rounded-lg p-2 text-stone-500 hover:bg-red-950/5 hover:text-red-950"
					>
						<LogOut className="h-4 w-4" />
					</button>
				</div>
			</aside>

			<section className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">
				<div className="mx-auto w-full max-w-[1200px]">
					{active.id === 'produtos' && <ProdutosSection api={catalog} />}
					{active.id === 'colecoes' && <ColecoesSection api={catalog} />}
					{active.id === 'acesso' && <AcessoSection />}
					{active.id === 'roleta' && <RoletaSection />}
				</div>
			</section>
		</div>
	);
}
