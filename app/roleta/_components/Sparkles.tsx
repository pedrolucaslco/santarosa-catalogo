'use client';

import { useMemo, type CSSProperties } from 'react';

const COLORS = ['#fbbf24', '#f59e0b', '#fde68a', '#ffffff', '#fca5a5'];
const STAR_CLIP =
	'polygon(50% 0%, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0% 50%, 38% 38%)';

interface Particle {
	id: number;
	dx: number;
	dy: number;
	size: number;
	delay: number;
	duration: number;
	color: string;
	rotate: number;
	shape: 'circle' | 'star';
}

function createParticles(): Particle[] {
	return Array.from({ length: 30 }, (_, index) => {
		const angle = (Math.PI * 2 * index) / 30 + (Math.random() - 0.5) * 0.55;
		const distance = 60 + Math.random() * 120;
		const size = 3 + Math.random() * 6;

		return {
			id: index,
			dx: Math.cos(angle) * distance,
			dy: Math.sin(angle) * distance,
			size,
			delay: Math.random() * 180,
			duration: 1300 + Math.random() * 700,
			color: COLORS[index % COLORS.length],
			rotate: Math.random() * 220 - 110,
			shape: index % 3 === 0 ? 'star' : 'circle',
		};
	});
}

export function Sparkles() {
	const particles = useMemo(createParticles, []);

	return (
		<div
			className="pointer-events-none absolute inset-0 z-30 overflow-visible"
			aria-hidden="true"
		>
			<span className="roleta-sparkle-ring absolute left-1/2 top-1/2 h-28 w-28 rounded-full border-2 border-amber-300/80" />

			{particles.map((particle) => (
				<span
					key={particle.id}
					className="roleta-sparkle-particle absolute left-1/2 top-1/2 block"
					style={
						{
							width: particle.size,
							height: particle.size,
							marginLeft: -particle.size / 2,
							marginTop: -particle.size / 2,
							backgroundColor: particle.color,
							borderRadius: particle.shape === 'circle' ? '9999px' : undefined,
							clipPath: particle.shape === 'star' ? STAR_CLIP : undefined,
							boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
							'--roleta-dx': `${particle.dx}px`,
							'--roleta-dy': `${particle.dy}px`,
							'--roleta-rotate': `${particle.rotate}deg`,
							animationDelay: `${particle.delay}ms`,
							animationDuration: `${particle.duration}ms`,
						} as CSSProperties
					}
				/>
			))}
		</div>
	);
}
