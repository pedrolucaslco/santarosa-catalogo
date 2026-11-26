'use client';

import { useState } from 'react';
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

export function AdminShell() {
	const router = useRouter();
	const [activeId, setActiveId] = useState(SECTIONS[0].id);
	const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0];
	const catalog = useCatalog();

	const logout = async () => {
		await fetch('/api/admin/logout', { method: 'POST' });
		router.refresh();
	};

	return (
		<div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 md:flex-row md:gap-6">
			<aside className="flex shrink-0 border-b border-white/10 pb-3 md:border-0 md:pb-0 flex-row items-center justify-between gap-2 md:w-52 md:flex-col md:items-stretch md:justify-start">
				<p className="hidden px-3 text-xs font-semibold uppercase tracking-widest text-white/40 md:mb-2 md:block">Santa Rosa · Admin</p>
				<nav className="flex gap-1 md:flex-col">
					{SECTIONS.map(({ id, label, icon: Icon }) => (
						<button
							key={id}
							type="button"
							onClick={() => setActiveId(id)}
							aria-current={id === active.id ? 'page' : undefined}
							className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
								id === active.id ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'
							}`}
						>
							<Icon className="h-4 w-4" /> {label}
						</button>
					))}
				</nav>
				<button
					type="button"
					onClick={() => void logout()}
					className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white md:mt-auto"
				>
					<LogOut className="h-4 w-4" /> <span>Sair</span>
				</button>
			</aside>

			<section className="min-w-0 flex-1">
				{active.id === 'produtos' && <ProdutosSection api={catalog} />}
				{active.id === 'colecoes' && <ColecoesSection api={catalog} />}
				{active.id === 'acesso' && <AcessoSection />}
				{active.id === 'roleta' && <RoletaSection />}
			</section>
		</div>
	);
}
