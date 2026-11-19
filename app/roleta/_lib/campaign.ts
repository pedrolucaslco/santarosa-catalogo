import type { CampaignConfig } from './roulette';

// ============================================================
// CAMPANHA — altere apenas este bloco para criar outra roleta
// ============================================================
export const campaign = {
	id: 'roleta-santa-rosa-2026',
	title: 'Roleta Premiada',
	subtitle: 'Gire a roleta e descubra o seu presente da Santa Rosa.',
	storeName: 'Santa Rosa Acessórios',
	endDate: '31/12/2026',
	maintenance: false,

	logo: {
		show: true,
		url: '/logo-h.svg',
		alt: 'Santa Rosa Acessórios',
	},

	banner: {
		// Coloque a imagem em public/ e mude show para true.
		show: false,
		url: '/banner-roleta.png',
		alt: 'Roleta Premiada Santa Rosa',
	},

	theme: {
		background: '#171717',
		primary: '#D3972F',
		primaryHover: '#B07D24',
		text: '#ffffff',
		muted: '#DEB163',
		card: '#202020',
		border: 'rgba(255, 255, 255, 0.1)',
		highlight: {
			background:
				'linear-gradient(to right, #DEB163 0%, #DBAB57 25%, #D3972F 52%, #D2962D 63%, #7E5A1B 100%)',
			text: '#ffffff',
			fontFamily: 'var(--font-instrument-serif), Georgia, serif',
			fontStyle: 'italic',
		},
	},

	prizes: [
		{
			id: 'off10',
			label: 'R$ 10 OFF',
			description: 'Em compras acima de R$ 100.',
			color: '#262626',
			textColor: '#ffffff',
			weight: 30,
			isWin: true,
		},
		{
			id: 'off20',
			label: 'R$ 20 OFF',
			description: 'Em compras acima de R$ 150.',
			color: '#B8862B',
			textColor: '#ffffff',
			weight: 20,
			isWin: true,
		},
		{
			id: 'brinde',
			label: 'Brinde',
			description: 'Um brinde surpresa para retirar na loja.',
			color: '#262626',
			textColor: '#ffffff',
			weight: 15,
			isWin: true,
		},
		{
			id: 'off15',
			label: '15% OFF',
			description: 'Desconto especial em toda a loja.',
			color: '#B8862B',
			textColor: '#ffffff',
			weight: 25,
			isWin: true,
		},
		{
			id: 'tente',
			label: 'Tente outra vez',
			description: 'Não foi dessa vez.',
			color: '#3A3A3A',
			textColor: '#ffffff',
			weight: 10,
			isWin: false,
		},
	],

	spin: {
		minFullTurns: 5,
		maxFullTurns: 8,
		durationMs: 4500,
	},

	messages: {
		alreadySpunText: 'Sua participação já foi registrada.',
		closedTitle: 'Campanha encerrada',
		closedText: 'Obrigado por participar!',
		maintenanceTitle: 'Em manutenção',
		maintenanceText: 'Volte novamente em breve.',
		genericError: 'Não foi possível concluir agora. Tente novamente.',
		statusError: 'Não foi possível verificar sua participação.',
		retry: 'Tentar novamente',
		receiptLabel: 'Comprovante',
		showToStaff: 'Mostre esta tela para uma atendente.',
		rules: 'Uma participação por cliente.',
		spinHint: 'Toque no centro da roleta para girar.',
		spin: 'Girar',
		spinning: 'Girando...',
		preparing: 'Preparando...',
		locked: 'Bloqueado',
		winTitle: 'Você ganhou!',
		loseTitle: 'Não foi dessa vez',
		loading: 'Carregando sua participação...',
	},
} satisfies CampaignConfig;
