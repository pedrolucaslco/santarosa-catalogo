import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE, verifyAdmin } from '@/app/api/admin/_lib/auth';
import { AdminLogin } from './_components/AdminLogin';
import { AdminShell } from './_components/AdminShell';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
	title: 'Admin | Santa Rosa',
	robots: { index: false, follow: false },
};

export default async function AdminPage() {
	const jar = cookies();
	const admin = await verifyAdmin(jar.get(ACCESS_COOKIE)?.value);
	// Access token expirado mas com refresh token: o painel renova a sessão sozinho.
	const authenticated = Boolean(admin) || Boolean(jar.get(REFRESH_COOKIE)?.value);

	return (
		<main className={`min-h-[100svh] bg-[#f8f3f1] text-red-950 ${authenticated ? '' : 'px-3 py-4 sm:px-4 sm:py-8'}`}>
			{authenticated ? <AdminShell email={admin?.email ?? null} /> : <AdminLogin />}
		</main>
	);
}
