'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api/client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      toast.error('Token không hợp lệ');
      router.push('/forgot-password');
    }
  }, [searchParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (success) {
    return (
      <div className="w-full max-w-[760px]">
        <div
          className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[32px] p-8 md:p-10 lg:p-12 space-y-8 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-success/20 rounded-full blur-[80px] -z-10 opacity-40" />

          {/* Success Icon */}
          <div
            className="mx-auto w-24 h-24 bg-success/10 rounded-full flex items-center justify-center relative"
          >
            <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
            <div className="w-16 h-16 bg-gradient-to-br from-success to-success/80 rounded-full flex items-center justify-center relative z-10 shadow-lg shadow-success/20">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-3">
            <h1
              className="text-3xl md:text-4xl font-bold text-foreground tracking-tight"
            >
              Mật khẩu đã được đặt lại!
            </h1>
            <p
              className="text-muted-foreground text-lg"
            >
              Bạn sẽ được chuyển hướng đến trang đăng nhập...
            </p>
          </div>

          {/* Loading indicator */}
          <div
            className="flex items-center justify-center gap-3 py-2"
          >
            <div
              className="w-5 h-5 border-2 border-success/30 border-t-success rounded-full"
            />
            <span className="text-base font-medium text-success">Đang chuyển hướng...</span>
          </div>
        </div>
      </div>
    );
  }

  // Form State
  return (
    <div className="w-full max-w-[760px]">
      <div
        className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[32px] p-8 md:p-10 lg:p-12 space-y-8 shadow-2xl relative overflow-hidden"
      >
        {/* Decorative Glow */}
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -z-10 opacity-30" />

        {/* Icon */}
        <div
          className="mx-auto w-24 h-24 bg-secondary/30 rounded-2xl flex items-center justify-center relative border border-input shadow-inner"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <KeyRound className="w-8 h-8 text-primary-foreground" />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-3 text-center">
          <h1
            className="text-3xl md:text-4xl font-bold text-foreground tracking-tight"
          >
            Đặt lại mật khẩu
          </h1>
          <p
            className="text-muted-foreground text-lg"
          >
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Error Message */}
            {error && (
              <div
                
                className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 overflow-hidden"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive flex-1 leading-relaxed font-medium">
                  {error}
                </p>
              </div>
            )}

          {/* New Password Input */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-foreground ml-1">
              Mật khẩu mới
            </Label>
            <div className="relative group/input">
              <div className="absolute inset-0 bg-secondary/50 rounded-2xl blur-sm transition-opacity opacity-0 group-focus-within/input:opacity-100" />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within/input:text-foreground" />
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                required
                minLength={6}
                className={`h-12 pl-12 pr-12 bg-secondary/30 border-input text-foreground rounded-2xl placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-ring hover:border-input/80 transition-all duration-200 ${error ? 'border-destructive focus-visible:border-destructive' : ''
                  }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground ml-1">
              Xác nhận mật khẩu
            </Label>
            <div className="relative group/input">
              <div className="absolute inset-0 bg-secondary/50 rounded-2xl blur-sm transition-opacity opacity-0 group-focus-within/input:opacity-100" />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within/input:text-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                required
                minLength={6}
                className={`h-12 pl-12 pr-12 bg-secondary/30 border-input text-foreground rounded-2xl placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-ring hover:border-input/80 transition-all duration-200 ${error ? 'border-destructive focus-visible:border-destructive' : ''
                  }`}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group/btn"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div
                  className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
                Đang đặt lại...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 mr-1" />
                Đặt lại mật khẩu
                <ArrowRight className="w-5 h-5 ml-1 transition-transform group-hover/btn:translate-x-1" />
              </span>
            )}
          </Button>

          {/* Back to Login */}
          <div className="text-center pt-2">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  );

}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="container flex items-center justify-center min-h-screen">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
