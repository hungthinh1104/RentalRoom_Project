/**
 * Auth Validation Schemas
 * 
 * Zod schemas for form validation with Vietnamese error messages
 * All schemas follow Product Engineer standards
 */

import { z } from "zod";

/**
 * Login form validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});

/**
 * Register form validation
 */
export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Họ tên phải có ít nhất 2 ký tự")
    .max(100, "Họ tên quá dài"),
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"),
  phone: z
    .string()
    .nonempty("Số điện thoại không được để trống")
    .min(10, "Số điện thoại phải có ít nhất 10 số")
    .max(11, "Số điện thoại không hợp lệ")
    .regex(/^[0-9]+$/, "Số điện thoại chỉ chứa chữ số"),
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(100, "Mật khẩu quá dài"),
  confirmPassword: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  role: z.enum(["TENANT", "LANDLORD"], {
    message: "Vui lòng chọn vai trò",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

/**
 * Email verification validation
 */
export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(6, "Mã xác thực phải có 6 ký tự")
    .regex(/^[0-9]+$/, "Mã xác thực chỉ chứa chữ số"),
});

/**
 * Resend verification validation
 */
export const resendVerificationSchema = z.object({
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"),
});

/**
 * Forgot password validation
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email là bắt buộc")
    .email("Email không hợp lệ"),
});

/**
 * Reset password validation
 */
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự")
    .max(100, "Mật khẩu quá dài"),
  confirmPassword: z
    .string()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

// Type exports for TypeScript inference
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

