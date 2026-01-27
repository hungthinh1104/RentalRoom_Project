"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { formatAuthError } from "../utils/format-auth-error";
import { toast } from "sonner";
import {
  Home,
  Building2,
  Mail,
  Phone,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "../hooks/use-register";
import { registerSchema, type RegisterInput } from "../schemas";
import { UserRole } from "@/types";
import { RoleBackground } from "./role-background";
import { authRateLimiter } from "@/lib/security/rate-limiter";

type AuthRole = UserRole.TENANT | UserRole.LANDLORD;

export function RegisterForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<AuthRole>(UserRole.TENANT);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { mutate: register, isPending, error: registerError } = useRegister();

  // 🛡️ SECURITY: Rate limiting state
  const [isRateLimited, setIsRateLimited] = React.useState(false);
  const [backoffSeconds, setBackoffSeconds] = React.useState(0);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setValue,
    control,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: UserRole.TENANT,
    },
  });

  // 🛡️ SECURITY: Update backoff timer
  React.useEffect(() => {
    if (!isRateLimited) return;

    const interval = setInterval(() => {
      const remaining = authRateLimiter.getBackoffSeconds('register');
      setBackoffSeconds(remaining);

      if (remaining === 0) {
        setIsRateLimited(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRateLimited]);

  const handleRoleChange = (role: AuthRole) => {
    setSelectedRole(role);
    setValue("role", role);
  };

  const onSubmit = (data: RegisterInput) => {
    // 🛡️ SECURITY: Check rate limit
    if (!authRateLimiter.isAllowed('register')) {
      const backoff = authRateLimiter.getBackoffSeconds('register');
      setIsRateLimited(true);
      setBackoffSeconds(backoff);
      toast.error(`Quá nhiều lần thử. Vui lòng đợi ${backoff} giây`);
      return;
    }

    const { phone, ...rest } = data;
    const payload = {
      ...rest,
      phone,
      role: selectedRole,
    };

    register(payload, {
      onSuccess: () => {
        // 🛡️ SECURITY: Reset rate limiter on success
        authRateLimiter.reset('register');
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      },
      onError: () => {
        // 🛡️ SECURITY: Record failed attempt
        authRateLimiter.recordAttempt('register');
        const attemptCount = authRateLimiter.getAttemptCount('register');

        if (attemptCount >= 3) {
          toast.warning(`Lần thử ${attemptCount}/5. Hãy cẩn thận!`);
        }
      },
    });
  };

  const password = useWatch({ control, name: "password" }) as string | undefined;
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) as string | undefined;
  const passwordsMismatch = Boolean(confirmPassword && password !== confirmPassword);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {/* Background Layer - Full Screen (Fixed) */}
      <RoleBackground role={selectedRole} />

      {/* Foreground Layer - Glass Card */}
      <div
        className="w-full max-w-lg"
      >
        <div className="glass-card rounded-[32px] p-8 md:p-10 space-y-8 shadow-2xl relative overflow-hidden ring-1 ring-white/20 backdrop-blur-xl">

          {/* Header */}
          <div className="space-y-4 text-center">
            <div
              key={selectedRole}
              className={`inline-flex items-center justify-center p-3 rounded-2xl mb-2 ${selectedRole === UserRole.TENANT ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
                }`}
            >
              {selectedRole === UserRole.TENANT ? <Home className="w-8 h-8" /> : <Building2 className="w-8 h-8" />}
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Tạo tài khoản
              </h1>
              <p className="text-muted-foreground text-sm font-medium">
                {selectedRole === UserRole.TENANT
                  ? "Bắt đầu hành trình tìm kiếm không gian sống"
                  : "Đăng tin và quản lý bất động sản hiệu quả"}
              </p>
            </div>
          </div>

          {/* Role Switcher - Segmented Control */}
          <div className="p-1 bg-muted/50 rounded-2xl border border-white/10 backdrop-blur-md relative z-10">
            <div className="flex relative">
              {/* Sliding Background */}
              <div
                className={`absolute top-0 bottom-0 rounded-xl shadow-sm ${selectedRole === UserRole.TENANT ? 'bg-background' : 'bg-background translate-x-[100%]'
                  }`}
                style={{ width: '50%' }}
              />

              <button
                type="button"
                onClick={() => handleRoleChange(UserRole.TENANT)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold relative z-10 transition-colors duration-200 ${selectedRole === UserRole.TENANT ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                  }`}
              >
                <Home className="w-4 h-4" />
                <span>Thuê phòng</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange(UserRole.LANDLORD)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold relative z-10 transition-colors duration-200 ${selectedRole === UserRole.LANDLORD ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'
                  }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Cho thuê</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Rate Limit Warning */}
            {isRateLimited && (
              <div
                className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-3 backdrop-blur-md overflow-hidden"
              >
                <Shield className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-warning leading-relaxed font-medium">
                    Quá nhiều lần thử đăng ký. Vui lòng đợi {backoffSeconds} giây.
                  </p>
                  <p className="text-[10px] text-warning/70 mt-0.5">
                    Đây là biện pháp bảo mật để ngăn chặn spam.
                  </p>
                </div>
              </div>
            )}

            {/* Global Error */}
            {(registerError && !isRateLimited) && (
              <div
                className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 backdrop-blur-md overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed font-medium">
                  {formatAuthError(registerError)}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-foreground/80 ml-1">
                  Họ và tên
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary z-10" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className={`h-11 pl-10 bg-background/50 border-input/40 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 relative z-0 backdrop-blur-sm ${errors.fullName
                      ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
                      : ""
                      }`}
                    disabled={isPending}
                    {...registerField("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-xs text-destructive ml-1 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.fullName.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-foreground/80 ml-1">
                  Số điện thoại
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary z-10" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0912345678"
                    className={`h-11 pl-10 bg-background/50 border-input/40 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 relative z-0 backdrop-blur-sm ${errors.phone
                      ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
                      : ""
                      }`}
                    disabled={isPending}
                    {...registerField("phone")}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-destructive ml-1 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.phone.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-foreground/80 ml-1">
                  Email
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={`h-11 pl-10 bg-background/50 border-input/40 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 relative z-0 backdrop-blur-sm ${errors.email
                      ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
                      : ""
                      }`}
                    disabled={isPending}
                    {...registerField("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive ml-1 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" /> {errors.email.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold text-foreground/80 ml-1">
                    Mật khẩu
                  </Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary z-10" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`h-11 pl-10 pr-10 bg-background/50 border-input/40 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 relative z-0 backdrop-blur-sm ${errors.password
                        ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
                        : ""
                        }`}
                      disabled={isPending}
                      {...registerField("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50 z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground/80 ml-1">
                    Xác nhận lại
                  </Label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary z-10" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`h-11 pl-10 pr-10 bg-background/50 border-input/40 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 relative z-0 backdrop-blur-sm ${errors.confirmPassword || passwordsMismatch
                        ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
                        : ""
                        }`}
                      disabled={isPending}
                      {...registerField("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50 z-10"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              {/* Password Errors Group */}
              {(errors.password || errors.confirmPassword || passwordsMismatch) && (
                <p className="text-xs text-destructive ml-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password?.message || errors.confirmPassword?.message || "Mật khẩu không khớp"}
                </p>
              )}
            </div>

            <div className="text-xs text-muted-foreground pt-1 text-center">
              Bằng việc đăng ký, bạn đồng ý với{" "}
              <Link href="/terms" className="text-primary hover:underline font-semibold transition-colors">
                Điều khoản
              </Link>{" "}
              và{" "}
              <Link href="/privacy" className="text-primary hover:underline font-semibold transition-colors">
                Chính sách
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isPending || passwordsMismatch || isRateLimited}
              className={`w-full h-12 text-sm font-bold text-white rounded-xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ring-offset-2 focus-visible:ring-2 disabled:opacity-70 ${selectedRole === UserRole.TENANT
                ? "bg-gradient-to-r from-info to-info/80 hover:from-info/90 hover:to-info/70 focus-visible:ring-info shadow-info/20"
                : "bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 focus-visible:ring-warning shadow-warning/20"
                }`}
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Tạo tài khoản
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground pt-1 font-medium">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-primary hover:text-primary-hover underline-offset-4 hover:underline transition-colors font-bold ml-1">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

