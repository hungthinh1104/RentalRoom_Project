'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { saveCallbackUrl } from '@/lib/redirect-after-login';
import { Building2, Menu, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

export function PublicHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const name = session?.user?.fullName || session?.user?.name || "bạn";

  const isActive = (href: string) => pathname === href;

  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Tìm phòng', href: '/rooms' },
    { label: 'Giới thiệu', href: '/about' },
    { label: 'Liên hệ', href: '/contact' },
  ];

  const handleLogout = async () => {
    // Clear client-side tokens and NextAuth session
    if (typeof window !== 'undefined') {
      try {
        clearTokens();
      } catch { }
    }
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  return (
    <header style={{ height: 'var(--height-header)' }} className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-3 items-center gap-4 h-full">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0 py-2 pl-2">
          <Building2 className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">
            RentalRoom
          </span>
        </Link>

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
        <div className="flex items-center justify-end gap-3">
          {session?.user ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground max-w-[150px] truncate min-w-0 mr-3">
                Xin chào, {name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
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
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/login" onClick={() => saveCallbackUrl(pathname)}>Đăng nhập</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/register">Đăng ký</Link>
                </Button>
              </div>
            </>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="flex flex-col space-y-4 mt-8">
                <nav className="flex flex-col gap-2">
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

                <div className="border-t pt-4 space-y-2">
                  {session?.user ? (
                    <>
                      <p className="text-sm text-muted-foreground px-3">
                        {session.user.fullName}
                      </p>
                      <Button
                        className="w-full justify-start"
                        variant="outline"
                        asChild
                      >
                        <Link href={`/dashboard/${session.user.role?.toLowerCase()}`}>
                          Bảng điều khiển
                        </Link>
                      </Button>
                      <Button
                        className="w-full justify-start"
                        variant="ghost"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Đăng xuất
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button className="w-full" variant="outline" asChild>
                        <Link href="/login" onClick={() => saveCallbackUrl(pathname)}>Đăng nhập</Link>
                      </Button>
                      <Button className="w-full" asChild>
                        <Link href="/register">Đăng ký</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
