export type UserRole = 'admin' | 'staff' | 'user';

export interface UserPermissions {
  'dashboard.show': boolean;
  'dashboard.create': boolean;
  'dashboard.edit': boolean;
  'staff.show': boolean;
  'staff.create': boolean;
  'staff.edit': boolean;
  'users.show': boolean;
  'users.create': boolean;
  'users.edit': boolean;
  'pricing.edit': boolean;
  [key: string]: boolean;
}

export interface DatabaseUser {
  id: string;
  name: string;
  full_name?: string | null;
  username?: string | null;
  email: string;
  phone?: string | null;
  profile_pic_url?: string | null;
  password_hash?: string | null;
  role: UserRole;
  permissions: Record<string, boolean>;
  is_verified: boolean;
  two_factor_enabled: boolean;
  google_linked: boolean;
  otp?: string | null;
  otp_expiry?: string | null;
  login_otp?: string | null;
  login_otp_expiry?: string | null;
  reset_otp?: string | null;
  reset_otp_expiry?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublicUser {
  _id: string;
  id: string;
  name: string;
  username: string | null;
  fullName: string | null;
  email: string;
  phone: string | null;
  profilePicUrl: string | null;
  role: UserRole;
  permissions: UserPermissions;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  googleLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  requiresTwoFactor?: boolean;
  email?: string;
  token?: string;
  user?: PublicUser;
}
