// Classes compartilhadas das telas de catálogo do admin (tema escuro + dourado, como a roleta).
export const field =
	'w-full rounded-lg border border-red-950/15 bg-stone-50 px-3 py-2 text-sm text-red-950 placeholder:text-stone-400 focus:border-red-950 focus:outline-none disabled:opacity-40';
export const btn = 'flex items-center gap-1.5 rounded-lg border border-red-950/15 px-3 py-2 text-sm hover:bg-red-950/10 disabled:opacity-40';
export const btnPrimary = 'flex items-center gap-1.5 rounded-lg bg-red-950 px-3 py-2 text-sm font-medium text-white hover:bg-red-900 disabled:opacity-40';
export const iconBtn = 'rounded p-1.5 text-stone-500 hover:bg-red-950/10 hover:text-red-950 disabled:opacity-20';

/** 99.9 -> "99,90" (campo de texto) */
export const brl = (n: number | null | undefined) => (n === null || n === undefined ? '' : n.toFixed(2).replace('.', ','));
export const money = (n: number | null | undefined) => (n === null || n === undefined ? '—' : `R$ ${brl(n)}`);
