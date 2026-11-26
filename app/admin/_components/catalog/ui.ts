// Classes compartilhadas das telas de catálogo do admin (tema escuro + dourado, como a roleta).
export const field =
	'w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#D3972F] focus:outline-none disabled:opacity-40';
export const btn = 'flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-sm hover:bg-white/10 disabled:opacity-40';
export const btnPrimary = 'flex items-center gap-1.5 rounded-lg bg-[#D3972F] px-3 py-2 text-sm font-medium text-white hover:bg-[#B07D24] disabled:opacity-40';
export const iconBtn = 'rounded p-1.5 text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-20';

/** 99.9 -> "99,90" (campo de texto) */
export const brl = (n: number | null | undefined) => (n === null || n === undefined ? '' : n.toFixed(2).replace('.', ','));
export const money = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `R$ ${brl(n)}`);
