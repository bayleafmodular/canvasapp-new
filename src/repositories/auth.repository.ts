import { supabase } from '@/lib/supabase';
import { DatabaseUser, PublicUser, UserPermissions, UserRole } from '@/types/auth';

const USERS_TABLE = 'app_users';

const PERMISSIONS = [
  'dashboard.show',
  'dashboard.create',
  'dashboard.edit',
  'staff.show',
  'staff.create',
  'staff.edit',
  'users.show',
  'users.create',
  'users.edit',
  'pricing.edit',
  'templates.show',
  'templates.create',
  'templates.edit',
];

export const adminPermissions = PERMISSIONS.reduce<Record<string, boolean>>((acc, permission) => {
  acc[permission] = true;
  return acc;
}, {}) as UserPermissions;

export const normalizePermissions = (permissions: Record<string, boolean> = {}): UserPermissions => {
  return PERMISSIONS.reduce<Record<string, boolean>>((acc, permission) => {
    acc[permission] = Boolean(permissions[permission]);
    return acc;
  }, {}) as UserPermissions;
};

export const toPublicUser = (row: any): PublicUser | null => {
  if (!row) return null;
  const permissions = row.role === 'admin'
    ? adminPermissions
    : normalizePermissions(row.permissions);

  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    username: row.username || null,
    fullName: row.full_name || null,
    email: row.email,
    phone: row.phone || null,
    profilePicUrl: row.profile_pic_url || null,
    role: row.role as UserRole,
    permissions,
    isVerified: row.is_verified,
    twoFactorEnabled: row.two_factor_enabled,
    googleLinked: row.google_linked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export class AuthRepository {
  static getConfiguredRole(email: string): UserRole {
    const normalized = email.toLowerCase();
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    const staffEmails = (process.env.STAFF_EMAILS || '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (adminEmails.includes(normalized)) return 'admin';
    if (staffEmails.includes(normalized)) return 'staff';
    return 'user';
  }

  static async findUserByEmail(email: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async findUserById(id: string): Promise<DatabaseUser | null> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  static async createUser(userData: {
    name: string;
    email: string;
    passwordHash: string;
    otp: string;
    otpExpiry: Date;
  }): Promise<DatabaseUser> {
    const role = this.getConfiguredRole(userData.email);
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert({
        name: userData.name,
        full_name: userData.name,
        email: userData.email.toLowerCase(),
        password_hash: userData.passwordHash,
        role,
        permissions: {},
        otp: userData.otp,
        otp_expiry: userData.otpExpiry.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePendingUser(
    id: string,
    userData: {
      name: string;
      passwordHash: string;
      otp: string;
      otpExpiry: Date;
    }
  ): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        name: userData.name,
        password_hash: userData.passwordHash,
        otp: userData.otp,
        otp_expiry: userData.otpExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateOtp(id: string, otp: string, otpExpiry: Date): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        otp,
        otp_expiry: otpExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async verifyUser(id: string): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        is_verified: true,
        otp: null,
        otp_expiry: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateLoginOtp(id: string, otp: string, otpExpiry: Date): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        login_otp: otp,
        login_otp_expiry: otpExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async clearLoginOtp(id: string): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        login_otp: null,
        login_otp_expiry: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateResetOtp(id: string, otp: string, otpExpiry: Date): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        reset_otp: otp,
        reset_otp_expiry: otpExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async resetPasswordHash(id: string, passwordHash: string): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        password_hash: passwordHash,
        reset_otp: null,
        reset_otp_expiry: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async upsertOAuthUser(name: string, email: string): Promise<DatabaseUser> {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.findUserByEmail(normalizedEmail);

    if (existing) {
      const { data, error } = await supabase
        .from(USERS_TABLE)
        .update({
          name: existing.name || name,
          full_name: existing.full_name || name,
          is_verified: true,
          google_linked: true,
          otp: null,
          otp_expiry: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const role = this.getConfiguredRole(normalizedEmail);
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert({
        name,
        full_name: name,
        email: normalizedEmail,
        role,
        permissions: role === 'admin' ? adminPermissions : {},
        is_verified: true,
        google_linked: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateProfile(
    id: string,
    profileData: {
      name?: string;
      username?: string | null;
      fullName?: string | null;
      email?: string;
      phone?: string | null;
      profilePicUrl?: string | null;
    }
  ): Promise<DatabaseUser> {
    const update: any = { updated_at: new Date().toISOString() };

    if (profileData.name !== undefined) update.name = profileData.name;
    if (profileData.username !== undefined) update.username = profileData.username;
    if (profileData.fullName !== undefined) update.full_name = profileData.fullName;
    if (profileData.email !== undefined) update.email = profileData.email.toLowerCase();
    if (profileData.phone !== undefined) update.phone = profileData.phone;
    if (profileData.profilePicUrl !== undefined) update.profile_pic_url = profileData.profilePicUrl;

    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePasswordHash(id: string, passwordHash: string): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async setTwoFactorEnabled(id: string, enabled: boolean): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        two_factor_enabled: enabled,
        login_otp: null,
        login_otp_expiry: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async markGoogleLinked(id: string): Promise<DatabaseUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({
        google_linked: true,
        is_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
