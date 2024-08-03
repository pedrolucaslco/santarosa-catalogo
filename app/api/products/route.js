// app/api/products/route.js
import fs from "fs";
import path from "path";

export async function GET(request) {
  const productsDirectory = path.join(process.cwd(), "public/products");

  try {
    // Lê os arquivos na pasta especificada
    const filenames = fs.readdirSync(productsDirectory);

    // Processa cada nome de arquivo
    const products = filenames
      .map((filename, index) => {
        const regex = /(.*) R\$ (\d+,\d+)/;
        const match = filename.match(regex);

        if (match) {
          var productName = match[1].trim();
          const parts = productName.split(". ");
          productName = parts[1];
          const price = match[2];
          const productUrl = `/products/${encodeURIComponent(filename)}`; // URL do arquivo
          return {
            id: index + 1,
            name: productName,
            price: price,
            url: productUrl,
          };
        }

        return null;
      })
      .filter((product) => product !== null);

    return new Response(JSON.stringify(products), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to read products" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
