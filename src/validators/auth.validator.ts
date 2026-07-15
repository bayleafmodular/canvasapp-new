import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  otp: z.string().trim().min(1, 'OTP is required'),
});

export const resendOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email is required'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  otp: z.string().trim().min(1, 'OTP is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const verifyLogin2faSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  otp: z.string().trim().min(1, 'OTP is required'),
});

export const oauthLoginSchema = z.object({
  accessToken: z.string().min(1, 'OAuth access token is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  username: z.string().trim().nullable().optional(),
  fullName: z.string().trim().nullable().optional(),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().nullable().optional(),
  profilePicUrl: z.string().trim().nullable().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const toggle2faSchema = z.object({
  enabled: z.boolean(),
});

export const linkGoogleSchema = z.object({
  accessToken: z.string().min(1, 'OAuth access token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyLogin2faInput = z.infer<typeof verifyLogin2faSchema>;
export type OauthLoginInput = z.infer<typeof oauthLoginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type Toggle2faInput = z.infer<typeof toggle2faSchema>;
export type LinkGoogleInput = z.infer<typeof linkGoogleSchema>;
