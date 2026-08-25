import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json();

  const envPassword = process.env.LIQUIDA_PASSWORD || 'SENHA_DO_CLIENTE';

  if (password === envPassword) {
    const response = NextResponse.json({ valid: true });
    response.cookies.set('liquida_auth', 'authorized', {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: 60 * 60, // 1 hora
    });
    return response;
  } else {
    return NextResponse.json({ valid: false });
  }
}
