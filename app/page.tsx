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
	url: string;
	category: string;
}

interface Gallery {
	id: number;
	name: string;
	items: Product[];
	url: string;
}

type StatusType = 'closed' | 'maintenance' | 'running';

export default function Home() {

	// Implementando banner automático
	const BANNER_SLOT_PRETEXT = "Catálogo Digital";
	const BANNER_SLOT_TITLE = "Dia dos Avós";
	const BANNER_SLOT_CONDITIONS = "Válido até o dia 26/07/2025";
	const BANNER_SLOT_LOGO = "/banner-logo.png";
	const BANNER_SLOT_BACK_LOGO = "/banner-back-logo.png";
	const BANNER_COLOR = "bg-orange-50";
	const BANNER_COLOR_TEXTURE = "bg-orange-50/50";


	const NOME_CATALOGO = "Catálogo Dia dos Avós";
	const WHATSAPP = "558488094714";
	const SHOW_HEADER_BANNER = true;
	const HEADER_BANNER_URL = '/banner-avos.png';

	const PAGE_STATUS = 'running';

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
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data = await response.json();
				setProducts(data);
				console.log('products: ', data);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, []);

	// useEffect(() => {
	// 	const fetchProducts = async () => {
	// 		try {
	// 			const response = await fetch('/api/gallery');
	// 			if (!response.ok) {
	// 				throw new Error('Network response was not ok');
	// 			}
	// 			const data = await response.json();
	// 			setGallery(data);
	// 		} catch (err: any) {
	// 			setError(err.message);
	// 		} finally {
	// 			setLoading(false);
	// 		}
	// 	};

	// 	fetchProducts();
	// }, []);

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
		product.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	function getLinkWhatsApp(product_name: string, product_price: string) {
		var urlBase = 'https://wa.me/' + WHATSAPP + '?text=';
		var defaultText = 'Olá! Gostaria de fazer um pedido do ' + NOME_CATALOGO + ' -  ' + product_name;
		var productPrice = product_price ? ' | R$' + product_price : '';
		return urlBase + defaultText + productPrice;
	}
	function getLinkWhatsAppByName(product_name: string) {
		return 'https://wa.me/' + WHATSAPP + '?text=Olá! Gostaria de fazer um pedido do ' + NOME_CATALOGO + ' - ' + product_name;
	}

	return (
		<main className="bg-muted/40 flex gap-8 min-h-screen flex-col items-center justify-start w-screen pb-16">
			<div className="w-full overflow-hidden shadow-lg">
				{
					SHOW_HEADER_BANNER ?
						<Image src={HEADER_BANNER_URL} alt="Product Image" width={4000} height={1000} className="w-full h-72 md:h-96 lg:h-auto lg:aspect-[4/1] object-cover" />
						:
						<div className="w-full h-72 bg-orange-50 text-orange-900 md:h-96 lg:h-auto lg:aspect-[4/1] text-center flex flex-col items-center justify-between py-8">
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
					<h1 className="text-2xl font-bold text-red-800">{CLOSED_STATUSES[pageStatus].title}</h1>
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
					<div className="w-full sm:w-full md:w-96 lg:w-96">
						<Input type="text"
							ref={inputRef}
							placeholder="Pesquisar"
							value={searchTerm}
							onChange={handleSearch}
							onKeyDown={handleKeyDown}>
						</Input>
					</div>

					<div className="w-100 flex flex-col gap-2 items-center">
						<h2 className="text-2xl font-bold text-orange-900">Sugestões de Presente</h2>
						<p>Semijoias banhadas a ouro 18K, hipoalergênicas e com garantia.</p>
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
										<h2 className="my-4 text-2xl font-bold text-orange-900">{category}</h2>
										<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
											{productsInCategory.map((product) => (
												<Card key={product.id} className="overflow-hidden flex flex-col">
													<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full aspect-square object-cover pb-2" loading="lazy" />
													<CardContent className="p-2 flex-grow">
														<div className="flex justify-start flex-wrap flex-col">
															<h3 className="font-bold mb-2">{product.name}</h3>
															<p className="md:hidden text-gray-700 dark:text-gray-400 text-lg font-semibold">R${product.price}</p>
														</div>
													</CardContent>
													<CardFooter className="p-2">
														<div className="justify-between flex flex-col md:flex-row gap-2 w-full">

															<p className="hidden md:block text-gray-700 dark:text-gray-400 text-lg font-semibold">R${product.price}</p>

															<Button className="bg-emerald-600 " asChild>
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

					{gallery.length > 0 ? (
						<>
							<div>
								<h1 className="text-2xl font-bold text-red-800">Mais Opções</h1>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
								{gallery.map((product) => (
									<Card className="overflow-hidden flex flex-col" key={product.id}>
										<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full aspect-[4/5] object-cover pb-2" loading="lazy" />
										<CardContent className="p-2 flex-grow">
											<div className="flex flex-wrap flex-col divide-y ">
												{product.items.map((item) => (
													<div key={item.id} className="flex items-center justify-between py-4">
														<h3 className="text-sm font-bold">
															{item.name} <span className="text-sm text-gray-700 dark:text-gray-400 font-semibold">R${item.price}</span>
														</h3>
													</div>
												))}
											</div>
										</CardContent>
										<CardFooter className="p-2">
											<div className="justify-between flex flex-col md:flex-row gap-2 w-full">
												<Button className="bg-emerald-600 " asChild>
													<Link href={getLinkWhatsAppByName(product.name)} target="_blank">
														{/* <MessageCircle className="mr-2 h-4 w-4"></MessageCircle> */}
														<BsWhatsapp className="mr-2 h-4 w-4"></BsWhatsapp>
														Pedir
													</Link>
												</Button>
											</div>
										</CardFooter>
									</Card>
								))}
							</div>
						</>
					) : (<></>)}

					{/* <div className="w-full overflow-hidden">
					<Image src='/ad-catalogo.png' alt="Product Image" width={1080} height={1080} className="w-full aspect-[1/1] object-cover" />
				</div> */}
				</div>
			}
			<p className="text-muted-foreground text-sm">© 2025 Santa Rosa Acessórios</p>
		</main >
	);
}