import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
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

  if (process.env.CATALOG_LOCKED !== 'true') return NextResponse.next();

  const authorized = req.cookies.get('catalog_auth')?.value === 'authorized';
  if (authorized) return NextResponse.next();

  return NextResponse.redirect(new URL('/acesso', req.url));
}

export const config = { matcher: '/:path*' };
