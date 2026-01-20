import React from 'react';
import { Header } from '@/components/layout/header/header';
import Footer from '@/components/landing/footer';

export default function MainLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
			<Header />
			<main className="flex-1" style={{ paddingTop: 'var(--header-safe-area)' }}>
				{children}
			</main>
			<Footer />
		</div>
	);
}
