import React from 'react';
import { Header } from '@/components/layout/header/header';
import Footer from '@/components/landing/footer';

export default function MainLayout({ children }:{ children: React.ReactNode }) {
	return (
			<div className="min-h-screen flex flex-col">
						<Header />
						<main className="flex-1">
				{children}
			</main>
			<Footer />
		</div>
	);
}
