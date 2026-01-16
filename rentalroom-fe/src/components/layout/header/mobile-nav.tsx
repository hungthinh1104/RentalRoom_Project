"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
    { href: "/rooms", label: "Tìm phòng" },
    { href: "/about", label: "Giới thiệu" },
    { href: "/contact", label: "Liên hệ" },
];

export function MobileNav() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                    <Menu className="size-6" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-4 py-3 text-lg font-medium rounded-lg hover:bg-accent transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                    <div className="border-t pt-4 mt-4 space-y-3">
                        <Link
                            href="/auth/login"
                            onClick={() => setOpen(false)}
                            className="block"
                        >
                            <Button variant="outline" className="w-full h-12 text-base">
                                Đăng nhập
                            </Button>
                        </Link>
                        <Link
                            href="/auth/register"
                            onClick={() => setOpen(false)}
                            className="block"
                        >
                            <Button className="w-full h-12 text-base">
                                Đăng ký
                            </Button>
                        </Link>
                    </div>
                </nav>
            </SheetContent>
        </Sheet>
    );
}
