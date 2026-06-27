'use client'

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BsWhatsapp } from "react-icons/bs";
import { ChevronUp, Search } from "lucide-react";

interface ProductItem {
	name: string;
	price: string;
	priceFrom: string;
	isDePor: string | false | null;
}

interface Product {
	id: number;
	name: string;
	price: string;
	priceFrom: string;
	url: string;
	category: string;
	isDePor: string | null;
	items?: ProductItem[];
}

interface Gallery {
	id: number;
	name: string;
	price: string;
	priceFrom: string;
	url: string;
	category: string;
	isDePor: string | null;
}

type StatusType = 'closed' | 'maintenance' | 'running';

export default function Home() {

	useEffect(() => {
		fetch('/api/logout', { method: 'POST' })
	}, [])


	// Campaign details --------------------------------------------------------
	const campaign_title = "Santa Rosa";
	const campaign_end_date = "12/12/2026";
	const whatsapp = "558488094714";


	// Enviropment variables ---------------------------------------------------
	const header_banner_show = 0;
	const header_banner_url = '/banner-namorados-2026.png';
	const header_banner_slot_pretext = "Catálogo Digital";
	const header_banner_slot_title = campaign_title;
	const header_banner_slot_conditions = "Válido até o dia " + campaign_end_date;
	const header_banner_slot_conditions_show = 0;

	const search_bar_show = 1;

	const footer_ads_show = 0;
	const footer_ads_url = '/footer-ads.png';

	// -------------------------------------------------------------------------

	let PAGE_STATUS: StatusType = 'running';

	const CLOSED_STATUSES: Record<StatusType, { title: string; message: string }> = {
		closed: {
			title: 'Campanha Encerrada',
			message: 'Agradecemos pelas suas compras!',
		},
		maintenance: {
			title: 'Em manutenção',
			message: 'Este serviço está em manutenção. Tente novamente mais tarde.',
		},
		running: {
			title: 'Sistema On-line',
			message: 'Serviço em funcionamento.',
		},
	};

	// Close the catalog if the date of expiration is passed -------------------

	const [day, month, year] = campaign_end_date.split('/');
	const due_date = new Date(`${year}-${month}-${day}T23:59:59`);

	const now = new Date();

	if (now > due_date) {
		PAGE_STATUS = 'closed';
	}

	// -------------------------------------------------------------------------

	const [searchTerm, setSearchTerm] = useState('');
	const [products, setProducts] = useState<Product[]>([]);
	const [gallery, setGallery] = useState<Gallery[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [pageStatus, setPageStatus] = useState<StatusType>('running');
	const inputRef = useRef<HTMLInputElement>(null);
	const dummyDivRef = useRef<HTMLDivElement>(null);

	useEffect(() => {

		setPageStatus(PAGE_STATUS);

		const fetchProducts = async () => {
			try {
				const response = await fetch('/api/products');
				console.log('RESPONSE: ', response);

				if (!response.ok) {
					// A API falhou (Status 500)
					const errorData = await response.json();

					// EXIBIÇÃO NO CONSOLE DO NAVEGADOR
					console.error("--- ERRO DETALHADO DA API ---");
					console.error("Mensagem:", errorData.message);
					console.error("Stack Trace da API:", errorData.stack);
					console.error("-----------------------------");

					// Você pode até mostrar na UI se estiver em modo desenvolvimento
					throw new Error(`Erro interno da API.`);
				}

				const data = await response.json();
				setProducts(data);
				console.log('products: ', data);
			} catch (err: any) {
				setError(err.message);
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();

		const fetchGallery = async () => {
			try {
				const response = await fetch('/api/gallery');
				console.log('response: ', response);
				if (!response.ok) {
					throw new Error('Network response was not ok for /api/gallery');
				}
				const data = await response.json();
				setGallery(data);
				console.log('gallery: ', data);
			} catch (err: any) {
				setError(err.message);
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		// fetchGallery();
	}, []);


	// show loading at the center of the page
	if (loading) return <p className="h-screen w-screen flex items-center justify-center">Carregando...</p>;
	if (error) return <p className="h-screen w-screen flex items-center justify-center">Error: {error}</p>;

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' && dummyDivRef.current) {
			dummyDivRef.current.focus();
		}
	};

	const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;

		setSearchTerm(value);

		if (value.trim().length > 0 && dummyDivRef.current) {
			window.requestAnimationFrame(() => {
				const headerOffset = 72;
				const top = dummyDivRef.current!.getBoundingClientRect().top + window.scrollY - headerOffset;
				window.scrollTo({ top, behavior: 'smooth' });
			});
		}
	};

	const getProductItems = (product: Product): ProductItem[] => {
		if (product.items?.length) return product.items;

		return [{
			name: product.name,
			price: product.price,
			priceFrom: product.priceFrom,
			isDePor: product.isDePor,
		}];
	};

	const filteredProducts = products.filter((product) => {
		const search = searchTerm.toLowerCase();
		const searchableText = getProductItems(product)
			.map((item) => `${item.name} ${item.price}`)
			.join(' ')
			.toLowerCase();

		return searchableText.includes(search);
	});

	const filteredGallery = gallery;
	const groupedProducts = Object.entries(
		filteredProducts.reduce((acc, product) => {
			const category = product.category || 'Mais opções';
			if (!acc[category]) acc[category] = [];
			acc[category].push(product);
			return acc;
		}, {} as Record<string, Product[]>)
	).sort(([a], [b]) => a.localeCompare(b));

	var defaultText = 'Olá! Gostaria de fazer um pedido do catálogo ' + campaign_title + ' - ';

	function getLinkWhatsApp(product_name: string, product_price: string) {
		var urlBase = 'https://wa.me/' + whatsapp + '?text=';
		var productPrice = product_price ? ' | R$' + product_price : '';

		if (!product_price) return urlBase + encodeURIComponent(defaultText + product_name);

		return urlBase + encodeURIComponent(defaultText + product_name + productPrice);
	}
	function getLinkWhatsAppByName(product_name: string) {
		return 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(defaultText + product_name);
	}

	function getLinkWhatsAppByItems(items: ProductItem[]) {
		if (items.length === 1) {
			return getLinkWhatsApp(items[0].name, items[0].price);
		}

		const itemText = items
			.map((item) => {
				const price = item.price ? ` | R$${item.price}` : '';
				return `${item.name}${price}`;
			})
			.join(' / ');

		return 'https://wa.me/' + whatsapp + '?text=' + encodeURIComponent(defaultText + itemText);
	}

	return (
		<main className="min-h-screen w-full bg-[#f8f3f1] text-stone-950">
			{pageStatus != 'running' ?
				<div className="flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
					<h1 className="text-2xl font-bold text-red-950">{CLOSED_STATUSES[pageStatus].title}</h1>
					<p className="mt-2 text-base font-medium text-stone-600">{CLOSED_STATUSES[pageStatus].message}</p>
				</div>
				:
				<div className="min-h-screen w-full pb-24">
					<div className="fixed bottom-4 right-4 z-50">
						<Button variant="default" size="icon" className="size-11 rounded-full bg-red-950 shadow-lg hover:bg-red-900"
							onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
							<ChevronUp className="h-5 w-5" />
						</Button>
					</div>

					<header className="sticky top-0 z-40 border-b border-red-950/10 bg-[#f8f3f1]/95 px-4 py-3 backdrop-blur md:px-8 lg:px-16">
						<div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
							{search_bar_show ? (
								<div className="relative">
									<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
									<Input type="text"
										className="h-11 w-full rounded-full border-stone-200 bg-white pl-10 pr-4 text-base shadow-sm focus-visible:ring-red-950"
										ref={inputRef}
										placeholder="Buscar semijoia"
										value={searchTerm}
										onChange={handleSearch}
										onKeyDown={handleKeyDown}>
									</Input>
								</div>
							) : null}
						</div>
					</header>

					<div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-4 md:px-8 lg:px-16">
						<section className="overflow-hidden rounded-lg bg-white shadow-sm">
							{header_banner_show ? (
								<>
									<div className="relative aspect-square w-full overflow-hidden sm:aspect-[4/1]">
										<Image src={header_banner_url} alt="Catálogo Santa Rosa" fill className="object-cover object-center" priority />
									</div>
									<div className="p-4 sm:p-6">
										<p className="text-xs font-medium uppercase tracking-[0.22em] text-red-950/70">{header_banner_slot_pretext}</p>
										<h1 className="mt-2 text-2xl font-semibold leading-tight text-red-950 sm:text-3xl">{campaign_title}</h1>
										<p className="mt-2 text-sm leading-6 text-stone-600">Semijoias banhadas a ouro 18K, hipoalergênicas e com garantia.</p>
									</div>
								</>
							) : (
								<div className="relative flex min-h-56 flex-col items-center justify-center gap-3 bg-[#F3E1CB] p-8 text-center sm:min-h-64">
									<span className="text-[10px] font-medium uppercase tracking-[0.35em] text-[#875F53]">
										{header_banner_slot_pretext}
									</span>
									<h1 className="text-3xl font-bold tracking-wide text-[#875F53] sm:text-4xl">
										{header_banner_slot_title}
									</h1>
									<p className="text-lg font-light tracking-wide text-[#875F53]">
										Semijoias que iluminam
									</p>
									<div className="h-px w-20 bg-[#875F53]/20" />
									<p className="text-sm font-light text-[#875F53]">
										Banhadas a ouro 18K, hipoalergênicas e com garantia
									</p>
									<span className="mt-2 rounded-full border border-[#875F53]/20 px-4 py-1 text-[11px] font-medium uppercase tracking-wider text-[#875F53]">
										coleção exclusiva
									</span>
								</div>
							)}
						</section>
					</div>

					{/* <div className="w-100 flex gap-2 ">
					<Button variant='link' disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Carregando
					</Button>
				</div> */}

					<div ref={dummyDivRef} className="mx-auto mt-6 grid w-full max-w-7xl grid-cols-1 gap-8 px-4 md:px-8 lg:px-16">
						{
							// filteredProducts.map((product) => (

							groupedProducts.length > 0 ? groupedProducts
								.map(([category, productsInCategory]) => (
									<section key={category} className="flex flex-col gap-3">
										<h2 id={category.replace(' ', '-').replace('%', 'pct')}
											className="sticky top-[69px] z-30 -mx-4 border-y border-red-950/10 bg-[#f8f3f1]/95 px-4 py-3 text-lg font-bold text-red-950 backdrop-blur md:mx-0 md:rounded-lg md:border md:bg-white/95">
											{category.replace(/^\d+\.\s*/, '')}
										</h2>
										<div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
											{productsInCategory.map((product) => {
												const items = getProductItems(product);
												const hasMultipleItems = items.length > 1;

												return (
													<Card key={product.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border-red-950/10 bg-white shadow-sm">
														<div className="relative bg-stone-100">
															<Image src={product.url} alt={product.name} width={500} height={500} className="aspect-square w-full object-cover" loading="lazy" unoptimized />
															{hasMultipleItems && (
																<span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-red-950 shadow-sm">
																	{items.length} itens
																</span>
															)}
														</div>
														<CardContent className="flex flex-grow flex-col p-3">
															<div className="flex flex-col divide-y divide-stone-100">
																{items.map((item, itemIndex) => (
																	<div key={`${product.id}-${itemIndex}`} className="flex min-w-0 flex-col gap-1 py-2 first:pt-0 last:pb-0">
																		<h3 className={`${hasMultipleItems ? 'text-[13px]' : 'text-sm'} min-h-9 break-words font-semibold leading-snug text-stone-900`}>
																			{item.name}
																		</h3>
																		{item.isDePor ? (
																			<p className="text-sm font-semibold leading-tight text-red-950">
																				<span className="line-through">De: R${item.priceFrom}</span>
																				<br />
																				Por: R${item.price}
																			</p>
																		) : (
																			<p className={`${hasMultipleItems ? 'text-base' : 'text-lg'} font-bold leading-tight text-red-950`}>
																				{item.price ? 'R$' + item.price : ''}
																			</p>
																		)}
																	</div>
																))}
															</div>
														</CardContent>
														<CardFooter className="p-3 pt-0">
															<Button className="h-10 w-full rounded-lg bg-emerald-600 text-sm font-semibold hover:bg-emerald-700" asChild>
																<Link href={getLinkWhatsAppByItems(items)} target="_blank">
																	<BsWhatsapp className="mr-2 h-4 w-4 shrink-0"></BsWhatsapp>
																	{hasMultipleItems ? 'Pedir itens' : 'Pedir'}
																</Link>
															</Button>
														</CardFooter>
													</Card>
												);
											})}
										</div>
									</section>
								)) : (
								<div className="rounded-lg bg-white px-4 py-10 text-center shadow-sm">
									<p className="text-base font-semibold text-red-950">Nenhum produto encontrado</p>
									<p className="mt-1 text-sm text-stone-500">Tente buscar por outro nome ou categoria.</p>
								</div>
							)}
					</div>

					{
						Object.entries(
							filteredGallery.reduce((acc, product) => {
								const category = product.category || '';
								if (!acc[category]) acc[category] = [];
								acc[category].push(product);
								return acc;
							}, {} as Record<string, Gallery[]>)
						)
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([category, productsInCategory]) => (
								<div key={category} className="flex flex-col gap-4">
									<h2 id={category.replace(' ', '-').replace('%', 'pct')}
										className="sticky top-[69px] z-30 bg-white py-4 text-2xl font-bold text-red-950">{category.replace(/^\d+\.\s*/, '')}</h2>
									<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
										{productsInCategory.map((product) => (
											<Card key={product.id} className="overflow-hidden flex flex-col">
												<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full object-cover pb-2" loading="lazy" unoptimized />
												<CardContent className="p-2 flex-grow">
													<div className="flex justify-start flex-wrap flex-col">
														<h3 className="font-bold mb-2">{product.name}</h3>
													</div>
												</CardContent>
												<CardFooter className="p-2">
													<div className="justify-between flex flex-col md:flex-row gap-2 w-full">
														<Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
															<Link href={getLinkWhatsApp(product.name, product.price)} target="_blank">
																<BsWhatsapp className="mr-2 h-4 w-4"></BsWhatsapp>
																Pedir
															</Link>
														</Button>
													</div>
												</CardFooter>
											</Card>
										))}
									</div>
								</div>
							))}

					{
						// gallery.length > 0 ? (
						// 	<>
						// 		<div>
						// 			<h1 className="text-2xl font-bold text-red-800">Mais Opções</h1>
						// 		</div>
						// 		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
						// 			{gallery.map((product) => (
						// 				<Card className="overflow-hidden flex flex-col" key={product.id}>
						// 					<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full aspect-[4/5] object-cover pb-2" loading="lazy" />
						// 					<CardContent className="p-2 flex-grow">
						// 						<div className="flex flex-wrap flex-col divide-y ">
						// 							{product.items.map((item) => (
						// 								<div key={item.id} className="flex items-center justify-between py-4">
						// 									<h3 className="text-sm font-bold">
						// 										{item.name} <span className="text-sm text-gray-700 dark:text-gray-400 font-semibold">R${item.price}</span>
						// 									</h3>
						// 								</div>
						// 							))}
						// 						</div>
						// 					</CardContent>
						// 					<CardFooter className="p-2">
						// 						<div className="justify-between flex flex-col md:flex-row gap-2 w-full">
						// 							<Button className="bg-emerald-600 " asChild>
						// 								<Link href={getLinkWhatsAppByName(product.name)} target="_blank">
						// 									{/* <MessageCircle className="mr-2 h-4 w-4"></MessageCircle> */}
						// 									<BsWhatsapp className="mr-2 h-4 w-4"></BsWhatsapp>
						// 									Pedir
						// 								</Link>
						// 							</Button>
						// 						</div>
						// 					</CardFooter>
						// 				</Card>
						// 			))}
						// 		</div>
						// 	</>
						// ) : (<></>)
					}

					{
						footer_ads_show ?
							(
								<>
									<div className="w-full overflow-hidden">
										<Image src={footer_ads_url} alt="Product Image" width={1080} height={1080} className="w-full object-cover" />
									</div>
								</>
							)
							:
							(<></>)
					}
				</div>
			}
			<p className="pb-8 text-center text-sm text-stone-500">© 2025 Santa Rosa Acessórios</p>
		</main >
	);
}
