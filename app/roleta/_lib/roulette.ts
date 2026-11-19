export interface Prize {
	id: string;
	label: string;
	description?: string;
	color: string;
	textColor: string;
	weight: number;
	isWin: boolean;
}

export interface StoredPrize {
	id: string;
	label: string;
	description?: string;
	color?: string;
	textColor?: string;
	isWin?: boolean;
	at: string;
	spinId: string;
}

export interface CampaignHighlight {
	background: string;
	text: string;
	fontFamily: string;
	fontStyle: 'normal' | 'italic';
}

export interface CampaignTheme {
	background: string;
	primary: string;
	primaryHover: string;
	text: string;
	muted: string;
	card: string;
	border: string;
	highlight: CampaignHighlight;
}

export interface CampaignLogo {
	show: boolean;
	url: string;
	alt: string;
}

export interface CampaignBanner {
	show: boolean;
	url: string;
	alt: string;
}

export interface CampaignSpin {
	minFullTurns: number;
	maxFullTurns: number;
	durationMs: number;
}

export interface CampaignMessages {
	alreadySpunText: string;
	closedTitle: string;
	closedText: string;
	maintenanceTitle: string;
	maintenanceText: string;
	genericError: string;
	statusError: string;
	retry: string;
	receiptLabel: string;
	showToStaff: string;
	rules: string;
	spinHint: string;
	spin: string;
	spinning: string;
	preparing: string;
	locked: string;
	winTitle: string;
	loseTitle: string;
	loading: string;
}

export interface CampaignConfig {
	id: string;
	title: string;
	subtitle: string;
	storeName: string;
	endDate: string;
	maintenance: boolean;
	logo: CampaignLogo;
	banner: CampaignBanner;
	theme: CampaignTheme;
	prizes: Prize[];
	spin: CampaignSpin;
	messages: CampaignMessages;
}

export function isCampaignExpired(endDate: string): boolean {
	const [day, month, year] = endDate.split('/').map(Number);

	if (!day || !month || !year) return false;

	const dueDate = new Date(year, month - 1, day, 23, 59, 59);
	return Date.now() > dueDate.getTime();
}

export function pickPrize(
	prizes: readonly Prize[],
	random: () => number = Math.random
): { prize: Prize; index: number } {
	if (prizes.length === 0) {
		throw new Error('A roleta precisa ter pelo menos um prêmio configurado.');
	}

	const totalWeight = prizes.reduce((total, prize) => total + Math.max(0, prize.weight), 0);

	if (totalWeight <= 0) {
		const index = Math.floor(random() * prizes.length);
		return { prize: prizes[index], index };
	}

	let remaining = random() * totalWeight;

	for (let index = 0; index < prizes.length; index += 1) {
		remaining -= Math.max(0, prizes[index].weight);

		if (remaining < 0) {
			return { prize: prizes[index], index };
		}
	}

	const lastIndex = prizes.length - 1;
	return { prize: prizes[lastIndex], index: lastIndex };
}

export function calculateTargetRotation(
	currentRotation: number,
	prizeIndex: number,
	prizeCount: number,
	spin: CampaignSpin
): number {
	if (prizeCount <= 0) return currentRotation;

	const segment = 360 / prizeCount;
	const segmentCenter = prizeIndex * segment + segment / 2;
	const currentMod = ((currentRotation % 360) + 360) % 360;
	const desiredMod = (360 - segmentCenter) % 360;
	const deltaToDesired = ((desiredMod - currentMod) + 360) % 360;

	const minTurns = Math.max(1, Math.floor(spin.minFullTurns));
	const maxTurns = Math.max(minTurns, Math.floor(spin.maxFullTurns));
	const fullTurns = minTurns + Math.floor(Math.random() * (maxTurns - minTurns + 1));

	// Pequena variação para o ponteiro não parar sempre no centro exato da fatia.
	const jitterRange = Math.max(0, segment * 0.25);
	const jitter = (Math.random() * 2 - 1) * jitterRange;

	return currentRotation + fullTurns * 360 + deltaToDesired + jitter;
}

export function getPrizeLabelLines(label: string): string[] {
	const trimmed = label.trim();

	if (!trimmed) return [''];
	if (trimmed.length <= 12) return [trimmed];

	const words = trimmed.split(/\s+/);

	if (words.length < 2) return [trimmed];

	let bestLines = [trimmed];
	let bestMaxLength = trimmed.length;

	for (let splitAt = 1; splitAt < words.length; splitAt += 1) {
		const firstLine = words.slice(0, splitAt).join(' ');
		const secondLine = words.slice(splitAt).join(' ');
		const maxLength = Math.max(firstLine.length, secondLine.length);

		if (maxLength < bestMaxLength) {
			bestLines = [firstLine, secondLine];
			bestMaxLength = maxLength;
		}
	}

	return bestLines;
}

export function formatDateTime(isoDate: string): string {
	const date = new Date(isoDate);

	if (Number.isNaN(date.getTime())) return '';

	return new Intl.DateTimeFormat('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(date);
}
