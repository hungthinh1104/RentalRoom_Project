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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "../hooks/use-register";
import { registerSchema, type RegisterInput } from "../schemas";
import { UserRole } from "@/types";

type AuthRole = UserRole.TENANT | UserRole.LANDLORD;

type RoleFeature = { icon: React.ComponentType; text: string };

type RoleInfo = {
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType;
  color: string;
  features: RoleFeature[];
};

const roleInfo: Record<AuthRole, RoleInfo> = {
  TENANT: {
    title: "Người thuê phòng",
    badge: "Thuê phòng",
    description: "Tìm kiếm và thuê phòng trọ, căn hộ phù hợp với nhu cầu của bạn.",
    icon: Home,
    color: "from-primary/10 to-accent/10",
    features: [
      { icon: Search, text: "Tìm kiếm thông minh với AI" },
      { icon: ShieldCheck, text: "Quản lý hợp đồng dễ dàng" },
      { icon: FileCheck, text: "Đánh giá & phản hồi" },
      { icon: Zap, text: "Thanh toán an toàn" },
    ],
  },
  LANDLORD: {
    title: "Chủ nhà",
    badge: "Cho thuê",
    description: "Đăng tin cho thuê phòng và quản lý tài sản của bạn một cách hiệu quả.",
    icon: Building2,
    color: "from-accent/10 to-primary/10",
    features: [
      { icon: FileCheck, text: "Đăng tin nhanh chóng" },
      { icon: ShieldCheck, text: "Quản lý hợp đồng tập trung" },
      { icon: Zap, text: "Theo dõi thanh toán" },
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
    // Remove confirmPassword from payload and map `phone` -> `phoneNumber` for API
    const { phone, ...rest } = data;
    // Send 'phone' property (not phoneNumber) and exclude confirmPassword
    const payload = {
      ...rest,
      phone,
    };

    // Debug payload in dev to verify confirmPassword is not sent and phone property exists
    console.debug('[Register] payload', payload);

    register(payload, {
      onSuccess: () => {
        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
      },
    });
  };

  const currentRole = roleInfo[selectedRole];
  const RoleIcon = currentRole.icon;

  // Live check for password mismatch on frontend using useWatch (called unconditionally)
  const password = useWatch({ control, name: "password" }) as string | undefined;
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) as string | undefined;
  const passwordsMismatch = Boolean(confirmPassword && password !== confirmPassword);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[1800px] grid gap-8 lg:gap-12 grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] items-center">
        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-[var(--glass-bg)]/40 backdrop-blur-sm border border-border/20 rounded-3xl p-6 md:p-8 lg:p-10 space-y-6 max-w-[760px] mx-auto shadow-sm">
            {/* Header */}
            <div className="space-y-2 text-center lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-primary/60 to-primary/80 bg-clip-text text-transparent"
              >
                Tạo tài khoản
              </motion.h1>
              <p className="text-muted-foreground">
                Bắt đầu hành trình tìm kiếm phòng trọ lý tưởng
              </p>
            </div>

            {/* Role Selector */}
            <div className="flex gap-3 p-1.5 bg-muted/60 rounded-2xl">
              <button
                type="button"
                onClick={() => handleRoleChange(UserRole.TENANT)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedRole === UserRole.TENANT
                    ? "bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Thuê phòng</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange(UserRole.LANDLORD)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  selectedRole === UserRole.LANDLORD
                    ? "bg-gradient-to-br from-accent to-primary text-white shadow-lg shadow-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Cho thuê</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Global Error */}
              <AnimatePresence mode="wait">
                {registerError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3"
                  >
                    <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive flex-1 leading-relaxed">
                      {formatAuthError(registerError)}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Họ và tên
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      className={`h-11 pl-11 ${
                        errors.fullName
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      disabled={isPending}
                      {...registerField("fullName")}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {errors.fullName && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-destructive flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.fullName.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Số điện thoại
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="0912345678"
                      className={`h-11 pl-11 ${
                        errors.phone
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      disabled={isPending}
                      {...registerField("phone")}
                    />
                  </div>
                  <AnimatePresence mode="wait">
                    {errors.phone && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-destructive flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className={`h-11 pl-11 ${
                      errors.email
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }`}
                    disabled={isPending}
                    {...registerField("email")}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`h-11 pl-11 pr-11 ${
                        errors.password
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      disabled={isPending}
                      {...registerField("password")}
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Xác nhận mật khẩu
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`h-11 pl-11 pr-11 ${
                        errors.confirmPassword || passwordsMismatch
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      disabled={isPending}
                      {...registerField("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <AnimatePresence mode="wait">
                    {(errors.confirmPassword || passwordsMismatch) && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-destructive flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3 h-3" />
                        {errors.confirmPassword ? errors.confirmPassword.message : "Mật khẩu không khớp"}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>


              </div>

              <div className="text-xs text-muted-foreground pt-2">
                Bằng việc đăng ký, bạn đồng ý với{" "}
                <Link href="/terms" className="text-primary hover:underline font-medium">
                  Điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link href="/privacy" className="text-primary hover:underline font-medium">
                  Chính sách bảo mật
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isPending || passwordsMismatch}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/90 shadow-lg shadow-primary/20"
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Tạo tài khoản
                  </span>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-2">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Info Section */}
        <motion.div
          key={`info-${selectedRole}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className="hidden xl:block"
        >
          <div
            className={`bg-gradient-to-br ${currentRole.color} backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl shadow-primary/5 p-8 lg:p-10 space-y-6 sticky top-8`}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-white grid place-items-center shadow-lg">
                <span className="w-7 h-7">
                  <RoleIcon />
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vai trò đang chọn</p>
                <p className="text-xl font-semibold text-foreground">
                  {currentRole.title}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                {currentRole.title}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {currentRole.description}
              </p>
            </div>

            <div className="space-y-3">
              {currentRole.features.map((feature: RoleFeature, index: number) => {
                const FeatureIcon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-200"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/20 text-primary grid place-items-center flex-shrink-0">
                      <span className="w-5 h-5">
                        <FeatureIcon />
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {feature.text}
                    </p>
                  </motion.div>
                );
              })}
            </div>

            <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/20 border border-primary/20 text-foreground px-4 py-3 text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Chọn vai trò phù hợp để có trải nghiệm tốt nhất
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
