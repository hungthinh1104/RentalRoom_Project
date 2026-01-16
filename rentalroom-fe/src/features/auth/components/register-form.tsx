"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { formatAuthError } from "../utils/format-auth-error";
import {
  Home,
  Building2,
  Mail,
  Phone,
  Lock,
  User,
  ShieldCheck,
  Search,
  FileCheck,
  Zap,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useRegister } from "../hooks/use-register";
import { registerSchema, type RegisterInput } from "../schemas";
import { UserRole } from "@/types";

type AuthRole = UserRole.TENANT | UserRole.LANDLORD;

type RoleFeature = { icon: React.ComponentType<{ className?: string }>; text: string };

type RoleInfo = {
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  features: RoleFeature[];
};

const roleInfo: Record<AuthRole, RoleInfo> = {
  TENANT: {
    title: "Người thuê phòng",
    badge: "Thuê phòng",
    description: "Tìm kiếm và thuê phòng trọ, căn hộ phù hợp với nhu cầu của bạn.",
    icon: Home,
    color: "from-info/20 to-primary/20",
    features: [
      { icon: Search, text: "Tìm kiếm thông minh với AI" },
      { icon: ShieldCheck, text: "Quản lý hợp đồng dễ dàng" },
      { icon: FileCheck, text: "Đánh giá & phản hồi minh bạch" },
      { icon: Zap, text: "Thanh toán an toàn, nhanh chóng" },
    ],
  },
  LANDLORD: {
    title: "Chủ nhà",
    badge: "Cho thuê",
    description: "Đăng tin cho thuê phòng và quản lý tài sản của bạn một cách hiệu quả.",
    icon: Building2,
    color: "from-warning/20 to-destructive/20",
    features: [
      { icon: FileCheck, text: "Đăng tin nhanh chóng" },
      { icon: ShieldCheck, text: "Quản lý hợp đồng tập trung" },
      { icon: Zap, text: "Theo dõi thanh toán tự động" },
      { icon: Search, text: "Tìm kiếm người thuê uy tín" },
    ],
  },
};

export function RegisterForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = React.useState<AuthRole>(UserRole.TENANT);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const { mutate: register, isPending, error: registerError } = useRegister();

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

  const handleRoleChange = (role: AuthRole) => {
    setSelectedRole(role);
    setValue("role", role);
  };

  const onSubmit = (data: RegisterInput) => {
    const { phone, ...rest } = data;
    const payload = {
      ...rest,
      phone,
      role: selectedRole,
    };

    register(payload, {
      onSuccess: () => {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      },
    });
  };

  const currentRole = roleInfo[selectedRole];
  const RoleIcon = currentRole.icon;
  const password = useWatch({ control, name: "password" }) as string | undefined;
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) as string | undefined;
  const passwordsMismatch = Boolean(confirmPassword && password !== confirmPassword);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="glass-card rounded-[32px] p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10 animate-pulse-soft" />

        {/* Header */}
        <div className="space-y-3 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-foreground tracking-tight"
          >
            Tạo tài khoản
          </motion.h1>
          <p className="text-muted-foreground text-sm">
            Bắt đầu hành trình tìm kiếm không gian sống lý tưởng
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-4 p-1.5 bg-muted/40 rounded-2xl border border-input/50 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleRoleChange(UserRole.TENANT)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group/role ${selectedRole === UserRole.TENANT
              ? "bg-info text-info-foreground shadow-lg shadow-info/20 ring-1 ring-white/10"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-tr from-cyan-400/20 to-transparent opacity-0 transition-opacity ${selectedRole === UserRole.TENANT ? 'opacity-100' : 'group-hover/role:opacity-100'}`} />
            <Home className={`w-4 h-4 relative z-10 transition-transform ${selectedRole === UserRole.TENANT ? 'scale-110' : ''}`} />
            <span className="relative z-10">Thuê phòng</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange(UserRole.LANDLORD)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative overflow-hidden group/role ${selectedRole === UserRole.LANDLORD
              ? "bg-warning text-warning-foreground shadow-lg shadow-warning/20 ring-1 ring-white/10"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
          >
            <div className={`absolute inset-0 bg-gradient-to-tr from-orange-400/20 to-transparent opacity-0 transition-opacity ${selectedRole === UserRole.LANDLORD ? 'opacity-100' : 'group-hover/role:opacity-100'}`} />
            <Building2 className={`w-4 h-4 relative z-10 transition-transform ${selectedRole === UserRole.LANDLORD ? 'scale-110' : ''}`} />
            <span className="relative z-10">Cho thuê</span>
          </button>
        </div>

        {/* Role Info - Static & Reliable */}
        <div key={selectedRole} className="mt-3 bg-muted/30 rounded-xl border border-border/50 p-4 transition-all animate-fade-in">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 p-2 rounded-lg ${selectedRole === UserRole.TENANT ? 'bg-blue-500/10 text-blue-500' : 'bg-orange-500/10 text-orange-500'}`}>
              <RoleIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm text-foreground">{currentRole.title}</p>
              <p className="text-xs text-muted-foreground">{currentRole.description}</p>

              <div className="flex flex-wrap gap-2 pt-2">
                {currentRole.features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <span key={i} className="inline-flex items-center gap-1 text-[10px] bg-background border border-border px-2 py-1 rounded-md text-foreground/80">
                      <Icon className="w-3 h-3 text-primary" /> {f.text}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Global Error */}
          <AnimatePresence mode="wait">
            {registerError && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3 backdrop-blur-md overflow-hidden"
              >
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive leading-relaxed font-medium">
                  {formatAuthError(registerError)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-semibold text-foreground ml-1">
                Họ và tên
              </Label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className={`h-11 pl-10 bg-background/40 border-input/50 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 ${errors.fullName
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
              <Label htmlFor="phone" className="text-xs font-semibold text-foreground ml-1">
                Số điện thoại
              </Label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912345678"
                  className={`h-11 pl-10 bg-background/40 border-input/50 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 ${errors.phone
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
              <Label htmlFor="email" className="text-xs font-semibold text-foreground ml-1">
                Email
              </Label>
              <div className="relative group/input">
                <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={`h-11 pl-10 bg-background/40 border-input/50 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 ${errors.email
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
                <Label htmlFor="password" className="text-xs font-semibold text-foreground ml-1">
                  Mật khẩu
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`h-11 pl-10 pr-10 bg-background/40 border-input/50 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 ${errors.password
                      ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
                      : ""
                      }`}
                    disabled={isPending}
                    {...registerField("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50"
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
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground ml-1">
                  Xác nhận lại
                </Label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-primary/5 rounded-xl blur-md transition-opacity opacity-0 group-focus-within/input:opacity-100" />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within/input:text-primary" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`h-11 pl-10 pr-10 bg-background/40 border-input/50 text-foreground rounded-xl text-sm placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 hover:border-primary/30 transition-all duration-300 ${errors.confirmPassword || passwordsMismatch
                      ? "border-destructive/50 focus-visible:border-destructive focus-visible:ring-destructive/20"
                      : ""
                      }`}
                    disabled={isPending}
                    {...registerField("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted/50"
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
            disabled={isPending || passwordsMismatch}
            className="w-full h-12 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-xl shadow-primary/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-70"
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
    </motion.div>
  );
}

