// Roda no navegador: redimensiona e comprime a foto antes do upload (substitui os scripts otimizar-imagens).

const MAX_SIDE = 1200;
const QUALITY = 0.82;

export async function optimizeImage(file: File): Promise<File> {
	if (!file.type.startsWith('image/')) throw new Error('Escolha um arquivo de imagem.');

	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => null);

	if (!bitmap) throw new Error('Não foi possível ler essa imagem (HEIC não é suportado; use JPG, PNG ou WebP).');

	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement('canvas');

	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext('2d');

	if (!ctx) throw new Error('Seu navegador não suporta o processamento de imagem.');

	// Fundo branco: evita fundo preto em PNGs com transparência.
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, width, height);
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const toBlob = (type: string) => new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));
	const blob = (await toBlob('image/webp')) ?? (await toBlob('image/jpeg'));

	if (!blob) throw new Error('Falha ao comprimir a imagem.');

	const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';

	return new File([blob], `foto.${ext}`, { type: blob.type });
}
