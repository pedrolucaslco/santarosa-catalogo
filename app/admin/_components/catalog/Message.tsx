import { Loader2 } from 'lucide-react';
import type { Message } from './useCatalog';

export function StatusMessage({ message }: { message: Message }) {
	if (!message) return null;

	return (
		<p
			role={message.type === 'error' ? 'alert' : 'status'}
			className={`rounded-xl border px-4 py-2.5 text-sm ${
				message.type === 'error'
					? 'border-red-500/30 bg-red-500/10 text-red-200'
					: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
			}`}
		>
			{message.text}
		</p>
	);
}

export const Spinner = () => (
	<div className="flex justify-center py-16">
		<Loader2 className="h-6 w-6 animate-spin text-[#D3972F]" />
	</div>
);
