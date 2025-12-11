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

function normalizeWords(str) {
	return str
		.split(" ")
		.map(word => {
			const lower = word.toLowerCase();
			return lower.charAt(0).toUpperCase() + lower.slice(1);
		})
		.join(" ");
}


export async function GET(request) {
	const productsDirectory = path.join(process.cwd(), "public/products");

	try {
		const fileEntries = getAllFilesRecursive(productsDirectory);

		// const products = fileEntries
		// .map(({ fullPath, urlPath, filename }, index) => {

		const products = fileEntries
			.map(({ filename, urlPath, relativeToProducts }, index) => {

				// Remove extensão
				const nameWithoutExt = path.parse(filename).name;

				// Regras de extração
				const regex = /(.*) R\$ (\d+,\d+)/;
				const regexDePor = /(.*) DE_?\s*R\$ (\d+,\d+)\s+POR_?\s*R\$ (\d+,\d+)/;

				// Extrair a categoria (subpasta)
				var category = path.dirname(relativeToProducts).replace(/\\/g, "/"); // para Windows
				var finalCategory = category === "." ? null : category; // se estiver na raiz

				var match = null;
				var isDePor = false;
				let price = null;
				let priceFrom = 0;
				let productName = '';

				if (filename.match(regexDePor)) {
					match = filename.match(regexDePor);
					isDePor = 'DE POR';
				} else {
					match = filename.match(regex);
				}

				if (match == null) {
					return null;
				}

				// Verificar quantos “R$” existem
				const occurrences = (nameWithoutExt.match(/R\$/g) || []).length;

				// 1) Caso especial: dois preços → NÃO extrair nada
				if (occurrences >= 2 && !regexDePor.test(nameWithoutExt)) {
					productName = nameWithoutExt;

					const parts = productName.split("_e_");

					if (parts.length > 2) {
						productName =
							parts.slice(0, -1).join(", ") + " e " + parts.slice(-1);
					} else {
						productName = parts.join(" e ");
					}
				} else {
					// PRODUCT NAME ------------------------------------------------
					productName = match[1].trim();
					var parts = productName.split(". ");
					productName = parts.length > 1 ? parts[1] : parts[0];

					productName = productName.replace(/_mais_/g, '+');

					if (isDePor) {
						price = match[3];
						priceFrom = match[2];
					} else {
						price = match[2];
					}
				}

				// productName = normalizeWords(productName);

				finalCategory = finalCategory ? finalCategory.replace('pct', '%') : null;

				return {
					id: index + 1,
					name: productName,
					price: price,
					priceFrom: priceFrom,
					url: urlPath,
					category: finalCategory,
					match: match,
					isDePor: isDePor,
				};
			});

		products.sort((a, b) => {
			const priceA = a?.price ? parseFloat(String(a.price).replace(",", ".")) : 0;
			const priceB = b?.price ? parseFloat(String(b.price).replace(",", ".")) : 0;

			if (priceA !== priceB) {
				return priceA - priceB;
			}

			return a?.name.localeCompare(b?.name);
		});

		return new Response(JSON.stringify(products), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		// **ESTA PARTE É O SEU RASTREAMENTO:**

		console.error('ERRO INTERNO DA API:', error.stack); // Use .stack para o rastreio completo

		return new Response(JSON.stringify({
			error: "Failed to read products",
			// O .stack é o mais importante para saber a linha exata
			stack: error.stack,
			name: error.name,
			message: error.message,
			code: error.code || null, // Nem todos os erros têm 'code'
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
