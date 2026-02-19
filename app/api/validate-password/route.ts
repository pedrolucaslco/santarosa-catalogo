import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { password } = await req.json();

  const envPassword = process.env.CATALOG_PASSWORD || 'SENHA_DO_CLIENTE';

  if (password === envPassword) {
    return NextResponse.json({ valid: true });
  } else {
    return NextResponse.json({ valid: false });
  }
}
