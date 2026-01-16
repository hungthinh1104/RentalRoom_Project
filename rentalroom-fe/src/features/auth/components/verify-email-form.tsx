"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Loader2, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { formatAuthError } from "../utils/format-auth-error"

import { Button } from "@/components/ui/button"
import { VerificationInput } from "@/components/ui/verification-input"
import { useVerifyEmail, useResendVerification } from "../hooks/use-auth"
import Link from "next/link"

/**
 * Email Verification Form
 * Beautiful OTP-style verification with individual digit inputs
 * Includes auto-submit, resend functionality, and smooth animations
 */
export function VerifyEmailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''

  const { mutate: verify, isPending: isVerifying, error: verifyError, reset: resetVerifyError } = useVerifyEmail()
  const { mutate: resend, isPending: isResending } = useResendVerification()

  const [code, setCode] = React.useState("")
  const [countdown, setCountdown] = React.useState(60)
  const [success, setSuccess] = React.useState(false)
  const [showResendSuccess, setShowResendSuccess] = React.useState(false)
  const [targetEmail, setTargetEmail] = React.useState(emailParam)
  const [emailInput, setEmailInput] = React.useState("")

  // Countdown timer for resend button
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-send verification code when arriving with email from register
  const hasAutoSent = React.useRef(false)
  React.useEffect(() => {
    if (targetEmail && !hasAutoSent.current && countdown === 60) {
      hasAutoSent.current = true
      resend(targetEmail, {
        onSuccess: () => {
          setShowResendSuccess(true)
          setTimeout(() => setShowResendSuccess(false), 2500)
        },
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetEmail])

  // Auto-submit when code is complete
  const handleCodeComplete = (completeCode: string) => {
    if (completeCode.length === 6 && !isVerifying) {
      verify(completeCode, {
        onSuccess: () => {
          setSuccess(true)
          setTimeout(() => {
            router.push('/login?verified=true')
          }, 2000)
        },
      })
    }
  }

  const handleCodeChange = (newCode: string) => {
    setCode(newCode)
    // Reset error when user types
    if (verifyError) {
      resetVerifyError()
    }
  }

  const handleResend = () => {
    if (countdown > 0 || !targetEmail) return

    resend(targetEmail, {
      onSuccess: () => {
        setCountdown(60)
        setCode("")
        setShowResendSuccess(true)
        setTimeout(() => setShowResendSuccess(false), 3000)
      },
    })
  }

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[760px]"
        >
          <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[32px] p-8 md:p-10 lg:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-success/20 rounded-full blur-[80px] -z-10 opacity-40" />
            <div className="flex flex-col items-center justify-center space-y-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-success/20 rounded-full blur-2xl animate-pulse" />
                <CheckCircle2 className="w-24 h-24 text-success relative" strokeWidth={1.5} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4 text-center"
              >
                <h2 className="text-4xl font-bold text-foreground tracking-tight">Xác thực thành công!</h2>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Email của bạn đã được xác thực.<br />
                  Đang chuyển hướng đến trang đăng nhập...
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-3 text-success bg-success/10 px-6 py-2 rounded-full border border-success/20"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Vui lòng đợi một chút...</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[760px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-[32px] p-8 md:p-10 lg:p-12 space-y-8 shadow-2xl relative overflow-hidden"
        >
          {/* Decorative Glow */}
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-[100px] -z-10 opacity-30" />

          {/* Header */}
          <div className="space-y-6 text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="mx-auto w-20 h-20 rounded-3xl bg-secondary/30 border border-input flex items-center justify-center shadow-inner"
            >
              <Mail className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </motion.div>

            {/* Title */}
            <div className="space-y-3">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-bold text-foreground tracking-tight"
              >
                Xác thực Email
              </motion.h1>
              <p className="text-muted-foreground text-lg">
                Nhập mã 6 chữ số đã được gửi đến
              </p>
              {targetEmail ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/30 border border-input text-foreground font-medium text-sm"
                >
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  {targetEmail}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 justify-center"
                >
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Nhập email"
                      className="w-full max-w-sm px-4 py-2 rounded-xl border border-input bg-secondary/30 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => {
                      if (!emailInput) return
                      setTargetEmail(emailInput)
                      setCountdown(60)
                      resend(emailInput, {
                        onSuccess: () => {
                          setShowResendSuccess(true)
                          setTimeout(() => setShowResendSuccess(false), 2500)
                        },
                      })
                    }}
                  >
                    Gửi mã
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
          {/* Verification Input */}
          <div className="space-y-6">
            <div className="flex justify-center">
              <VerificationInput
                length={6}
                value={code}
                onChange={handleCodeChange}
                onComplete={handleCodeComplete}
                disabled={isVerifying}
                error={!!verifyError}
                autoFocus

              />
            </div>

            {/* Helper text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-sm text-muted-foreground"
            >
              Mã sẽ tự động xác thực khi bạn nhập đủ 6 số
            </motion.p>
          </div>

          {/* Error message */}
          <AnimatePresence mode="wait">
            {verifyError && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-base font-medium text-destructive">
                      {formatAuthError(verifyError) === 'Đã có lỗi xảy ra. Vui lòng thử lại.' ? 'Mã xác thực không đúng hoặc đã hết hạn' : formatAuthError(verifyError)}
                    </p>
                    <p className="text-sm text-destructive/80 mt-1">
                      Vui lòng kiểm tra lại hoặc yêu cầu gửi lại mã mới
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resend success message */}
          <AnimatePresence mode="wait">
            {showResendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-success/10 border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <p className="text-sm font-medium text-success">
                    Mã xác thực mới đã được gửi đến email của bạn!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verifying state */}
          <AnimatePresence>
            {isVerifying && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-center gap-3 py-4 bg-secondary/30 rounded-2xl border border-input"
              >
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-primary">
                  Đang xác thực...
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resend section */}
          <div className="space-y-4 pt-6 border-t border-[var(--glass-border)]">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Không nhận được mã xác thực?
              </p>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleResend}
                disabled={countdown > 0 || isResending || !targetEmail}
                className="w-full h-14 relative overflow-hidden bg-secondary/30 border-input text-foreground hover:bg-secondary/50 hover:text-foreground group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang gửi lại...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Gửi lại sau {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                    Gửi lại mã xác thực
                  </>
                )}
              </Button>
            </div>

            {/* Back to login */}
            <div className="text-center">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-transparent"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại đăng nhập
                </Button>
              </Link>
            </div>
          </div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-2xl bg-secondary/30 border border-input space-y-2"
          >
            <p className="text-xs font-semibold text-foreground/80 flex items-center gap-2">
              <span className="text-lg">💡</span> Mẹo:
            </p>
            <ul className="text-xs text-muted-foreground space-y-1.5 pl-1">
              <li>• Kiểm tra cả thư mục spam/junk nếu không thấy email</li>
              <li>• Mã xác thực có hiệu lực trong 15 phút</li>
              <li>• Bạn có thể dán mã trực tiếp từ clipboard</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
