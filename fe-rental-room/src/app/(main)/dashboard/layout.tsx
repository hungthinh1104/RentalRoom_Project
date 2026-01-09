'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();

	return (
		<div className="flex min-h-[calc(100vh-var(--height-header))]">
			<Sidebar role={session?.user?.role} />
			<main className="flex-1 w-full overflow-y-auto">
				<div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
					{children}
				</div>
			</main>
		</div>
	);
}
