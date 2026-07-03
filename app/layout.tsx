import type { Metadata } from "next";
import { Poppins, Playfair_Display } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Catálogo • Santa Rosa",
  description: "Semijoias clássicas, elegantes e atemporais.",
  authors: [{name: 'Studio Seven | @pedrolucaslco', url:'http://www.instagram.com/pedrolucaslco'}]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">

      <head>
        <title>Catálogo • Santa Rosa</title>
        <meta name="description" content={metadata.description ?? ""} />
        <meta name="keywords" content="Santa Rosa, Acessórios, Catálogo, Elegante, Semijoias, Clássicas, Atemporais" />
      </head>
      <body className={`${poppins.className} ${playfair.variable}`}>{children}</body>
    </html>
  );
}
