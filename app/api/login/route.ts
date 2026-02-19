import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { password } = await req.json()

  if (password === process.env.CATALOG_PASSWORD) {
    const response = NextResponse.json({ success: true })

    response.cookies.set('catalog_auth', 'authorized', {
      httpOnly: true,
      secure: true,
      path: '/',
      maxAge: 60 * 10, // variavel em segundos - multiplica para obter minutos
    })

    return response
  }

  return NextResponse.json({ success: false }, { status: 401 })
}