import React from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-page-gradient-from to-page-gradient-to">
      {/* Logo Header */}
      <header className="border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="container h-16 flex items-center justify-center relative">
          <BrandLogo
            href="/"
            size="md"
            subtitle="Quản lý phòng cho thuê"
            alwaysShowText
          />
        </div>
      </header>

      {/* Auth Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[1400px] px-4 mx-auto">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="container h-12 flex items-center justify-center text-sm text-muted-foreground">
          <p>© 2024 RentalRoom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

