// app/api/products/route.js
import fs from "fs";
import path from "path";

function getAllFilesRecursive(dir, baseUrl = "/products") {
	const entries = fs.readdirSync(dir, { withFileTypes: true });

	const files = entries.flatMap((entry) => {
		const fullPath = path.join(dir, entry.name);
		const relativePath = path.relative(path.join(process.cwd(), "public"), fullPath);
		const urlPath = "/" + relativePath.replace(/\\/g, "/"); // suporte para Windows também

		if (entry.isDirectory()) {
			return getAllFilesRecursive(fullPath, baseUrl);
		} else {
			return {
				fullPath,
				urlPath,
				filename: entry.name,
				relativeToProducts: path.relative(path.join(process.cwd(), "public/products"), fullPath),
			};

			// return { fullPath, urlPath, filename: entry.name };
		}
	});

	return files;
}

export async function GET(request) {
	const productsDirectory = path.join(process.cwd(), "public/products");

	try {
		const fileEntries = getAllFilesRecursive(productsDirectory);

		// const products = fileEntries
			// .map(({ fullPath, urlPath, filename }, index) => {

		const products = fileEntries
			.map(({ filename, urlPath, relativeToProducts }, index) => {
				const nameWithoutExt = path.parse(filename).name; // Remove extensão
				const regex = /(.*) R\$ (\d+,\d+)/;
				const match = filename.match(regex);

				// Extrair a categoria (subpasta)
				const category = path.dirname(relativeToProducts).replace(/\\/g, "/"); // para Windows
				const finalCategory = category === "." ? null : category; // se estiver na raiz

				let productName = nameWithoutExt;
				let price = 0;

				if (match) {
					let productName = match[1].trim();
					const parts = productName.split(". ");
					productName = parts.length > 1 ? parts[1] : productName;
					price = match[2];

					
				}

				return {
						id: index + 1,
						name: productName,
						price: price,
						url: urlPath,
						category: finalCategory,
				};
			});

		// products.filter((product) => product !== null);


		products.sort((a, b) => {
			if (a.price !== b.price) {
				// return parseFloat(a.price) - parseFloat(b.price);
				return parseFloat(a.price.replace(",", ".")) - parseFloat(b.price.replace(",", "."));
			}
			return a.name.localeCompare(b.name);
		});

		// products.sort((a, b) => parseFloat(a.price) - parseFloa	t(b.price));

		return new Response(JSON.stringify(products), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error(error);		
		return new Response(JSON.stringify({ error: "Failed to read products" }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
