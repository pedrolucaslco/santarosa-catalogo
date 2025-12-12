'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronUp, Loader2, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from "react";
import { BsWhatsapp } from "react-icons/bs";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"

interface Config {
	key: string;
	value: string;
}

interface Product {
	id: number;
	name: string;
	price: string;
	priceFrom: string;
	url: string;
	category: string;
	isDePor: string | null;
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

	/**
	 * -------------------------------------------------------------------------
	 * -------------------------------------------------------------------------
	 * -------------------------------------------------------------------------
	 * -------------------------------------------------------------------------
	 * CONFIGURAÇÕES SOBRE A CAMPANHA
	 * -------------------------------------------------------------------------
	 * -------------------------------------------------------------------------
	 * -------------------------------------------------------------------------
	 * -------------------------------------------------------------------------
	 */


	// CONFIGURAÇÕES DO CATÁLOGO -----------------------------------------------
	// -------------------------------------------------------------------------
	const CAMPAIGN_TITLE = "Catálogo de Natal • Santa Rosa";
	const CAMPAIGN_END_DATE = "31/12/2025";
	// -------------------------------------------------------------------------
	const HEADER_BANNER_SHOW = 1;
	const HEADER_BANNER_URL = '/banner.png';
	// -------------------------------------------------------------------------
	const SHOW_SEARCH_BAR = true;
	// -------------------------------------------------------------------------
	const FOOTER_ADS_SHOW = 1;
	const FOOTER_ADS_URL = '/footer-ads.png';
	// -------------------------------------------------------------------------
	const ACCENT_COLOR = 'red-800';
	const WPP_COLOR = 'emerald-600';

	// OUTRAS CONFIGURAÇÕES ----------------------------------------------------
	const BANNER_SLOT_PRETEXT = "Catálogo Digital";
	const BANNER_SLOT_TITLE = CAMPAIGN_TITLE;
	const BANNER_SLOT_CONDITIONS = "Válido até o dia " + CAMPAIGN_END_DATE;
	const BANNER_SLOT_LOGO = "/banner-logo.png";
	const BANNER_SLOT_BACK_LOGO = "/banner-back-logo.png";
	const BANNER_COLOR = "bg-orange-50";
	const BANNER_COLOR_TEXTURE = "bg-orange-50/50";

	// SOBRE A SANTA ROSA ------------------------------------------------------
	const WHATSAPP = "558488094714";

	// CONFIGURAÇÕES -----------------------------------------------------------

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

	// Fechar catálogo se a data de validade for passada -----------------------

	const [day, month, year] = CAMPAIGN_END_DATE.split('/');
	const DUE_DATE = new Date(`${year}-${month}-${day}T23:59:59`);

	const NOW = new Date();

	if (NOW > DUE_DATE) {
		PAGE_STATUS = 'closed';
	}

	// -------------------------------------------------------------------------

	const [config, setConfig] = useState<Config[]>([]);
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


	if (loading) return <p>Carregando...</p>;
	if (error) return <p>Error: {error}</p>;

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter' && dummyDivRef.current) {
			dummyDivRef.current.focus();
		}
	};

	const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value);
	};

	const filteredProducts = products.filter((product) =>
		product?.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const filteredGallery = gallery;

	var defaultText = 'Olá! Gostaria de fazer um pedido do catálogo ' + CAMPAIGN_TITLE + ' - ';

	function getLinkWhatsApp(product_name: string, product_price: string) {
		var urlBase = 'https://wa.me/' + WHATSAPP + '?text=';
		var productPrice = product_price ? ' | R$' + product_price : '';

		if (!product_price) return urlBase + defaultText + product_name;

		return urlBase + defaultText + product_name + productPrice;
	}
	function getLinkWhatsAppByName(product_name: string) {
		return 'https://wa.me/' + WHATSAPP + '?text=' + defaultText + product_name;
	}

	return (
		<main className="bg-muted/40 flex gap-8 min-h-screen flex-col items-center justify-start w-screen pb-16">
			<div className="w-full overflow-hidden shadow-lg">
				{
					HEADER_BANNER_SHOW ?
						<Image src={HEADER_BANNER_URL} alt="Product Image" width={4000} height={1000} className="w-full h-72 md:h-96 lg:h-auto lg:aspect-[4/1] object-cover" />
						:
						<div className={`w-full h-72 bg-orange-50 md:h-96 lg:h-auto lg:aspect-[4/1] text-center flex flex-col items-center justify-between py-8 text-${ACCENT_COLOR}`}>
							<p>{BANNER_SLOT_PRETEXT}</p>
							<div className="flex flex-col items-center justify-center gap-4">
								<h1 className="text-4xl font-bold">{BANNER_SLOT_TITLE}</h1>
								<p className="mb-4">Santa Rosa Acessórios</p>
							</div>
							<p className="text-xs">* {BANNER_SLOT_CONDITIONS}</p>
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
					{SHOW_SEARCH_BAR ? (
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

					<div className={`w-100 flex flex-col gap-2 items-center text-${ACCENT_COLOR}`}>
						<h2 className={`text-center text-2xl font-bold`}>{CAMPAIGN_TITLE}<br /></h2>
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
											className={`py-4 bg-white text-2xl font-bold sticky top-14 text-${ACCENT_COLOR}`}>{category.replace(/^\d+\.\s*/, '')}</h2>
										<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
											{productsInCategory.map((product) => (
												<Card key={product.id} className="overflow-hidden flex flex-col">
													<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full aspect-square object-cover pb-2" loading="lazy" unoptimized />
													<CardContent className="p-2 flex-grow">
														<div className="flex justify-start flex-wrap flex-col">
															<h3 className="font-bold mb-2 whitespace-pre-wrap">
																{product.name}
															</h3>


															{product.isDePor ? (
																<p className="md:hidden text-gray-700 dark:text-gray-400 text-base font-semibold"><span className="line-through">De: R${product.priceFrom}</span> <br />Por: R${product.price}</p>
															) : (
																<p className="md:hidden text-gray-700 dark:text-gray-400 text-lg font-semibold">R${product.price}</p>
															)}
														</div>
													</CardContent>
													<CardFooter className="p-2">
														<div className="justify-between flex flex-col md:flex-row gap-2 w-full">

															{product.isDePor ? (
																<p className="hidden md:block text-gray-700 dark:text-gray-400 text-sm font-semibold"><span className="line-through">De: R${product.priceFrom}</span> <br />Por: R${product.price}</p>
															) : (
																<p className="hidden md:block text-gray-700 dark:text-gray-400 text-lg font-semibold">{product.price ? 'R$' + product.price : ''}</p>
															)}

															<Button className={'bg-' + WPP_COLOR} asChild>
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
										className={`py-4 bg-white text-2xl font-bold sticky top-14 text-${ACCENT_COLOR}`}>{category.replace(/^\d+\.\s*/, '')}</h2>
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
														<Button className={'bg-' + WPP_COLOR} asChild>
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
						FOOTER_ADS_SHOW ?
							(
								<>
									<div className="w-full overflow-hidden">
										<Image src={FOOTER_ADS_URL} alt="Product Image" width={1080} height={1080} className="w-full object-cover" />
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