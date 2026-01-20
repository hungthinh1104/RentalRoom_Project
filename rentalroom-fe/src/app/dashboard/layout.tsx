'use client';

import React from 'react';
import { CollapsibleSidebar } from '@/components/layout/collapsible-sidebar';
import { BottomTabBar } from '@/components/layout/bottom-tab-bar';
import { DashboardHeader } from '@/components/layout/header/dashboard-header';
import { useSession } from 'next-auth/react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();

	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
			<DashboardHeader />
			<div className="flex flex-1 overflow-hidden">
				{/* Collapsible Sidebar - Desktop/Laptop Only */}
				<CollapsibleSidebar role={session?.user?.role} />

				{/* Main Content Area */}
				<main className="flex-1 w-full overflow-y-auto overflow-x-hidden pb-16 lg:pb-0 lg:pl-[100px]">
					<div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full h-full">
						{children}
					</div>
				</main>
			</div>

			{/* Bottom Tab Bar - Mobile Only */}
			<BottomTabBar role={session?.user?.role} />
		</div>
	);
}
