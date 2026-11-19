import type { CampaignConfig } from './roulette';

// ============================================================
// CAMPANHA — altere apenas este bloco para criar outra roleta
// ============================================================
export const campaign = {
	id: 'roleta-santa-rosa-2026',
	title: 'Você desbloqueou! 🔓',
	subtitle: 'Sua Black ficou ainda melhor!',
	storeName: 'Santa Rosa Acessórios',
	endDate: '28/11/2026',
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
		alt: 'Black Histórica Santa Rosa',
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
			id: 'flanela-magica',
			label: 'Flanela mágica',
			description: 'Uma flanela mágica para retirar na loja.',
			color: '#262626',
			textColor: '#ffffff',
			weight: 1,
			// Máximo de vezes que este prêmio pode ser sorteado (controlado no Supabase).
			maxCount: 40,
			isWin: true,
		},
		{
			id: 'necessarie',
			label: 'Necessarie',
			description: 'Um necessarie para retirar na loja.',
			color: '#B8862B',
			textColor: '#ffffff',
			weight: 1,
			// Máximo de vezes que este prêmio pode ser sorteado (controlado no Supabase).
			maxCount: 10,
			isWin: true,
		},
		{
			id: 'voucher-adcos',
			label: 'Voucher Adcos',
			description: 'Um voucher Adcos para usar na marca parceira.',
			color: '#262626',
			textColor: '#ffffff',
			weight: 1,
			// Máximo de vezes que este prêmio pode ser sorteado (controlado no Supabase).
			maxCount: 6,
			isWin: true,
		},
		{
			id: 'presente-parceiro',
			label: 'Presente de parceiro',
			description: 'Um presente especial de uma marca parceira.',
			color: '#B8862B',
			textColor: '#ffffff',
			weight: 1,
			// Máximo de vezes que este prêmio pode ser sorteado (controlado no Supabase).
			maxCount: 5,
			isWin: true,
		},
		{
			id: 'mimo-surpresa',
			label: 'Mimo surpresa',
			description: 'Um mimo surpresa para retirar na loja.',
			color: '#3A3A3A',
			textColor: '#ffffff',
			weight: 1,
			// Máximo de vezes que este prêmio pode ser sorteado (controlado no Supabase).
			maxCount: 10,
			isWin: true,
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
		intro:
			'Além de aproveitar nossas semijoias incríveis com até 70% OFF, você ganhou a chance de levar uma vantagem extra para casa!',
		callToAction: '🎁 Gire a nossa roleta e ganhe um prêmio na hora!',
		callToActionHint:
			'É simples: gire, descubra o que ganhou e aproveite sua surpresa exclusiva na Black Histórica da Santa Rosa!',
		rulesTitle: 'Regras da dinâmica',
		rules: [
			'O prêmio conquistado na roleta poderá ser resgatado em compras a partir de R$ 99.',
			'Válido de 24 a 28/11/2026.',
			'Não cumulativo com outras promoções.',
			'Limitado a 1 prêmio por CPF durante a campanha.',
		],
		closing: 'Boa sorte e boas compras! ❤️',
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
