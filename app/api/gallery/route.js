// app/api/gallery/route.js
import fs from "fs";
import path from "path";

function getAllFilesRecursive(dir, baseUrl = "/gallery") {
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
				relativeToProducts: path.relative(path.join(process.cwd(), "public/gallery"), fullPath),
			};

			// return { fullPath, urlPath, filename: entry.name };
		}
	});

	return files;
}

export async function GET(request) {
	const productsDirectory = path.join(process.cwd(), "public/gallery");

	try {
		const fileEntries = getAllFilesRecursive(productsDirectory);

		// const products = fileEntries
		// .map(({ fullPath, urlPath, filename }, index) => {

		const products = fileEntries
			.map(({ filename, urlPath, relativeToProducts }, index) => {
				const nameWithoutExt = path.parse(filename).name; // Remove extensão

				// const regex = /(.*) R\$ (\d+,\d+)/;
				// const regexDePor = /(.*) DE_?\s*R\$ (\d+,\d+)\s+POR_?\s*R\$ (\d+,\d+)/;

				// Extrair a categoria (subpasta)
				var category = path.dirname(relativeToProducts).replace(/\\/g, "/"); // para Windows
				var finalCategory = category === "." ? null : category; // se estiver na raiz

				// var match = null;
				// var isDePor = false;

				// if (filename.match(regexDePor)) {
				// 	match = filename.match(regexDePor);
				// 	isDePor = 'DE POR';
				// } else {
				// 	match = filename.match(regex);
				// }

				// if (match == null) {
				// 	return null;
				// }

				// PRODUCT NAME ------------------------------------------------
				// var productName = match[1].trim();
				// var parts = productName.split(". ");
				// productName = parts.length > 1 ? parts[1] : parts[0];

				// productName = productName.replace(/_mais_/g, '+');

				// PRICE -------------------------------------------------------
				// var price = 0;
				// var priceFrom = 0;

				// if (isDePor) {
				// 	price = match[3];
				// 	priceFrom = match[2];
				// } else {
				// 	price = match[2];
				// }

				finalCategory = finalCategory.replace('pct', '%');
	
				return {
					id: index + 1,
					name: 'Item Nº' + (index + 1),
					// price: price,
					// priceFrom: priceFrom,
					url: urlPath,
					category: finalCategory,
					// match: match,
					// isDePor: isDePor,
				};
			});

		// products.sort((a, b) => {
		// 	const priceA = a?.price ? parseFloat(String(a.price).replace(",", ".")) : 0;
		// 	const priceB = b?.price ? parseFloat(String(b.price).replace(",", ".")) : 0;

		// 	if (priceA !== priceB) {
		// 		return priceA - priceB;
		// 	}

		// 	return a?.name.localeCompare(b?.name);
		// });

		return new Response(JSON.stringify(products), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error('ERRO OIOIOIOI', error);
		return new Response(JSON.stringify({
			error: "Failed to read products", 
			errorMessage: error.message,
			line: error.line,
			column: error.column,
			stack: error.stack,
			name: error.name,
			message: error.message,
			code: error.code,
		}), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
