'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { saveCallbackUrl } from '@/lib/redirect-after-login';
import { Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/brand-logo';
import { useState, useEffect } from 'react';

export function PublicHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const name = session?.user?.fullName || session?.user?.name || "bạn";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname === href;

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tìm phòng', href: '/rooms' },
    { label: 'Giới thiệu', href: '/about' },
    { label: 'Liên hệ', href: '/contact' },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <header style={{ height: 'var(--height-header)' }} className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-3 items-center gap-4 h-full">
        {/* Logo */}
        <BrandLogo href="/" className="py-2 pl-2" />

        {/* Desktop Navigation (centered) */}
        <nav className="hidden md:flex justify-center items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-2 text-sm font-medium transition-colors rounded-md',
                isActive(link.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {session?.user ? (
            <>
              <span className="hidden lg:inline text-sm text-muted-foreground max-w-[150px] truncate min-w-0 mr-3">
                Xin chào, {name}
              </span>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/dashboard/${session.user.role?.toLowerCase()}`}>
                    Bảng điều khiển
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  title="Đăng xuất"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login" onClick={() => saveCallbackUrl(pathname)}>Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            </>
          )}

          {/* Mobile Menu - Only render after mount to avoid hydration mismatch */}
          {mounted && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 pt-10">
                <div className="flex flex-col space-y-4 mt-4">
                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          'px-3 py-2 text-sm font-medium transition-colors rounded-md',
                          isActive(link.href)
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {session ? (
                    <>
                      <div className="border-t pt-4">
                        <div className="px-3 py-2 text-sm">
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">{session.user?.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleLogout}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Đăng xuất
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 border-t pt-4">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/login" onClick={() => saveCallbackUrl(pathname)}>Đăng nhập</Link>
                      </Button>
                      <Button size="sm" asChild>
                        <Link href="/register">Đăng ký</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
}
