'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Foto do card. Com mais de uma foto vira um carrossel (deslizar no celular, setas e pontos no desktop). */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
	const track = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const list = images.filter(Boolean);

	if (list.length <= 1) {
		return <Image src={list[0] ?? ''} alt={alt} width={500} height={500} className="aspect-square w-full object-cover" loading="lazy" unoptimized />;
	}

	const goTo = (i: number) => {
		const el = track.current;

		if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
	};

	return (
		<div className="group relative">
			<div
				ref={track}
				onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
				className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
			>
				{list.map((src, i) => (
					<Image
						key={src}
						src={src}
						alt={`${alt} (foto ${i + 1})`}
						width={500}
						height={500}
						className="aspect-square w-full shrink-0 snap-center object-cover"
						loading="lazy"
						unoptimized
					/>
				))}
			</div>
			{index > 0 && (
				<button type="button" aria-label="Foto anterior" onClick={() => goTo(index - 1)} className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-1 text-red-950 shadow md:group-hover:block">
					<ChevronLeft className="h-4 w-4" />
				</button>
			)}
			{index < list.length - 1 && (
				<button type="button" aria-label="Próxima foto" onClick={() => goTo(index + 1)} className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-1 text-red-950 shadow md:group-hover:block">
					<ChevronRight className="h-4 w-4" />
				</button>
			)}
			<div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
				{list.map((_, i) => (
					<span key={i} className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-white shadow' : 'bg-white/50'}`} />
				))}
			</div>
		</div>
	);
}
