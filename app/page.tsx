'use client'

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useState } from "react";

export default function Home() {

	const [searchTerm, setSearchTerm] = useState('');

	const productsArray = [
		{ id: 1, name: 'Card 1', price: 149.90},
		{ id: 2, name: 'Card 2', price: 149.90},
		{ id: 3, name: 'Card 3', price: 149.90},
		{ id: 4, name: 'Card 4', price: 149.90},
		{ id: 5, name: 'Card 5', price: 149.90},
		{ id: 6, name: 'Card 6', price: 149.90},
		{ id: 7, name: 'Card 7', price: 149.90},
		{ id: 8, name: 'Card 8', price: 149.90},
		{ id: 9, name: 'Card 9', price: 149.90},
		{ id: 10, name: 'Card 10', price: 149.90},
		{ id: 11, name: 'Card 11', price: 149.90},
		{ id: 12, name: 'Card 12', price: 149.90},
	];

	const filteredProducts = productsArray.filter((product) =>
		product.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	return (
		<main className="flex min-h-screen flex-col items-center justify-between p-24 w-screen">
			<div className="w-80 pb-8">
				<Input 	type="text"
        				placeholder="Pesquisar"
        				value={searchTerm}
        				onChange={(e) => setSearchTerm(e.target.value)}>
				</Input>
			</div>
			<div className="grid grid-cols-4 gap-4 w-100">
				{filteredProducts.map((product) => (
					<Card className="overflow-hidden ">
						<Image src="/product-blank.png" alt="Product Image" width={500} height={400} className="w-full h-64 object-cover pb-4" />
						<CardContent>
							<div className="flex justify-start flex-wrap flex-col">
								<h3 className="text-xl font-bold mb-2">{product.name}</h3>
								<p className="text-gray-700 dark:text-gray-400 text-lg font-semibold">{product.price}</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</main >
	);
}
