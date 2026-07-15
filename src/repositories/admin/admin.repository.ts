import { supabase } from '@/lib/supabase';
import { DatabaseUser, PublicUser } from '@/types/auth';
import { toPublicUser, normalizePermissions } from '@/repositories/auth.repository';

const USERS_TABLE = 'app_users';

export class AdminRepository {
  static async listUsers(): Promise<PublicUser[]> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id,name,email,role,permissions,is_verified,created_at,updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => toPublicUser(row)).filter(Boolean) as PublicUser[];
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

  static async createManagedUser(userData: {
    name: string;
    email: string;
    passwordHash: string;
    role: 'admin' | 'staff' | 'user';
  }): Promise<PublicUser> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert({
        name: userData.name,
        full_name: userData.name,
        email: userData.email.toLowerCase(),
        password_hash: userData.passwordHash,
        role: userData.role,
        permissions: {},
        is_verified: true,
      })
      .select('id,name,email,role,permissions,is_verified,created_at,updated_at')
      .single();

    if (error) throw error;
    const publicUser = toPublicUser(data);
    if (!publicUser) throw new Error('Failed to parse created user');
    return publicUser;
  }

  static async updateUserRole(id: string, role: 'admin' | 'staff' | 'user'): Promise<PublicUser | null> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,name,email,role,permissions,is_verified,created_at,updated_at')
      .maybeSingle();

    if (error) throw error;
    return toPublicUser(data);
  }

  static async deleteUser(id: string): Promise<DatabaseUser | null> {
    const existing = await this.findUserById(id);
    if (!existing) return null;

    const { error } = await supabase.from(USERS_TABLE).delete().eq('id', id);
    if (error) throw error;

    return existing;
  }

  static async listStaff(): Promise<PublicUser[]> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id,name,email,role,permissions,is_verified,created_at,updated_at')
      .eq('role', 'staff')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => toPublicUser(row)).filter(Boolean) as PublicUser[];
  }

  static async createStaff(userData: {
    name: string;
    email: string;
    passwordHash: string;
    permissions: Record<string, boolean>;
  }): Promise<PublicUser> {
    const normalized = normalizePermissions(userData.permissions);
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .insert({
        name: userData.name,
        full_name: userData.name,
        email: userData.email.toLowerCase(),
        password_hash: userData.passwordHash,
        role: 'staff',
        permissions: normalized,
        is_verified: true,
      })
      .select('id,name,email,role,permissions,is_verified,created_at,updated_at')
      .single();

    if (error) throw error;
    const publicUser = toPublicUser(data);
    if (!publicUser) throw new Error('Failed to parse created staff member');
    return publicUser;
  }

  static async updateStaff(
    id: string,
    userData: {
      name?: string;
      email?: string;
      permissions: Record<string, boolean>;
    }
  ): Promise<PublicUser | null> {
    const normalized = normalizePermissions(userData.permissions);
    const update: any = {
      permissions: normalized,
      updated_at: new Date().toISOString(),
    };

    if (userData.name) update.name = userData.name;
    if (userData.email) update.email = userData.email.toLowerCase();

    const { data, error } = await supabase
      .from(USERS_TABLE)
      .update(update)
      .eq('id', id)
      .eq('role', 'staff')
      .select('id,name,email,role,permissions,is_verified,created_at,updated_at')
      .maybeSingle();

    if (error) throw error;
    return toPublicUser(data);
  }

  static async countUsers(role?: string): Promise<number> {
    let query = supabase.from(USERS_TABLE).select('id', { count: 'exact', head: true });
    if (role) query = query.eq('role', role);

    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  }

  static async listRecentUsers(limit: number): Promise<PublicUser[]> {
    const { data, error } = await supabase
      .from(USERS_TABLE)
      .select('id,name,email,role,permissions,is_verified,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((row) => toPublicUser(row)).filter(Boolean) as PublicUser[];
  }
}
