'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        // If user is logged in, redirect to their dashboard
        if (session?.user?.role) {
            router.replace(`/dashboard/${session.user.role.toLowerCase()}`);
        }
    }, [session, router]);

    // Don't render unauthorized page if user is logged in
    if (session?.user?.role) {
        return null;
    }

    const handleGoToDashboard = () => {
        if (session?.user?.role === 'ADMIN') {
            router.push('/dashboard/admin');
        } else if (session?.user?.role === 'LANDLORD') {
            router.push('/dashboard/landlord');
        } else if (session?.user?.role === 'TENANT') {
            router.push('/dashboard/tenant');
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <div className="max-w-md w-full bg-card rounded-3xl shadow-2xl p-8 text-center space-y-6 border border-border">
                <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                    <ShieldAlert className="h-10 w-10 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">Không có quyền truy cập</h1>
                    <p className="text-muted-foreground">
                        Bạn không có quyền truy cập trang này. Vui lòng quay lại dashboard của bạn.
                    </p>
                </div>

                {session && (
                    <div className="bg-muted/50 rounded-2xl p-4 text-sm text-muted-foreground">
                        <p>Đang đăng nhập với vai trò: <span className="font-semibold text-foreground">{session.user?.role}</span></p>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="flex-1"
                    >
                        Quay lại
                    </Button>
                    <Button
                        onClick={handleGoToDashboard}
                        className="flex-1"
                    >
                        Về Dashboard
                    </Button>
                </div>
            </div>
        </div >
    );
}
