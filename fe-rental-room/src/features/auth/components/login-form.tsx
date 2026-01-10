"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"
import { formatAuthError } from "../utils/format-auth-error"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useLogin } from "../hooks/use-auth"
import { loginSchema, type LoginInput } from "../schemas"
import type { AuthResponse } from '@/types';
import { getCallbackUrl, normalizeRedirectTarget } from "@/lib/redirect-after-login";

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { mutate: login, isPending, error } = useLogin()
  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [signInErrorState, setSignInErrorState] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    console.debug('[LoginForm] submitting', data?.email);

    // Determine callback URL
    const callbackUrlGuess = getCallbackUrl(searchParams, undefined);
    const absoluteCallback = (typeof window !== 'undefined' && typeof callbackUrlGuess === 'string' && callbackUrlGuess.startsWith('/'))
      ? window.location.origin + callbackUrlGuess
      : callbackUrlGuess;

    // Use NextAuth signIn - creates HttpOnly cookie session automatically
    const signInResult = await signIn('credentials', {
      redirect: false,
      email: data.email,
      password: data.password,
      callbackUrl: absoluteCallback
    });

    if (signInResult?.ok) {
      // Success - NextAuth session created via HttpOnly cookies
      const target = normalizeRedirectTarget(signInResult.url ?? callbackUrlGuess, undefined);
      console.debug('[Login] signIn success -> redirect to', target);
      await router.push(target);
      router.refresh(); // Refresh to load session data
      return;
    }

    if (signInResult?.error) {
      setSignInErrorState(signInResult.error);
      return;
    }

    // Fallback error
    setSignInErrorState('Login failed. Please try again.');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-page-gradient-from to-page-gradient-to flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[760px]">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[var(--glass-bg)]/40 backdrop-blur-sm border border-border/20 rounded-3xl p-6 md:p-8 lg:p-10 space-y-6 shadow-sm"
        >
          {/* Header */}
          <div className="space-y-2 text-center">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/60 to-primary/80 bg-clip-text text-transparent"
            >
              Chào mừng trở lại
            </motion.h1>
            <p className="text-muted-foreground">
              Đăng nhập để tiếp tục tìm phòng của bạn
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Global Error */}
            <AnimatePresence mode="wait">
              {(error || signInErrorState) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive flex-1 leading-relaxed">
                    {formatAuthError(signInErrorState ?? error)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isPending}
                  className={`h-11 pl-11 ${errors.email
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                    }`}
                  {...register("email")}
                />
              </div>
              <AnimatePresence mode="wait">
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-destructive flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Mật khẩu</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isPending}
                  className={`h-11 pl-11 pr-11 ${errors.password
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                    }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <AnimatePresence mode="wait">
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-destructive flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer select-none"
                >
                  Ghi nhớ đăng nhập
                </label>
              </div>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline font-medium"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 shadow-lg shadow-primary/20"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Đang đăng nhập...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Đăng nhập
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-2 space-x-2">
            <span>
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Đăng ký ngay
              </Link>
            </span>
            <span className="text-muted-foreground">•</span>
            <Link
              href="/verify-email"
              className="text-primary hover:underline font-medium"
            >
              Xác thực email
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

