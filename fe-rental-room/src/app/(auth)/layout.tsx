import React from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-page-gradient-from to-page-gradient-to">
      {/* Logo Header */}
      <header className="border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-white/5">
        <div className="container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold bg-gradient-to-r from-foreground via-primary/70 to-foreground bg-clip-text text-transparent">
                RentalRoom
              </span>
              <span className="text-xs text-muted-foreground">Quản lý phòng cho thuê</span>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/verify-email" className="text-primary hover:underline font-medium">
              Xác thực email
            </Link>
          </nav>
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

