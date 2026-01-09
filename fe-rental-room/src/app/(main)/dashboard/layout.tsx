'use client';

import React from 'react';
import { CollapsibleSidebar } from '@/components/layout/collapsible-sidebar';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();

	return (
		<div className="flex min-h-[calc(100vh-var(--height-header))]">
			{/* Collapsible Sidebar - Desktop/Laptop Only */}
			<CollapsibleSidebar role={session?.user?.role} />

			{/* Main Content Area */}
			<main className="flex-1 w-full overflow-y-auto pb-16 lg:pb-0">
				<div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
					{children}
				</div>
			</main>

			{/* Bottom Tab Bar - Mobile Only */}
			<BottomTabBar role={session?.user?.role} />
		</div>
	);
}
