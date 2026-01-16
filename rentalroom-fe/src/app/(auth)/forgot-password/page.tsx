'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ArrowLeft, Mail, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import api from '@/lib/api/client';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Email đặt lại mật khẩu đã được gửi!');
    } catch (error: unknown) {
      console.error('Forgot password error:', error);
      // Always show success message for security (don't reveal if email exists)
      setSubmitted(true);
      toast.success('Nếu email tồn tại, link đặt lại mật khẩu đã được gửi');
    } finally {
      setIsLoading(false);
    }
  };

  // Success State
  if (submitted) {
    return (
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden text-foreground"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mx-auto w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-8 relative"
          >
            <div className="absolute inset-0 bg-success/20 rounded-full blur-xl animate-pulse" />
            <Mail className="w-8 h-8 text-success relative z-10" />
          </motion.div>

          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              Check your email
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-base"
            >
              We have sent password reset instructions to
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg font-semibold text-foreground"
            >
              {email}
            </motion.p>
          </div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="p-4 rounded-2xl bg-info/10 border border-info/20 flex items-start gap-3 mb-8"
          >
            <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm text-info/80 space-y-1">
              <p className="font-medium text-info">Did not receive the email?</p>
              <ul className="space-y-1 text-xs">
                <li>• Check your spam or junk folder</li>
                <li>• Wait for a few minutes and try again</li>
              </ul>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-semibold border-input text-foreground hover:bg-secondary/50 hover:text-foreground"
              onClick={() => router.push('/login')}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Login
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full h-12 text-base font-semibold text-muted-foreground hover:text-foreground hover:bg-transparent"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
            >
              Resend Email
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Form State
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden text-foreground"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 opacity-40" />

      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mx-auto w-16 h-16 bg-secondary/30 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-input"
      >
        <KeyRound className="w-8 h-8 text-primary" />
      </motion.div>

      {/* Header */}
      <div className="space-y-3 text-center mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold tracking-tight text-foreground"
        >
          Forgot Password?
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground text-base px-4"
        >
          Don't worry! Enter your email and we'll send you reset instructions.
        </motion.p>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Error Message */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 overflow-hidden"
            >
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive leading-relaxed font-medium">
                {error}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email Input */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground ml-1">
            Email Address
          </Label>
          <div className="relative group/input">
            <div className="absolute inset-0 bg-secondary/50 rounded-2xl blur-sm transition-opacity opacity-0 group-focus-within/input:opacity-100" />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within/input:text-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              className={`h-12 pl-12 bg-secondary/30 border-input text-foreground rounded-2xl placeholder:text-muted-foreground/50 focus-visible:ring-0 focus-visible:border-ring hover:border-input/80 transition-all duration-200 ${error ? 'border-destructive/50 focus-visible:border-destructive' : ''
                }`}
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="w-full h-14 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
              Sending...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Send Reset Link
              <Send className="w-4 h-4 ml-1" />
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
            Back to Login
          </Link>
        </div>
      </motion.form>
    </motion.div>
  );
}
