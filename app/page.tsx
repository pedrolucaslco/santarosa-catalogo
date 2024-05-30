'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {

	const [searchTerm, setSearchTerm] = useState('');

	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch('/api/products');
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data = await response.json();
				setProducts(data);
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, []);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error}</p>;

	const filteredProducts = products.filter((product) =>
		product.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<main className="flex min-h-screen flex-col items-center justify-start w-screen py-8 px-4 sm:px-8 md:px-10 lg:px-20">
			<div className="w-full sm:w-full md:w-80 lg:w-80 pb-8">
				<Input type="text"
					placeholder="Pesquisar"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}>
				</Input>
			</div>
			<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-4 w-full">
				{filteredProducts.map((product) => (
					<Card className="overflow-hidden ">
						<Image src={product.url} alt="Product Image" width={500} height={400} className="w-full h-64 object-cover pb-4" loading="lazy" />
						<CardContent>
							<div className="flex justify-start flex-wrap flex-col">
								<h3 className="text-xl font-bold mb-2">{product.name}</h3>
								<p className="text-gray-700 dark:text-gray-400 text-lg font-semibold">R${product.price}</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</main >
	);
}