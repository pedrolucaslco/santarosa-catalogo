// Cores permitidas nas fatias da roleta (as mesmas da campanha). O admin só escolhe entre elas.
export const SLICE_COLORS = [
	{ value: '#262626', name: 'Preto' },
	{ value: '#3A3A3A', name: 'Grafite' },
	{ value: '#B8862B', name: 'Dourado' },
] as const;

export const TEXT_COLORS = [{ value: '#ffffff', name: 'Branco' }] as const;

export const isAllowedColor = (field: 'color' | 'textColor', value: string) =>
	(field === 'color' ? SLICE_COLORS : TEXT_COLORS).some((c) => c.value.toLowerCase() === value.toLowerCase());
