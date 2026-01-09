'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      // Always show success message for security
      setSubmitted(true);
      toast.success('Nếu email tồn tại, link đặt lại mật khẩu đã được gửi');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-success" />
            </div>
            <CardTitle>Kiểm tra email của bạn</CardTitle>
            <CardDescription>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Không nhận được email? Kiểm tra thư mục spam hoặc thử lại sau vài phút.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại đăng nhập
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Quên mật khẩu?</CardTitle>
          <CardDescription>
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
