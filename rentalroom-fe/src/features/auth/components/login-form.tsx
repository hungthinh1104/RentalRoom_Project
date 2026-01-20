"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { AuthBackground } from "./auth-background";
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import { formatAuthError } from "../utils/format-auth-error"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import { loginSchema, type LoginInput } from "../schemas"
import { getCallbackUrl, normalizeRedirectTarget } from "@/lib/redirect-after-login";

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [showPassword, setShowPassword] = React.useState(false)
  const [rememberMe, setRememberMe] = React.useState(false)
  const [signInErrorState, setSignInErrorState] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const isPending = isSubmitting;

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
      let target = signInResult.url;
      const isDefaultGuess = !searchParams.get('callbackUrl') && !sessionStorage.getItem('loginCallbackUrl');

      if (isDefaultGuess) {
        const session = await getSession();
        const role = session?.user?.role;
        target = normalizeRedirectTarget(null, role as string);
        console.debug('[Login] Recalculated target based on role:', role, '->', target);
      } else {
        target = normalizeRedirectTarget(signInResult.url ?? callbackUrlGuess, undefined);
      }

      console.debug('[Login] signIn success -> redirect to', target);
      await router.push(target);
      router.refresh();
      return;
    }

    if (signInResult?.error) {
      setSignInErrorState(signInResult.error);
      return;
    }

    setSignInErrorState('Đăng nhập thất bại. Vui lòng thử lại.');
  }

  return (
    <>
      <AuthBackground />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg glass-card rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden ring-1 ring-white/20 backdrop-blur-xl"
      >
        {/* Decorative Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -z-10 animate-pulse-soft" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] -z-10" />

        {/* Header */}
        <div className="space-y-4 text-center mb-10">


          <div className="space-y-2">
            <motion.h1
              className="text-3xl md:text-4xl font-bold text-foreground tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Chào mừng trở lại
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-base max-w-xs mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Nhập thông tin của bạn để truy cập hệ thống quản lý
            </motion.p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Global Error */}
          <AnimatePresence mode="wait">
            {(signInErrorState) && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 overflow-hidden backdrop-blur-md"
              >
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive leading-relaxed font-medium">
                  {formatAuthError(signInErrorState)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-foreground/80 ml-1">Email</Label>
            <div className="relative group/input">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-lg transition-opacity opacity-0 group-focus-within/input:opacity-100" />
              <input
                className="absolute opacity-0 w-0 h-0"
                disabled={isPending} // Fix for focus trap if needed
              />
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within/input:text-primary z-10" />
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isPending}
                className={`h-14 pl-12 bg-background/50 border-input/40 text-foreground rounded-2xl placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60 hover:border-primary/30 hover:bg-background/80 transition-all duration-300 relative z-0 backdrop-blur-sm ${errors.email ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20" : ""
                  }`}
                {...register("email")}
              />
            </div>
            <AnimatePresence>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-destructive ml-1 flex items-center gap-1.5 font-medium mt-1.5"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.email.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/80 ml-1">Mật khẩu</Label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative group/input">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-lg transition-opacity opacity-0 group-focus-within/input:opacity-100" />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within/input:text-primary z-10" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isPending}
                className={`h-14 pl-12 pr-12 bg-background/50 border-input/40 text-foreground rounded-2xl placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/60 hover:border-primary/30 hover:bg-background/80 transition-all duration-300 relative z-0 backdrop-blur-sm ${errors.password ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20" : ""
                  }`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-xl hover:bg-muted/50 z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <AnimatePresence>
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-destructive ml-1 flex items-center gap-1.5 font-medium mt-1.5"
                >
                  <AlertCircle className="w-3 h-3" />
                  {errors.password.message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Remember */}
          <div className="flex items-center space-x-3 px-1">
            <Checkbox
              id="remember"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              className="w-5 h-5 border-2 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all duration-200 rounded-[6px]"
            />
            <label
              htmlFor="remember"
              className="text-sm text-muted-foreground cursor-pointer select-none font-medium hover:text-foreground transition-colors"
            >
              Ghi nhớ đăng nhập
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-primary to-primary/90 text-primary-foreground hover:opacity-90 rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70 disabled:hover:scale-100"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang xác thực...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Đăng nhập
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground font-medium">
            Chưa có tài khoản?{" "}
            <Link
              href="/register"
              className="text-primary hover:text-primary/80 font-bold hover:underline transition-colors ml-1"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </motion.div>
    </>
  );
}

