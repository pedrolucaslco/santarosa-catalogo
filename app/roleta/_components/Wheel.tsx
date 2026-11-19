'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Loader2, LockKeyhole, RotateCw } from 'lucide-react';
import { getPrizeLabelLines, type Prize } from '../_lib/roulette';

interface WheelLabels {
	spin: string;
	spinning: string;
	preparing: string;
	locked: string;
}

interface WheelProps {
	prizes: readonly Prize[];
	rotation: number;
	spinning: boolean;
	preparing: boolean;
	canSpin: boolean;
	durationMs: number;
	primaryColor: string;
	highlightBackground: string;
	highlightTextColor: string;
	labels: WheelLabels;
	onSpin: () => void;
	onSpinEnd: () => void;
}

export function Wheel({
	prizes,
	rotation,
	spinning,
	preparing,
	canSpin,
	durationMs,
	primaryColor,
	highlightBackground,
	highlightTextColor,
	labels,
	onSpin,
	onSpinEnd,
}: WheelProps) {
	const finishedRef = useRef(false);

	const finish = useCallback(() => {
		if (finishedRef.current) return;

		finishedRef.current = true;
		onSpinEnd();
	}, [onSpinEnd]);

	useEffect(() => {
		if (!spinning) return;

		finishedRef.current = false;
		const timer = window.setTimeout(finish, durationMs + 300);

		return () => window.clearTimeout(timer);
	}, [spinning, durationMs, finish]);

	if (prizes.length === 0) return null;

	const segment = 360 / prizes.length;
	const center = 50;
	const radius = 48;
	const labelRadius = radius * 0.62;
	const fontSize = prizes.length > 6 ? 3.1 : 3.7;
	const lineHeight = fontSize * 1.15;
	const busy = spinning || preparing;

	const buttonLabel = !canSpin
		? labels.locked
		: preparing
			? labels.preparing
			: spinning
				? labels.spinning
				: labels.spin;

	return (
		<div className="relative mx-auto aspect-square w-[min(84vw,20rem)] select-none sm:w-[22rem]">
			<div
				className="absolute inset-0 rounded-full border-[6px] shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
				style={{ borderColor: primaryColor, backgroundColor: primaryColor }}
			/>

			<div
				className="absolute inset-0 overflow-hidden rounded-full transition-transform ease-out will-change-transform"
				style={{
					transform: `rotate(${rotation}deg)`,
					transitionDuration: `${durationMs}ms`,
					transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.16, 1)',
				}}
				onTransitionEnd={(event) => {
					if (event.propertyName === 'transform') finish();
				}}
			>
				<svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
					{prizes.map((prize, index) => {
						const start = index * segment - 90;
						const end = (index + 1) * segment - 90;
						const startRad = (start * Math.PI) / 180;
						const endRad = (end * Math.PI) / 180;
						const x1 = center + radius * Math.cos(startRad);
						const y1 = center + radius * Math.sin(startRad);
						const x2 = center + radius * Math.cos(endRad);
						const y2 = center + radius * Math.sin(endRad);
						const largeArc = segment > 180 ? 1 : 0;
						const mid = start + segment / 2;
						const midRad = (mid * Math.PI) / 180;
						const labelX = center + labelRadius * Math.cos(midRad);
						const labelY = center + labelRadius * Math.sin(midRad);
						let textAngle = mid;

						if (textAngle > 90 || textAngle < -90) {
							textAngle += 180;
						}

						const lines = getPrizeLabelLines(prize.label);
						const firstLineOffset = lines.length > 1 ? -((lines.length - 1) * lineHeight) / 2 : 0;

						return (
							<g key={prize.id}>
								<path
									d={`M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
									fill={prize.color}
									stroke="rgba(255,255,255,0.7)"
									strokeWidth={0.5}
								/>
								<text
									x={labelX}
									y={labelY}
									transform={`rotate(${textAngle}, ${labelX}, ${labelY})`}
									textAnchor="middle"
									dominantBaseline="middle"
									fontSize={fontSize}
									fontWeight={700}
									fill={prize.textColor}
									style={{ pointerEvents: 'none' }}
								>
									{lines.map((line, lineIndex) => (
										<tspan
											key={`${prize.id}-${lineIndex}`}
											x={labelX}
											dy={lineIndex === 0 ? firstLineOffset : lineHeight}
										>
											{line}
										</tspan>
									))}
								</text>
							</g>
						);
					})}

					{Array.from({ length: 12 }).map((_, index) => {
						const angle = (((index * 360) / 12 - 90) * Math.PI) / 180;
						const dotX = center + (radius - 2.6) * Math.cos(angle);
						const dotY = center + (radius - 2.6) * Math.sin(angle);

						return (
							<circle
								key={`dot-${index}`}
								cx={dotX}
								cy={dotY}
								r={0.9}
								fill="rgba(255,255,255,0.78)"
							/>
						);
					})}
				</svg>
			</div>

			<div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[60%] drop-shadow-md">
				<div
					className="h-0 w-0 border-l-[13px] border-r-[13px] border-t-[22px] border-l-transparent border-r-transparent"
					style={{ borderTopColor: primaryColor }}
				/>
			</div>

			<button
				type="button"
				onClick={onSpin}
				disabled={!canSpin || busy}
				aria-label={buttonLabel}
				className="absolute left-1/2 top-1/2 z-10 flex h-[25%] w-[25%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center gap-0.5 rounded-full border-4 text-[10px] font-bold uppercase tracking-wide shadow-xl transition disabled:cursor-not-allowed disabled:opacity-95"
				style={{
					background: highlightBackground,
					color: highlightTextColor,
					borderColor: primaryColor,
				}}
			>
				{!canSpin ? (
					<LockKeyhole className="h-5 w-5" />
				) : busy ? (
					<Loader2 className="h-5 w-5 animate-spin" />
				) : (
					<RotateCw className="h-5 w-5" />
				)}
				<span className="max-w-full px-1 text-center leading-none">{buttonLabel}</span>
			</button>
		</div>
	);
}
