import type { CSSProperties } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { UnlockForm } from '../_components/UnlockForm';
import { campaign } from '../_lib/campaign';

export const metadata: Metadata = {
	title: `Liberar tentativa | ${campaign.storeName}`,
	robots: {
		index: false,
		follow: false,
	},
};

export default function LiberarPage() {
	const themeVars = {
		'--roleta-primary': campaign.theme.primary,
		'--roleta-primary-hover': campaign.theme.primaryHover,
		'--roleta-text': campaign.theme.text,
		'--roleta-muted': campaign.theme.muted,
		'--roleta-card': campaign.theme.card,
		'--roleta-border': campaign.theme.border,
		'--roleta-highlight-bg': campaign.theme.highlight.background,
		'--roleta-highlight-text': campaign.theme.highlight.text,
		'--roleta-highlight-font': campaign.theme.highlight.fontFamily,
		'--roleta-highlight-font-style': campaign.theme.highlight.fontStyle,
	} as CSSProperties;

	const pageStyle: CSSProperties = {
		...themeVars,
		backgroundColor: campaign.theme.background,
		color: campaign.theme.text,
	};

	return (
		<main
			className="relative flex min-h-[100svh] w-full flex-col items-center justify-center overflow-hidden px-5 py-10"
			style={pageStyle}
		>
			<div
				className="pointer-events-none absolute inset-0"
				style={{
					background: `radial-gradient(circle at 50% 0%, ${campaign.theme.primary}, transparent 65%)`,
					opacity: 0.08,
				}}
			/>

			<div className="relative z-10 w-full max-w-sm">
				{campaign.logo.show && (
					<Image
						src={campaign.logo.url}
						alt={campaign.logo.alt}
						width={220}
						height={72}
						priority
						unoptimized
						className="mx-auto h-auto w-36 brightness-0 invert"
					/>
				)}

				<UnlockForm />
			</div>
		</main>
	);
}
