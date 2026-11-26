import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, getAccessState, verifyAccessToken } from '@/lib/access';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const publicPaths = [
    '/_next',
    '/api',
    '/favicon.ico',
    '/acesso',
  ];

  const isPublic = publicPaths.some((path) => pathname.startsWith(path)) ||
                   pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/);

  if (isPublic) return NextResponse.next();

  // Primeiro segmento da URL = slug da coleção (/liquida, /black, ...). O estado (quais estão
  // bloqueadas e a versão da senha) vem do Supabase, configurado em /admin > Acesso.
  const slug = pathname.split('/')[1];

  if (!slug) return NextResponse.next();

  const state = await getAccessState();

  if (!state.locked.includes(slug)) return NextResponse.next();

  if (await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value, state.version)) return NextResponse.next();

  return NextResponse.redirect(new URL(`/acesso?from=${encodeURIComponent(slug)}`, req.url));
}

export const config = { matcher: '/:path*' };
