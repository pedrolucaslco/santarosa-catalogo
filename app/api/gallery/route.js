// app/api/gallery/route.js
import fs from "fs";
import path from "path";

export async function GET(request) {
  const galleryDirectory = path.join(process.cwd(), "public/gallery");

  try {
    // Lê os arquivos na pasta especificada
    const filenames = fs.readdirSync(galleryDirectory);

    // Processa cada nome de arquivo
    const gallery = filenames.map((filename, index) => {

      const filenameWithoutExtension = filename.replace('.jpg', '');
      const firstDotIndex = filenameWithoutExtension.indexOf('.');
      const relevantPart = filenameWithoutExtension.substring(firstDotIndex + 1).trim();


      const regex = /(.*?)\sR\$\s(\d+,\d{2})/g;
      let match;

      // GET FULL NAME OF THE PRODUCT
      const regexName = /(.*)/;
      
      const matchName = filenameWithoutExtension.match(regexName);
      if (matchName) {
        var productFullName = matchName[1].trim();
        const parts = productFullName.split(". ");
        productFullName = parts[1];
      }

      const productItems = [];
      const productUrl = `/gallery/${encodeURIComponent(filename)}`; // URL do arquivo

      var itemCount = 1;
      while ((match = regex.exec(relevantPart)) !== null) {
        const productName = match[1].trim();

        const price = match[2];
        productItems.push({
          id: itemCount,
          name: productName,
          price,
        });
        itemCount++;
      }

      // Retorna um objeto de produto com múltiplos itens
      console.log({ id: index + 1, name: productFullName, items: productItems, url: productUrl });
      return { id: index + 1, name: productFullName, items: productItems, url: productUrl };
    });

    return new Response(JSON.stringify(gallery), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to read gallery" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
