import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { AuthRepository, toPublicUser } from '@/repositories/auth.repository';
import { sendOtpEmail } from '@/utils/sendOtpEmail';
import {
  LoginInput,
  RegisterInput,
  VerifyOtpInput,
  ResendOtpInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyLogin2faInput,
  UpdateProfileInput,
  ChangePasswordInput,
  Toggle2faInput,
  LinkGoogleInput,
  OauthLoginInput,
} from '@/validators/auth.validator';
import { LoginResult, PublicUser } from '@/types/auth';

export class AuthError extends Error {
  constructor(public message: string, public status: number, public data?: any) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  static generateToken(id: string, role: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is missing');
    }
    return jwt.sign({ id, role }, secret, { expiresIn: '7d' });
  }

  private static generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async register(input: RegisterInput): Promise<{ message: string; email: string }> {
    const { name, email, password } = input;

    const existing = await AuthRepository.findUserByEmail(email);
    if (existing && existing.is_verified) {
      throw new AuthError('Email already in use', 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existing && !existing.is_verified) {
      await AuthRepository.updatePendingUser(existing.id, {
        name,
        passwordHash,
        otp,
        otpExpiry,
      });
    } else {
      await AuthRepository.createUser({
        name,
        email,
        passwordHash,
        otp,
        otpExpiry,
      });
    }

    await sendOtpEmail(email, name, otp);

    return { message: 'OTP sent to your email', email };
  }

  static async login(input: LoginInput): Promise<LoginResult> {
    const { email, password } = input;

    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new AuthError('Invalid credentials', 400);
    }

    if (!user.password_hash) {
      throw new AuthError('Please continue with Google login', 400);
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AuthError('Invalid credentials', 400);
    }

    if (!user.is_verified) {
      throw new AuthError('Please verify your email first', 403, { email });
    }

    if (user.two_factor_enabled) {
      const otp = this.generateOtp();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await AuthRepository.updateLoginOtp(user.id, otp, otpExpiry);
      await sendOtpEmail(user.email, user.name, otp);

      return { requiresTwoFactor: true, email: user.email };
    }

    const token = this.generateToken(user.id, user.role);
    const publicUser = toPublicUser(user);

    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return { token, user: publicUser };
  }

  static async verifyOtp(input: VerifyOtpInput): Promise<{ message: string; token: string; user: PublicUser }> {
    const { email, otp } = input;

    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new AuthError('User not found', 400);
    }

    if (user.is_verified) {
      throw new AuthError('Account already verified', 400);
    }

    if (user.otp !== otp) {
      throw new AuthError('Invalid OTP', 400);
    }

    if (!user.otp_expiry || new Date(user.otp_expiry) < new Date()) {
      throw new AuthError('OTP has expired', 400);
    }

    const verifiedUser = await AuthRepository.verifyUser(user.id);
    const token = this.generateToken(verifiedUser.id, verifiedUser.role);
    const publicUser = toPublicUser(verifiedUser);

    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return {
      message: 'Email verified successfully',
      token,
      user: publicUser,
    };
  }

  static async resendOtp(input: ResendOtpInput): Promise<{ message: string }> {
    const { email } = input;

    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new AuthError('User not found', 400);
    }

    if (user.is_verified) {
      throw new AuthError('Account already verified', 400);
    }

    const otp = this.generateOtp();
    await AuthRepository.updateOtp(user.id, otp, new Date(Date.now() + 10 * 60 * 1000));
    await sendOtpEmail(email, user.name, otp);

    return { message: 'OTP resent successfully' };
  }

  static async verifyLogin2fa(input: VerifyLogin2faInput): Promise<{ token: string; user: PublicUser }> {
    const { email, otp } = input;

    const user = await AuthRepository.findUserByEmail(email);
    if (!user || !user.two_factor_enabled) {
      throw new AuthError('Invalid 2FA request', 400);
    }

    if (user.login_otp !== otp) {
      throw new AuthError('Invalid OTP', 400);
    }

    if (!user.login_otp_expiry || new Date(user.login_otp_expiry) < new Date()) {
      throw new AuthError('OTP has expired', 400);
    }

    const verifiedUser = await AuthRepository.clearLoginOtp(user.id);
    const token = this.generateToken(verifiedUser.id, verifiedUser.role);
    const publicUser = toPublicUser(verifiedUser);

    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return { token, user: publicUser };
  }

  static async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const { email } = input;

    const user = await AuthRepository.findUserByEmail(email);
    if (user) {
      const otp = this.generateOtp();
      await AuthRepository.updateResetOtp(user.id, otp, new Date(Date.now() + 10 * 60 * 1000));
      await sendOtpEmail(user.email, user.name, otp);
    }

    // Always return success for security reasons (don't leak registered emails)
    return { message: 'If an account exists, a password reset OTP has been sent.' };
  }

  static async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const { email, otp, newPassword } = input;

    const user = await AuthRepository.findUserByEmail(email);
    if (!user) {
      throw new AuthError('Invalid reset request', 400);
    }

    if (user.reset_otp !== otp) {
      throw new AuthError('Invalid OTP', 400);
    }

    if (!user.reset_otp_expiry || new Date(user.reset_otp_expiry) < new Date()) {
      throw new AuthError('OTP has expired', 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await AuthRepository.resetPasswordHash(user.id, passwordHash);

    return { message: 'Password reset successfully' };
  }

  static async oauthLogin(input: OauthLoginInput): Promise<{ token: string; user: PublicUser }> {
    const { accessToken } = input;

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user?.email) {
      throw new AuthError('Invalid Google session', 401);
    }

    const oauthUser = data.user;
    const email = oauthUser.email!;
    const name =
      oauthUser.user_metadata?.full_name ||
      oauthUser.user_metadata?.name ||
      email.split('@')[0];

    const dbUser = await AuthRepository.upsertOAuthUser(name, email);
    const token = this.generateToken(dbUser.id, dbUser.role);
    const publicUser = toPublicUser(dbUser);

    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return { token, user: publicUser };
  }

  static async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    try {
      const user = await AuthRepository.updateProfile(userId, {
        name: input.name,
        username: input.username,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        profilePicUrl: input.profilePicUrl,
      });

      const publicUser = toPublicUser(user);
      if (!publicUser) {
        throw new AuthError('Failed to format user details', 500);
      }
      return publicUser;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AuthError('Email or username already in use', 400);
      }
      throw err;
    }
  }

  static async changePassword(userId: string, input: ChangePasswordInput): Promise<{ message: string; user: PublicUser }> {
    const user = await AuthRepository.findUserById(userId);
    if (!user) {
      throw new AuthError('User not found', 404);
    }

    if (user.password_hash) {
      if (!input.currentPassword) {
        throw new AuthError('Current password is required', 400);
      }

      const isMatch = await bcrypt.compare(input.currentPassword, user.password_hash);
      if (!isMatch) {
        throw new AuthError('Current password is incorrect', 400);
      }
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    const updatedUser = await AuthRepository.updatePasswordHash(userId, passwordHash);
    const publicUser = toPublicUser(updatedUser);

    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return {
      message: 'Password updated successfully',
      user: publicUser,
    };
  }

  static async toggle2fa(userId: string, input: Toggle2faInput): Promise<PublicUser> {
    const user = await AuthRepository.setTwoFactorEnabled(userId, input.enabled);
    const publicUser = toPublicUser(user);

    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return publicUser;
  }

  static async linkGoogle(userId: string, activeUserEmail: string, input: LinkGoogleInput): Promise<PublicUser> {
    const { accessToken } = input;

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data?.user?.email) {
      throw new AuthError('Invalid Google session', 401);
    }

    if (data.user.email.toLowerCase() !== activeUserEmail.toLowerCase()) {
      throw new AuthError('Google account email must match your account email', 400);
    }

    const user = await AuthRepository.markGoogleLinked(userId);
    const publicUser = toPublicUser(user);

    if (!publicUser) {
      throw new AuthError('Failed to format user details', 500);
    }

    return publicUser;
  }
}
