'use client'

import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BsWhatsapp } from "react-icons/bs";
import { ChevronUp } from "lucide-react";

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
	const campaign_title = "Mãe • Legado que Permanece";
	const campaign_end_date = "31/05/2026";
	const accent_color = 'red-900';
	const wpp_color = 'emerald-600';
	const whatsapp = "558488094714";


	// Enviropment variables ---------------------------------------------------
	const header_banner_show = 1;
	const header_banner_url = '/banner-dia-das-maes-2026.png';
	const header_banner_slot_pretext = "Catálogo Digital";
	const header_banner_slot_title = campaign_title;
	const header_banner_slot_conditions = "Válido até o dia " + campaign_end_date;

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
		setSearchTerm(e.target.value);
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
		<main className="bg-muted/40 flex gap-8 min-h-screen flex-col items-center justify-start w-screen pb-16">
			<div className="w-full overflow-hidden shadow-lg">
				{
					header_banner_show ?
						<Image src={header_banner_url} alt="Product Image" width={4000} height={1000} className="w-full h-72 md:h-96 lg:h-auto lg:aspect-[4/1] object-cover" />
						:
						<div className={`w-full h-72 bg-orange-50 md:h-96 lg:h-auto lg:aspect-[4/1] text-center flex flex-col items-center justify-between py-8 text-${accent_color}`}>
							<p>{header_banner_slot_pretext}</p>
							<div className="flex flex-col items-center justify-center gap-4">
								<h1 className="text-4xl font-bold">{header_banner_slot_title}</h1>
								<p className="mb-4">Santa Rosa Acessórios</p>
							</div>
							<p className="text-xs">* {header_banner_slot_conditions}</p>
						</div>
				}
			</div>

			{pageStatus != 'running' ?
				<div className="w-full flex flex-col items-center justify-center">
					<h1 className="text-2xl font-bold text-gray-700">{CLOSED_STATUSES[pageStatus].title}</h1>
					<p className="text-lg font-semibold text-gray-700 dark:text-gray-400">{CLOSED_STATUSES[pageStatus].message}</p>
				</div>
				:
				<div className="flex gap-8 min-h-screen flex-col items-center justify-start w-screen px-4 sm:px-8 md:px-10 lg:px-20">
					<div className="fixed bottom-2 right-2 z-50">
						<Button variant="default" size="icon" className="size-12"
							onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
							<ChevronUp></ChevronUp>
						</Button>
					</div>
					{search_bar_show ? (
						<div className="bg-white py-3 w-full sticky top-0 flex justify-center">
							<Input type="text"
								className="w-full sm:w-full md:w-96 lg:w-96"
								ref={inputRef}
								placeholder="Pesquisar"
								value={searchTerm}
								onChange={handleSearch}
								onKeyDown={handleKeyDown}>
							</Input>
						</div>
					) : (
						<div className="bg-white py-3 w-full h-14 sticky top-0 flex justify-center"></div>
					)}

					<div className={`w-100 flex flex-col gap-2 items-center text-${accent_color}`}>
						<h2 className={`text-center text-2xl font-bold`}>{campaign_title}<br /></h2>
						<p className="text-center">Semijoias banhadas a ouro 18K, hipoalergênicas e com garantia.</p>
					</div>

					{/* <div className="w-100 flex gap-2 ">
					<Button variant='link' disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Carregando
					</Button>
				</div> */}

					<div ref={dummyDivRef} className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4 w-full">
						{
							// filteredProducts.map((product) => (

							Object.entries(
								filteredProducts.reduce((acc, product) => {
									const category = product.category || '';
									if (!acc[category]) acc[category] = [];
									acc[category].push(product);
									return acc;
								}, {} as Record<string, Product[]>)
							)
								.sort(([a], [b]) => a.localeCompare(b))
								.map(([category, productsInCategory]) => (
									<div key={category} className="flex flex-col gap-4">
										<h2 id={category.replace(' ', '-').replace('%', 'pct')}
											className={`py-4 bg-white text-2xl font-bold sticky top-14 text-${accent_color}`}>{category.replace(/^\d+\.\s*/, '')}</h2>
										<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
											{productsInCategory.map((product) => {
												const items = getProductItems(product);
												const hasMultipleItems = items.length > 1;

												return (
													<Card key={product.id} className="overflow-hidden flex flex-col">
														<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full aspect-square object-cover pb-2" loading="lazy" unoptimized />
														<CardContent className="p-2 flex-grow">
															<div className="flex justify-start flex-col divide-y divide-gray-100">
																{items.map((item, itemIndex) => (
																	<div key={`${product.id}-${itemIndex}`} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
																		<h3 className={`${hasMultipleItems ? 'text-sm' : 'text-base'} font-bold leading-snug break-words`}>
																			{item.name}
																		</h3>
																		{item.isDePor ? (
																			<p className="text-gray-700 dark:text-gray-400 text-sm font-semibold leading-tight">
																				<span className="line-through">De: R${item.priceFrom}</span>
																				<br />
																				Por: R${item.price}
																			</p>
																		) : (
																			<p className={`${hasMultipleItems ? 'text-base' : 'text-lg'} text-gray-700 dark:text-gray-400 font-semibold leading-tight`}>
																				{item.price ? 'R$' + item.price : ''}
																			</p>
																		)}
																	</div>
																))}
															</div>
														</CardContent>
														<CardFooter className="p-2">
															<Button className={'bg-' + wpp_color + ' w-full'} asChild>
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
									</div>
								))}
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
										className={`py-4 bg-white text-2xl font-bold sticky top-14 text-${accent_color}`}>{category.replace(/^\d+\.\s*/, '')}</h2>
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
														<Button className={'bg-' + wpp_color} asChild>
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
			<p className="text-muted-foreground text-sm">© 2025 Santa Rosa Acessórios</p>
		</main >
	);
}
