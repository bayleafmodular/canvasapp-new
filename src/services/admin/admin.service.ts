import bcrypt from 'bcryptjs';
import { AdminRepository } from '@/repositories/admin/admin.repository';
import { PublicUser } from '@/types/auth';
import { CreateUserInput, CreateStaffInput, UpdateStaffInput } from '@/validators/admin/admin.validator';

export class AdminError extends Error {
  constructor(public message: string, public status: number) {
    super(message);
    this.name = 'AdminError';
  }
}

export class AdminService {
  static async listUsers(options: { page?: number; limit?: number; search?: string } = {}): Promise<{ data: PublicUser[]; total: number }> {
    return AdminRepository.listUsers(options);
  }

  static async createManagedUser(input: CreateUserInput): Promise<PublicUser> {
    const { name, email, password, role = 'user' } = input;
    
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      return await AdminRepository.createManagedUser({
        name,
        email,
        passwordHash,
        role: role as 'admin' | 'staff' | 'user',
      });
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AdminError('Email already in use', 400);
      }
      throw err;
    }
  }

  static async updateUserRole(id: string, role: 'admin' | 'staff' | 'user'): Promise<PublicUser> {
    const user = await AdminRepository.updateUserRole(id, role);
    if (!user) {
      throw new AdminError('User not found', 404);
    }
    return user;
  }

  static async deleteUser(id: string): Promise<{ message: string }> {
    const user = await AdminRepository.deleteUser(id);
    if (!user) {
      throw new AdminError('User not found', 404);
    }
    return { message: 'User deleted' };
  }

  static async listStaff(): Promise<PublicUser[]> {
    return AdminRepository.listStaff();
  }

  static async createStaff(input: CreateStaffInput): Promise<PublicUser> {
    const { name, email, password, permissions } = input;

    try {
      const passwordHash = await bcrypt.hash(password, 10);
      return await AdminRepository.createStaff({
        name,
        email,
        passwordHash,
        permissions,
      });
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AdminError('Email already in use', 400);
      }
      throw err;
    }
  }

  static async updateStaff(id: string, input: UpdateStaffInput): Promise<PublicUser> {
    try {
      const staff = await AdminRepository.updateStaff(id, {
        name: input.name,
        email: input.email,
        permissions: input.permissions,
      });
      if (!staff) {
        throw new AdminError('Staff user not found', 404);
      }
      return staff;
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AdminError('Email already in use', 400);
      }
      throw err;
    }
  }

  static async getDashboardStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    staffCount: number;
    adminCount: number;
    recentUsers: PublicUser[];
  }> {
    const [totalUsers, staffCount, adminCount, recentUsers] = await Promise.all([
      AdminRepository.countUsers(),
      AdminRepository.countUsers('staff'),
      AdminRepository.countUsers('admin'),
      AdminRepository.listRecentUsers(5),
    ]);

    return {
      totalUsers,
      activeUsers: totalUsers,
      staffCount,
      adminCount,
      recentUsers,
    };
  }
}
