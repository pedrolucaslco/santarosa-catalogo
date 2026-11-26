'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminCategory, AdminCollection, AdminProduct } from '@/lib/catalog/types';

export interface CatalogData {
	collections: AdminCollection[];
	categories: AdminCategory[];
	products: AdminProduct[];
}

export type Message = { type: 'ok' | 'error'; text: string } | null;

const EMPTY: CatalogData = { collections: [], categories: [], products: [] };

/** Estado do catálogo no admin + chamada à API com renovação de sessão (mesmo padrão da roleta). */
export function useCatalog() {
	const router = useRouter();
	const [data, setData] = useState<CatalogData>(EMPTY);
	const [loading, setLoading] = useState(true);
	const [pending, setPending] = useState(0);
	const [message, setMessage] = useState<Message>(null);

	const call = useCallback(
		async (method: 'GET' | 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown, success?: string): Promise<boolean> => {
			setPending((n) => n + 1);
			setMessage(null);

			try {
				const send = () =>
					fetch(url, {
						method,
						headers: { 'Content-Type': 'application/json' },
						body: body === undefined ? undefined : JSON.stringify(body),
					});

				let response = await send();

				if (response.status === 401) {
					const refreshed = await fetch('/api/admin/refresh', { method: 'POST' });

					if (refreshed.ok) response = await send();
				}

				const json = await response.json().catch(() => null);

				if (response.status === 401) {
					router.refresh();
					return false;
				}

				if (!response.ok || !json?.ok) {
					setMessage({ type: 'error', text: json?.error ?? 'Algo deu errado.' });
					return false;
				}

				setData({ collections: json.collections, categories: json.categories, products: json.products });
				if (success) setMessage({ type: 'ok', text: success });

				return true;
			} catch {
				setMessage({ type: 'error', text: 'Falha de conexão.' });
				return false;
			} finally {
				setPending((n) => n - 1);
				setLoading(false);
			}
		},
		[router]
	);

	useEffect(() => {
		void call('GET', '/api/admin/catalog');
	}, [call]);

	return { data, loading, pending, message, setMessage, call };
}

export type CatalogApi = ReturnType<typeof useCatalog>;
