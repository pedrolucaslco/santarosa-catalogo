import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE, verifyAdmin } from '@/app/api/admin/_lib/auth';
import { AdminLogin } from './_components/AdminLogin';
import { AdminPanel } from './_components/AdminPanel';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Admin | Roleta',
	robots: { index: false, follow: false },
};

export default async function AdminPage() {
	const jar = cookies();
	const admin = await verifyAdmin(jar.get(ACCESS_COOKIE)?.value);
	// Access token expirado mas com refresh token: o painel renova a sessão sozinho.
	const authenticated = Boolean(admin) || Boolean(jar.get(REFRESH_COOKIE)?.value);

	return (
		<main className="min-h-[100svh] bg-[#171717] px-4 py-8 text-white">
			{authenticated ? <AdminPanel /> : <AdminLogin />}
		</main>
	);
}
