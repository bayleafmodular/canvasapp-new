import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff', 'user']).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'staff', 'user']),
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  permissions: z.record(z.string(), z.boolean()),
});

export const updateStaffSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  email: z.string().trim().toLowerCase().email('Enter a valid email').optional(),
  permissions: z.record(z.string(), z.boolean()),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
