import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rotas que NÃO precisam de senha
  const publicPaths = [
    '/_next',   // assets do Next
    '/api',
    '/favicon.ico',
    '/acesso',  // página de login
  ];

  const isPublic = publicPaths.some((path) => pathname.startsWith(path)) ||
                   pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/);

  if (isPublic) {
    return NextResponse.next();
  }

  // 🔓 Controle de bloqueio via variável de ambiente
  if (process.env.CATALOG_LOCKED !== 'true') {
    return NextResponse.next();
  }

  // 🔑 Checa cookie de sessão
  const authorized = req.cookies.get('catalog_auth')?.value === 'authorized';

  if (authorized) {
    return NextResponse.next();
  }

  // Redireciona para a página de senha
  return NextResponse.redirect(new URL('/acesso', req.url));
}

export const config = {
  matcher: '/:path*', // Aplica middleware em todas as rotas
};
