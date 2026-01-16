"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react"
import { formatAuthError } from "../utils/format-auth-error"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useLogin } from "../hooks/use-auth"
import { loginSchema, type LoginInput } from "../schemas"
import { getCallbackUrl, normalizeRedirectTarget } from "@/lib/redirect-after-login";

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isPending, error } = useLogin()
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-lg glass-card rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden ring-1 ring-white/10"
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -z-10 animate-pulse-soft" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -z-10" />

      {/* Header */}
      <div className="space-y-3 text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 ring-1 ring-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.3)]"
        >
          <Lock className="w-6 h-6" />
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold text-foreground tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Chào mừng trở lại
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Nhập thông tin của bạn để truy cập hệ thống
        </motion.p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Global Error */}
        <AnimatePresence mode="wait">
          {(error || signInErrorState) && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 overflow-hidden backdrop-blur-md"
            >
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive leading-relaxed font-medium">
                {formatAuthError(signInErrorState ?? error)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-foreground ml-1">Email</Label>
          <div className="relative group/input">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isPending}
              className={`h-12 pl-12 bg-background/40 border-input/50 text-foreground rounded-2xl placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 ${errors.email ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20" : ""
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
                className="text-xs text-destructive ml-1 flex items-center gap-1.5 font-medium"
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
            <Label htmlFor="password" className="text-sm font-semibold text-foreground ml-1">Mật khẩu</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative group/input">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isPending}
              className={`h-12 pl-12 pr-12 bg-background/40 border-input/50 text-foreground rounded-2xl placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 ${errors.password ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20" : ""
                }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50"
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
                className="text-xs text-destructive ml-1 flex items-center gap-1.5 font-medium"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.password.message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Remember */}
        <div className="flex items-center space-x-2 px-1">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary border-primary/50"
          />
          <label
            htmlFor="remember"
            className="text-sm text-foreground/80 cursor-pointer select-none font-medium hover:text-foreground transition-colors"
          >
            Ghi nhớ đăng nhập
          </label>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full h-14 text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang xác thực...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Đăng nhập
              <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
            </span>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground mt-8 font-medium">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="text-primary hover:text-primary-hover font-semibold underline-offset-4 hover:underline transition-colors ml-1"
        >
          Đăng ký ngay
        </Link>
      </div>
    </motion.div>
  );
}

