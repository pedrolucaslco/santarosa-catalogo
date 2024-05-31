'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, MessageCircle } from "lucide-react";
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

interface Product {
	id: number;
	name: string;
	price: string;
	url: string;
}

export default function Home() {

	const [searchTerm, setSearchTerm] = useState('');
	const [products, setProducts] = useState<Product[]>([]);
	const [gallery, setGallery] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const dummyDivRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch('/api/products');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data = await response.json();
				setProducts(data);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, []);

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch('/api/gallery');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data = await response.json();
				setGallery(data);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, []);

	if (loading) return <p>Loading...</p>;
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
		return 'https://wa.me/558488094714?text=Olá! Gostaria de fazer um pedido do Kit de Dia dos Namorados ' + product_name + ' | R$' + product_price;
	}

	return (
		<main className="bg-muted/40 flex gap-8 min-h-screen flex-col items-center justify-start w-screen pb-8">
			<div className="w-full overflow-hidden shadow-lg">
				<Image src='/banner-catalogo.png' alt="Product Image" width={4000} height={1000} className="w-full h-80 object-cover" loading="lazy" />
			</div>
			<div className="flex gap-8 min-h-screen flex-col items-center justify-start w-screen px-4 sm:px-8 md:px-10 lg:px-20">
				<div className="w-full sm:w-full md:w-96 lg:w-96">
					<Input type="text"
						ref={inputRef}
						placeholder="Pesquisar"
						value={searchTerm}
						onChange={handleSearch}
						onKeyDown={handleKeyDown}>
					</Input>
				</div>

				{/* <div className="w-100 flex gap-2 ">
					<Button variant='link' disabled>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Carregando
					</Button>
				</div> */}
				<div ref={dummyDivRef} className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
					{filteredProducts.map((product) => (
						<Card key={product.id} className="overflow-hidden ">
							<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full h-80 object-cover pb-4" loading="lazy" />
							<CardContent>
								<div className="flex justify-start flex-wrap flex-col">
									<h3 className="text-xl font-bold mb-2">{product.name}</h3>
									<p className="md:hidden text-gray-700 dark:text-gray-400 text-lg font-semibold">R${product.price}</p>
								</div>
							</CardContent>
							<CardFooter>
								<div className="justify-between flex flex-col md:flex-row gap-2 w-full">
									<p className="hidden md:block text-gray-700 dark:text-gray-400 text-lg font-semibold">R${product.price}</p>
									<Button className="bg-emerald-600 " asChild>
										<Link href={getLinkWhatsApp(product.name, product.price)} target="_blank">
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
				<div>
					<h1 className="text-2xl font-bold text-red-800">Mais Opções</h1>
				</div>
				<div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
					{gallery.map((product) => (
						<Dialog key={product.id}>
							<DialogTrigger asChild>
								<Card className="overflow-hidden ">
									<Image src={product.url} alt="Product Image" width={400} height={400} className="w-full h-80 object-cover" loading="lazy" />
								</Card>
							</DialogTrigger>
							<DialogContent className="h-screen max-w-screen flex items-center justify-center">
								<div className="p-3 overflow-hidden">
									<Image src={product.url} alt="Product Image" width={800} height={800} className="w-full h-auto md:h-screen rounded-md md:rounded-none object-cover" loading="lazy" />
								</div>
							</DialogContent>
						</Dialog>

					))}
				</div>
			</div>
		</main >
	);
}